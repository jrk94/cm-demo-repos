using System.Collections.Concurrent;
using Cmf.Navigo.BusinessObjects;
using Microsoft.Extensions.Logging;

namespace SemiSimulator.Steps
{
    /// <summary>
    /// Runs one lot through one step: queue time, BeforeTrackIn actions, (single-material wait), dispatch and
    /// track-in, AfterTrackIn actions, process time, then the standard track-out and move-next or the step's
    /// TrackOut action. Returns the lots leaving the step (one, or several after a split).
    /// The resource is picked at random among the step's resources that offer the lot's required service; when a
    /// BeforeTrackIn action finds it cannot serve the lot (<see cref="ResourceUnsuitableException"/>), the next one is tried.
    /// Whether a conditional step runs at all is decided by the caller (<see cref="Pipeline.LotFlow"/>).
    /// </summary>
    public sealed class StepExecutor
    {
        // A resource at its limit of concurrent materials (e.g. the plating line takes 2 lots): wait for a slot
        private const string resourceFullError = "maximum number of concurrent materials in process";
        // A resource that only runs lots with the BOM of the lots in process (the coaters, with several products on the
        // line): wait until those lots are done
        private const string otherBomInProcessError = "only accept Materials in-process with the same BOM";
        // A resource that does not allow product mixes (the packing stations): lots of another product are in process
        private const string productMixError = "does not allow Product mixes";
        // A shared feeder (the developers' single one for PI Spray and AZ Spray) was swapped by another lot after this lot
        // prepared it: the track-in finds the wrong product: set the resource up again (a few times)
        private const string feederProductMissingError = "in the Consumable Feeds of Resource";
        private const int maxSetupAttempts = 4;
        // Up to 6 h simulated (a lot ahead can run for hours at speed 1), and at least 15 min real time (at a high speed
        // the lot ahead is slowed down by its MES calls, not by its simulated time)
        private const int waitBudgetSeconds = 6 * 3600;
        private static readonly TimeSpan minRealWaitBudget = TimeSpan.FromMinutes(15);
        private const int resourceFullWaitSeconds = 120;

        // No resource can serve the lot right now, but one may later (e.g. a shared feeder in use): wait and retry
        private const int resourcesBusyWaitSeconds = 120;

        private readonly SetUpLots _setUpLots;
        private readonly IMaterialTracker _tracker;
        private readonly IResourceOccupancyPolicy _occupancy;
        private readonly IOperatorCheckIn _operator;
        private readonly ResourceCatalog _resources;
        private readonly IResourceEligibility _eligibility;
        private readonly SimulationClock _clock;
        private readonly IRandomSource _random;
        private readonly ILogger<StepExecutor> _logger;
        private readonly Dictionary<string, IStepAction> _actions;

        // Lots waiting for a full resource / a busy step take turns retrying (one MES retry at a time per resource / step)
        private readonly ConcurrentDictionary<string, SemaphoreSlim> _fullResourceGates = new(StringComparer.OrdinalIgnoreCase);
        private readonly ConcurrentDictionary<string, SemaphoreSlim> _busyStepGates = new(StringComparer.OrdinalIgnoreCase);

        public StepExecutor(
            IMaterialTracker tracker,
            IResourceOccupancyPolicy occupancy,
            IOperatorCheckIn operatorCheckIn,
            ResourceCatalog resources,
            IResourceEligibility eligibility,
            SimulationClock clock,
            IRandomSource random,
            IEnumerable<IStepAction> actions,
            ILogger<StepExecutor> logger,
            SetUpLots? setUpLots = null)
        {
            _setUpLots = setUpLots ?? new SetUpLots();
            _eligibility = eligibility;
            _tracker = tracker;
            _occupancy = occupancy;
            _operator = operatorCheckIn;
            _resources = resources;
            _clock = clock;
            _random = random;
            _logger = logger;
            _actions = actions.ToDictionary(a => a.Key, StringComparer.OrdinalIgnoreCase);
        }

