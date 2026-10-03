using Cmf.Navigo.BusinessObjects;
using Microsoft.Extensions.Logging;
using SemiSimulator.Line;
using SemiSimulator.Steps;
using SemiSimulator.Steps.Actions;

namespace SemiSimulator.Pipeline
{
    /// <summary>
    /// Moves a lot along the line the way the MES routes it: after every step the lot is wherever the MES moved it,
    /// and that step's definition in line.json says what to do next:
    /// a batch step → the lot joins that step's batch queue;
    /// before any other step, chaos may send the lot to rework (and scrap some wafers);
    /// a pass-through step → the lot is moved to the next step, or shipped there when it is in another facility
    /// (and stays at the step at the end of its flow); at the end of the line (Wafer Shipping FE) its production order
    /// is closed once complete and the lot is shipped without being received;
    /// a step without resources, or not in line.json → the lot stops there;
    /// a conditional step whose condition says no → the lot is moved to the next step without being processed;
    /// any other step → <see cref="StepExecutor"/> runs it. When a step splits the lot, each new lot continues on its own.
    /// </summary>
    public sealed class LotFlow(
        LineDefinition line,
        StepExecutor executor,
        IMaterialTracker tracker,
        ResourceCatalog resources,
        BatchQueues batchQueues,
        InFlightLots inFlight,
        IEnumerable<IStepCondition> conditions,
        IShipper shipper,
        IProductionOrderCompletion completion,
        IReworkChaos chaos,
        ILogger<LotFlow> logger)
    {
        private readonly Dictionary<string, IStepCondition> _conditions = conditions.ToDictionary(c => c.Key, StringComparer.OrdinalIgnoreCase);

        /// <summary>
        /// Runs the lot in the background (tracked, so shutdown waits for it). The task ends when the lot leaves the line,
        /// stops, or joins a batch queue.
        /// </summary>
        public Task Start(Material lot, LotRunData data)
        {
            var run = RunSafeAsync(lot, data);
            inFlight.Track(run);
            return run;
        }

        // Where the lot really is (the copy passed in can be steps behind)
        private string? CurrentStepOf(Material lot)
        {
            try
            {
                return LineDefinition.CurrentStepName(tracker.Reload(lot));
            }
            catch
            {
                return LineDefinition.CurrentStepName(lot);
            }
        }

        private async Task RunSafeAsync(Material lot, LotRunData data)
        {
            try
            {
                await RunAsync(lot, data);
            }
            catch (Exception ex)
            {
                logger.LogError($"Lot '{lot.Name}' stopped at {CurrentStepOf(lot) ?? "?"}: {ex.Message}");
            }
        }

        /// <summary>
        /// Runs the lot until it reaches a batch step or leaves the configured line.
        /// </summary>
        public async Task RunAsync(Material lot, LotRunData data)
        {
            string? previousStep = null;
            while (true)
            {
                lot = tracker.Reload(lot);
                var stepName = LineDefinition.CurrentStepName(lot);

                // The MES did not move the lot on (e.g. end of its flow): stop instead of processing the step again
                if (stepName != null && string.Equals(stepName, previousStep, StringComparison.OrdinalIgnoreCase))
                {
                    logger.LogWarning($"Lot '{lot.Name}' is still at {stepName} after it was processed: leaving it there");
                    return;
                }
                previousStep = stepName;

                if (stepName == null || line.FindStep(stepName) is not { } step)
                {
                    logger.LogInformation($"Lot '{lot.Name}' reached '{stepName}', which is not in line.json: leaving it there");
                    return;
                }

                // Chaos: the lot may be sent to rework from here (and lose wafers); it then follows its rework flow
                if (!step.PassThrough)
                {
                    var current = chaos.MaybeRework(lot, stepName, data);
                    if (current == null)
                    {
                        // The order's last wafers may have been the ones scrapped: it can be completed now
                        completion.CloseIfComplete(lot, stepName);
                        return;
                    }
                    if (!ReferenceEquals(current, lot))
                    {
                        lot = current;
                        previousStep = null;
                        continue;
                    }
                }

                if (line.IsBatchStep(stepName))
                {
                    int waiting = batchQueues.Enqueue(stepName, lot);
                    logger.LogInformation($"Lot '{lot.Name}' queued for {stepName} ({waiting} waiting)");
                    return;
                }

                if (step.PassThrough && step.ClosesProductionOrder)
                {
                    completion.CloseIfComplete(lot, stepName);
                }

                if (step.PassThrough && step.Ship)
                {
                    lot = shipper.Ship(lot, step.ShipTo, step.Receive);
                    if (!step.Receive)
                    {
                        logger.LogInformation($"Lot '{lot.Name}' shipped from {stepName}{(step.ShipTo == null ? "" : $" to {step.ShipTo}")}: end of the line");
                        return;
                    }
                    logger.LogInformation($"Lot '{lot.Name}' shipped from {stepName} to {LineDefinition.CurrentStepName(lot)}");
                    continue;
                }

                if (step.PassThrough)
                {
                    var moved = tracker.MoveNext([lot]);
                    if (moved == null)
                    {
                        logger.LogInformation($"Lot '{lot.Name}' reached the end of its flow at {stepName}");
                        return;
                    }
                    logger.LogInformation($"Lot '{lot.Name}' passed through {stepName}");
                    lot = moved.Single();
                    continue;
                }

                if (!resources.HasResources(stepName))
                {
                    logger.LogWarning($"Lot '{lot.Name}' reached '{stepName}', which has no resources (in line.json or in the MES): leaving it there");
                    return;
                }

                if (step.Condition != null && !ConditionAllows(step, lot))
                {
                    logger.LogInformation($"Lot '{lot.Name}' skips {stepName}: condition '{step.Condition}' not met, moving it to the next step");
                    // A queued lot can't be moved next: skip the step's process first
                    lot = tracker.SkipAndMoveNext([lot])?.Single()
                        ?? throw new InvalidOperationException($"No next step to skip '{lot.Name}' past {stepName}");
                    continue;
                }

                var lots = await executor.ExecuteAsync(step, lot, data);
                if (lots.Count == 1)
                {
                    lot = lots[0];
                    continue;
                }

                // Split: each new lot continues on its own, and one failing does not stop the others
                await Task.WhenAll(lots.Select(child => RunSafeAsync(child, new LotRunData())));
                return;
            }
        }

        private bool ConditionAllows(StepDefinition step, Material lot) =>
            _conditions.TryGetValue(step.Condition!, out var condition)
                ? condition.ShouldRun(lot)
                : throw new InvalidOperationException($"Step '{step.Name}' uses unknown condition '{step.Condition}'");
    }
}
