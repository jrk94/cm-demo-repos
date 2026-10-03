using Cmf.Navigo.BusinessObjects;
using Microsoft.Extensions.Logging;
using SemiSimulator.Line;
using SemiSimulator.Mes;
using SemiSimulator.Steps;

namespace SemiSimulator.Pipeline
{
    /// <summary>
    /// Batch steps (e.g. PRE_CURE, CureWafers): a loop per step checks its queue and, once the waiting lots add up to
    /// the batch minimum, runs one batch (create, release, track in, track out) and moves its lots next.
    /// </summary>
    public sealed class BatchProcessor(
        LineDefinition line,
        BatchQueues queues,
        IMesGateway mes,
        IMaterialTracker tracker,
        ResourceCatalog resources,
        ResourceLocks locks,
        IOperatorCheckIn operatorCheckIn,
        SimulationClock clock,
        IRandomSource random,
        ILogger<BatchProcessor> logger)
    {
        /// <summary>
        /// Runs one consumer loop per batch step until <paramref name="token"/> is cancelled; every processed lot is
        /// handed to <paramref name="onProcessed"/>.
        /// </summary>
        public Task RunLoopsAsync(Action<Material> onProcessed, CancellationToken token) =>
            Task.WhenAll(line.Batches.Keys.Select(stepName => RunLoopAsync(stepName, onProcessed, token)));

        private async Task RunLoopAsync(string stepName, Action<Material> onProcessed, CancellationToken token)
        {
            var batch = line.Batches[stepName];
            var interval = clock.PollInterval(batch.CheckIntervalSeconds);

            while (!token.IsCancellationRequested)
            {
                try
                {
                    await Task.Delay(interval, token);
                }
                catch (OperationCanceledException)
                {
                    break;
                }

                // Under-provisioned: wait until the queued lots add up to the batch minimum
                var (waitingLots, waitingQuantity) = queues.Peek(stepName);
                if (waitingQuantity < batch.MinQuantity)
                {
                    logger.LogDebug($"{stepName} has {waitingLots} lot(s) waiting ({waitingQuantity}), need at least {batch.MinQuantity}");
                    continue;
                }

                try
                {
                    foreach (var lot in await ProcessAsync(stepName, queues.TakeAll(stepName), requeueLeftovers: true))
                    {
                        onProcessed(lot);
                    }
                }
                catch (Exception ex)
                {
                    logger.LogError($"{stepName} batch run failed: {ex.Message}");
                }
            }
        }

        /// <summary>
        /// Builds one batch from <paramref name="lots"/> (oldest first, within the step's min/max) and runs it on a random
        /// resource of the step: process time, batch lifecycle, move next. Lots left out go back to the step's queue when
        /// <paramref name="requeueLeftovers"/> is set. Returns the processed lots (empty when no batch could be made).
        /// </summary>
        public async Task<List<Material>> ProcessAsync(string stepName, IEnumerable<Material> lots, bool requeueLeftovers = false)
        {
            var batch = line.Batches.TryGetValue(stepName, out var rules)
                ? rules
                : throw new InvalidOperationException($"'{stepName}' is not a batch step in line.json");

            // Lots changed since they were queued, reload them before building the batch
            var plan = BatchPlanner.Plan(tracker.Reload(lots), batch.MinQuantity, batch.MaxQuantity);

            if (requeueLeftovers && plan.Leftovers.Count > 0)
            {
                queues.EnqueueRange(stepName, plan.Leftovers);
            }

            if (!plan.HasBatch)
            {
                logger.LogDebug($"{stepName}: {plan.Leftovers.Sum(BatchPlanner.LotQuantity)} under the minimum {batch.MinQuantity}, waiting for more lots");
                return [];
            }

            string resourceName = resources.PickResource(stepName);
            logger.LogDebug($"Running {stepName} batch of {plan.BatchLots.Count} lot(s) ({plan.Quantity}) on '{resourceName}'" +
                (plan.Leftovers.Count > 0 ? $", {plan.Leftovers.Count} lot(s) ({plan.Leftovers.Sum(BatchPlanner.LotQuantity)}) wait for the next batch" : ""));

            var step = line.FindStep(stepName)!;
            await Task.Delay(clock.RandomDuration(random, step.MinSeconds, step.MaxSeconds));

            List<Material> processed;
            try
            {
                // Two batch steps can share a resource (e.g. the Koyo ovens): one batch at a time on it
                await using (await operatorCheckIn.CheckInAsync(resourceName))
                using (await locks.AcquireAsync(resourceName))
                {
                    processed = RunBatchLifecycle(BuildBatch(plan.BatchLots, resourceName));
                }
            }
            catch when (requeueLeftovers)
            {
                // The batch did not run: its lots wait for the next attempt instead of being lost
                queues.EnqueueRange(stepName, plan.BatchLots);
                throw;
            }
            logger.LogInformation($"Processed {processed.Count} lot(s) in {stepName} on '{resourceName}'");

            return processed.Count > 0 ? tracker.MoveNext(processed) ?? processed : processed;
        }

        private Batch BuildBatch(IReadOnlyList<Material> lots, string resourceName)
        {
            var batchMaterials = new BatchMaterialCollection();
            for (int i = 0; i < lots.Count; i++)
            {
                batchMaterials.Add(new BatchMaterial
                {
                    Material = lots[i],
                    Step = lots[i].Step,
                    Quantity = BatchPlanner.LotQuantity(lots[i]),
                    IsMainMaterial = i == 0
                });
            }

            return new Batch
            {
                BatchMaterials = batchMaterials,
                Resource = mes.Resources.GetByName(resourceName),
                Step = batchMaterials[0].Step
            };
        }

        private List<Material> RunBatchLifecycle(Batch batch)
        {
            var batches = new BatchCollection { batch };

            logger.LogDebug("Creating Batches");
            batches = mes.Batches.Create(batches);
            logger.LogInformation("Created Batches");

            logger.LogDebug("Releasing Batches");
            try
            {
                batches = mes.Batches.Release(batches);
            }
            catch (Exception ex)
            {
                // e.g. under the MES minimum batch size: cancel it, or its lots stay in it and no later batch can take them
                logger.LogWarning($"Releasing {string.Join(", ", batches.Select(b => b.Name))} failed, cancelling it: {ex.Message}");
                try
                {
                    mes.Batches.Cancel(batches);
                }
                catch (Exception cancel)
                {
                    logger.LogError($"Cancelling {string.Join(", ", batches.Select(b => b.Name))} failed: {cancel.Message}");
                }
                throw;
            }
            logger.LogInformation("Released Batches");

            logger.LogDebug("Tracking In Batches");
            batches = mes.Batches.TrackIn(batches);
            logger.LogInformation("Tracked In Batches");

            logger.LogDebug("Tracking Out Batches");
            var materials = mes.Batches.TrackOut(batches);
            logger.LogInformation("Tracked Out Batches");

            return materials;
        }
    }
}