        public async Task<IReadOnlyList<Material>> ExecuteAsync(StepDefinition step, Material lot, LotRunData data)
        {
            var actions = step.Actions.Select(key => ResolveAction(step, key)).ToList();
            var trackOutActions = actions.Where(a => a.Hook == StepHook.TrackOut).ToList();
            if (trackOutActions.Count > 1)
            {
                throw new InvalidOperationException($"Step '{step.Name}' has more than one track-out action: {string.Join(", ", trackOutActions.Select(a => a.Key))}");
            }

            var candidates = EligibleResources(step, lot);
            // Per lot (load, setup) plus per wafer (single-wafer tools)
            var processTime = _clock.ProcessTime(_random, step, (int)Pipeline.BatchPlanner.LotQuantity(lot));

            // Queue time before the track-in
            await Task.Delay(processTime / 4);

            // Resources that require check-in get the operator checked in for the whole step (setup, track-in, track-out).
            // A single-material resource is held from before its setup (e.g. mounting the reticle) until the track-in.
            StepContext context;
            IAsyncDisposable lease;
            for (int attempt = 1; ; attempt++)
            {
                IDisposable? occupancyLease;
                (context, lease, occupancyLease) = await PrepareOnResourceAsync(step, lot, data, candidates, actions);
                try
                {
                    _logger.LogDebug($"Tracking In {step.Name} {context.Lot.Name}");
                    context.Lot = await TrackInWhenThereIsRoomAsync(step, context);
                    _logger.LogInformation($"Tracked In {step.Name} {context.Lot.Name}");
                    occupancyLease?.Dispose();
                    _setUpLots.Release(context.Lot.Name);
                    break;
                }
                catch (Exception ex)
                {
                    occupancyLease?.Dispose();
                    _setUpLots.Release(context.Lot.Name);
                    await lease.DisposeAsync();
                    if (!FeedersChangedAfterSetup(ex) || attempt >= maxSetupAttempts)
                    {
                        throw;
                    }

                    // Another lot swapped a shared feeder between this lot's setup and its track-in: set the resource up again
                    _logger.LogDebug($"{step.Name}: '{context.ResourceName}' changed its feeders after the setup of '{context.Lot.Name}' ({ex.Message}): setting it up again ({attempt}/{maxSetupAttempts})");
                    lot = _tracker.Reload(context.Lot);
                }
            }
            await using var operatorLease = lease;

            try
            {
                await RunActionsAsync(actions, StepHook.AfterTrackIn, context);

                // Process time
                await Task.Delay(processTime);

                if (trackOutActions.Count == 1)
                {
                    await trackOutActions[0].ExecuteAsync(context);
                    return context.OutputLots.Count > 0 ? context.OutputLots : [context.Lot];
                }

                _logger.LogDebug($"Tracking Out {step.Name} {context.Lot.Name}");
                context.Lot = await _tracker.TrackOutAndMoveNextAsync(context.Lot);
                _logger.LogInformation($"Tracked Out {step.Name} {context.Lot.Name}");

                return [context.Lot];
            }
            finally
            {
                // Tracked out, or its flow failed: lots waiting for this single-material resource stop waiting for it
                if (step.SingleMaterial)
                {
                    _occupancy.Done(lot.Name);
                }
            }
        }

        private async Task<Material> TrackInWhenThereIsRoomAsync(StepDefinition step, StepContext context)
        {
            string refusal;
            try
            {
                return await _tracker.DispatchAndTrackInAsync(context.Lot, context.ResourceName);
            }
            catch (Exception ex) when (CannotTakeLotYet(ex))
            {
                refusal = ex.Message;
            }

            // Full: the lots waiting for this resource take turns, only one of them retries the track-in at a time (dozens
            // of lots retrying a track-in transaction every second deadlocked the MES)
            var gate = _fullResourceGates.GetOrAdd(context.ResourceName, _ => new SemaphoreSlim(1, 1));
            await gate.WaitAsync();
            try
            {
                int maxWaits = _clock.PollCount(waitBudgetSeconds, resourceFullWaitSeconds, minRealWaitBudget);
                for (int wait = 1; ; wait++)
                {
                    _logger.LogDebug($"{step.Name}: '{context.ResourceName}' can't take '{context.Lot.Name}' yet ({refusal}): waits ({wait}/{maxWaits})");
                    await Task.Delay(_clock.PollInterval(resourceFullWaitSeconds));
                    context.Lot = _tracker.Reload(context.Lot);
                    try
                    {
                        return await _tracker.DispatchAndTrackInAsync(context.Lot, context.ResourceName);
                    }
                    catch (Exception ex) when (CannotTakeLotYet(ex) && wait < maxWaits)
                    {
                        refusal = ex.Message;
                    }
                }
            }
            finally
            {
                gate.Release();
            }
        }

        /// <summary>"There was no Material of Product AZ Spray found in the Consumable Feeds of Resource SUSS Devs-001".</summary>
        private static bool FeedersChangedAfterSetup(Exception ex) =>
            ex.Message.Contains("no Material of Product", StringComparison.OrdinalIgnoreCase)
            && ex.Message.Contains(feederProductMissingError, StringComparison.OrdinalIgnoreCase);

        /// <summary>The track-in was refused only because of the lots in process on the resource: it may work later.</summary>
        private static bool CannotTakeLotYet(Exception ex) =>
            ex.Message.Contains(resourceFullError, StringComparison.OrdinalIgnoreCase)
            || ex.Message.Contains(otherBomInProcessError, StringComparison.OrdinalIgnoreCase)
            || ex.Message.Contains(productMixError, StringComparison.OrdinalIgnoreCase);

        // The step's resources that offer the lot's required service; all of them when none does (the MES has the last word)
        private IReadOnlyList<string> EligibleResources(StepDefinition step, Material lot)
        {
            var order = _resources.PickOrder(step.Name);
            var eligible = order.Where(r => _eligibility.CanRun(lot, r)).ToList();
            if (eligible.Count == 0)
            {
                _logger.LogWarning($"None of the {step.Name} resources ({string.Join(", ", order)}) offers the service '{lot.Name}' needs: trying them all");
                return order;
            }
            return eligible;
        }

        // Checks the operator in and runs the BeforeTrackIn actions on the first resource that can serve the lot
        private async Task<(StepContext Context, IAsyncDisposable OperatorLease, IDisposable? OccupancyLease)> PrepareOnResourceAsync(
            StepDefinition step, Material lot, LotRunData data, IReadOnlyList<string> candidates, List<IStepAction> actions)
        {
            var (prepared, reasons, temporary) = await TryPrepareOnResourceAsync(step, lot, data, candidates, actions);
            if (prepared != null)
            {
                return prepared.Value;
            }
            if (!temporary)
            {
                throw new InvalidOperationException($"No {step.Name} resource can run '{lot.Name}': {string.Join("; ", reasons)}");
            }

            // Busy for now (e.g. a shared feeder can't be swapped): the lots waiting at this step take turns, only one of
            // them retries the setup at a time
            var gate = _busyStepGates.GetOrAdd(step.Name, _ => new SemaphoreSlim(1, 1));
            await gate.WaitAsync();
            try
            {
                int maxWaits = _clock.PollCount(waitBudgetSeconds, resourcesBusyWaitSeconds, minRealWaitBudget);
                for (int wait = 1; ; wait++)
                {
                    _logger.LogDebug($"{step.Name}: no resource can run '{lot.Name}' right now, waiting ({wait}/{maxWaits})");
                    await Task.Delay(_clock.PollInterval(resourcesBusyWaitSeconds));
                    lot = _tracker.Reload(lot);

                    (prepared, reasons, temporary) = await TryPrepareOnResourceAsync(step, lot, data, candidates, actions);
                    if (prepared != null)
                    {
                        return prepared.Value;
                    }
                    if (!temporary || wait >= maxWaits)
                    {
                        throw new InvalidOperationException($"No {step.Name} resource can run '{lot.Name}': {string.Join("; ", reasons)}");
                    }
                }
            }
            finally
            {
                gate.Release();
            }
        }

        private async Task<((StepContext Context, IAsyncDisposable OperatorLease, IDisposable? OccupancyLease)? Prepared, List<string> Reasons, bool Temporary)> TryPrepareOnResourceAsync(
            StepDefinition step, Material lot, LotRunData data, IReadOnlyList<string> candidates, List<IStepAction> actions)
        {
            var reasons = new List<string>();
            bool temporary = false;
            foreach (var resourceName in candidates)
            {
                var context = new StepContext(step, lot, resourceName, data);

                // Single material (Expose): wait for the resource to be free before its setup, so no other lot changes
                // it (e.g. swaps the reticle) between this lot's setup and its track-in
                var occupancy = step.SingleMaterial ? await _occupancy.AcquireFreeResourceAsync(resourceName, lot) : null;
                var lease = await _operator.CheckInAsync(resourceName);
                try
                {
                    await RunActionsAsync(actions, StepHook.BeforeTrackIn, context);
                    return ((context, lease, occupancy), reasons, temporary);
                }
                catch (ResourceUnsuitableException ex)
                {
                    occupancy?.Dispose();
                    _setUpLots.Release(context.Lot.Name);
                    await lease.DisposeAsync();
                    _logger.LogWarning($"{step.Name}: '{resourceName}' cannot run '{lot.Name}' ({ex.Message}), trying the next resource");
                    reasons.Add($"{resourceName}: {ex.Message}");
                    temporary |= ex.Temporary;
                    lot = context.Lot;
                }
                catch
                {
                    occupancy?.Dispose();
                    _setUpLots.Release(context.Lot.Name);
                    await lease.DisposeAsync();
                    throw;
                }
            }

            return (null, reasons, temporary);
        }

        private static async Task RunActionsAsync(IEnumerable<IStepAction> actions, StepHook hook, StepContext context)
        {
            foreach (var action in actions.Where(a => a.Hook == hook))
            {
                await action.ExecuteAsync(context);
            }
        }

        private IStepAction ResolveAction(StepDefinition step, string key) =>
            _actions.TryGetValue(key, out var action)
                ? action
                : throw new InvalidOperationException($"Step '{step.Name}' uses unknown action '{key}'. Known actions: {string.Join(", ", _actions.Keys)}");
    }
}
