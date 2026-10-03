using Cmf.Navigo.BusinessObjects;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using SemiSimulator.Line;
using SemiSimulator.Pipeline;
using SemiSimulator.Steps;

namespace SemiSimulator.UnitTests
{
    /// <summary>
    /// Stands in for the MES tracking calls. Records every call in <see cref="Calls"/> (shared with the fake
    /// actions, so tests can assert order) and, when a <see cref="Route"/> is given, moves lots along it on
    /// track-out / move-next by rewriting their flow path, like the MES does.
    /// </summary>
    internal sealed class FakeTracker(List<string> calls) : IMaterialTracker
    {
        public List<string> Calls { get; } = calls;

        /// <summary>Step names in flow order.</summary>
        public List<string> Route { get; } = [];

        /// <summary>Lots whose track-in throws.</summary>
        public HashSet<string> FailTrackInFor { get; } = [];

        /// <summary>Called at the start of every track-in with the lot and the resource, to observe the state around it.</summary>
        public Action<Material, string>? OnTrackIn { get; set; }

        /// <summary>The track-in of the lot finds the resource full this many times before it succeeds.</summary>
        public Dictionary<string, int> FullFor { get; } = new();

        /// <summary>The track-in of the lot is refused this many times because lots with another BOM are in process.</summary>
        public Dictionary<string, int> OtherBomFor { get; } = new();

        /// <summary>The track-in of the lot finds its feeder product gone (another lot swapped the feeder) this many times.</summary>
        public Dictionary<string, int> FeederSwappedFor { get; } = new();

        /// <summary>The track-in of the lot is refused this many times because lots of another product are in process.</summary>
        public Dictionary<string, int> ProductMixFor { get; } = new();

        public static string FlowPathAt(string stepName) => $"FLOW:A:1/SUB:A:1/{stepName}:1";

        public void MoveToNextStep(Material lot)
        {
            var current = LineDefinition.CurrentStepName(lot);
            int index = Route.FindIndex(s => s == current);
            if (index >= 0 && index + 1 < Route.Count)
            {
                lot.FlowPath = FlowPathAt(Route[index + 1]);
            }
        }

        public Material Reload(Material material) => material;

        public MaterialCollection Reload(IEnumerable<Material> materials)
        {
            var collection = new MaterialCollection();
            collection.AddRange(materials);
            return collection;
        }

        public Task<Material> DispatchAndTrackInAsync(Material lot, string resourceName)
        {
            Record($"trackIn {lot.Name} @ {resourceName}");
            OnTrackIn?.Invoke(lot, resourceName);
            if (FailTrackInFor.Contains(lot.Name))
            {
                throw new InvalidOperationException($"track-in failed for {lot.Name}");
            }
            lock (FullFor)
            {
                if (FullFor.TryGetValue(lot.Name, out int full) && full > 0)
                {
                    FullFor[lot.Name] = full - 1;
                    throw new InvalidOperationException($"{resourceName} reached the maximum number of concurrent materials in process");
                }
                if (ProductMixFor.TryGetValue(lot.Name, out int mix) && mix > 0)
                {
                    ProductMixFor[lot.Name] = mix - 1;
                    throw new InvalidOperationException($"The Resource {resourceName} does not allow Product mixes.");
                }
                if (FeederSwappedFor.TryGetValue(lot.Name, out int swapped) && swapped > 0)
                {
                    FeederSwappedFor[lot.Name] = swapped - 1;
                    throw new InvalidOperationException($"There was no Material of Product AZ Spray found in the Consumable Feeds of Resource {resourceName}");
                }
                if (OtherBomFor.TryGetValue(lot.Name, out int otherBom) && otherBom > 0)
                {
                    OtherBomFor[lot.Name] = otherBom - 1;
                    throw new InvalidOperationException(
                        $"It's not possible to track-in the Material to Resource {resourceName} because the required Material BOM does not match the current BOM at the Resource and the Resource is configured to only accept Materials in-process with the same BOM.");
                }
            }
            return Task.FromResult(lot);
        }

        public Task<Material> TrackOutAndMoveNextAsync(Material lot)
        {
            Record($"trackOut {lot.Name}");
            MoveToNextStep(lot);
            return Task.FromResult(lot);
        }

        public Task<Material> TrackOutAsync(Material lot)
        {
            Record($"trackOut (no move) {lot.Name}");
            return Task.FromResult(lot);
        }

        public Task<MaterialCollection> TrackInSubMaterialsAsync(MaterialCollection subMaterials, string resourceName) => Task.FromResult(subMaterials);

        public Task TrackOutSubMaterialsAsync(MaterialCollection subMaterials, string resourceName) => Task.CompletedTask;

        public Task<Material> SplitAndTrackOutAsync(Material lot, IReadOnlyList<Material> subMaterials, bool isLastSplit) => Task.FromResult(lot);
        public Task<Material> SplitQuantityAndTrackOutAsync(Material lot, decimal quantity, bool isLastSplit) => Task.FromResult(lot);

        public List<Material>? SkipAndMoveNext(IReadOnlyList<Material> lots)
        {
            foreach (var lot in lots)
            {
                Record($"skipProcess {lot.Name}");
            }
            return MoveNext(lots);
        }

        public List<Material>? MoveNext(IReadOnlyList<Material> lots)
        {
            // Like the MES: no next step at the end of the route
            if (Route.Count > 0 && Route.FindIndex(s => s == LineDefinition.CurrentStepName(lots[0])) == Route.Count - 1)
            {
                Record($"moveNext {lots[0].Name}: end of flow");
                return null;
            }

            foreach (var lot in lots)
            {
                Record($"moveNext {lot.Name}");
                MoveToNextStep(lot);
            }
            return lots.ToList();
        }

        private void Record(string call)
        {
            lock (Calls)
            {
                Calls.Add(call);
            }
        }
    }

    /// <summary>The MES's resources per step (none unless set), counting the lookups.</summary>
    internal sealed class FakeStepResources : IStepResourceSource
    {
        public Dictionary<string, List<string>> ByStep { get; } = new(StringComparer.OrdinalIgnoreCase);

        public int Lookups { get; private set; }

        public IReadOnlyList<string> ResourcesFor(string stepName)
        {
            Lookups++;
            return ByStep.GetValueOrDefault(stepName) ?? [];
        }
    }

    /// <summary>Ships a lot to the next step of the tracker's route.</summary>
    internal sealed class FakeShipper(FakeTracker tracker) : SemiSimulator.Steps.Actions.IShipper
    {
        public Material Ship(Material lot, string? destination = null, bool receive = true)
        {
            lock (tracker.Calls)
            {
                tracker.Calls.Add(receive ? $"ship {lot.Name}" : $"ship {lot.Name} (not received)");
            }
            if (receive)
            {
                tracker.MoveToNextStep(lot);
            }
            return lot;
        }
    }

    /// <summary>
    /// No chaos unless told: <see cref="ReworkAt"/> sends a lot queued at that step to the step named in the value
    /// (its rework flow), <see cref="ScrapAllAt"/> scraps all its wafers there.
    /// </summary>
    internal sealed class FakeChaos(FakeTracker tracker) : IReworkChaos
    {
        public Dictionary<string, string> ReworkAt { get; } = new(StringComparer.OrdinalIgnoreCase);

        public HashSet<string> ScrapAllAt { get; } = new(StringComparer.OrdinalIgnoreCase);

        public Material? MaybeRework(Material lot, string stepName, LotRunData data)
        {
            if (ScrapAllAt.Contains(stepName))
            {
                lock (tracker.Calls)
                {
                    tracker.Calls.Add($"scrap all of {lot.Name} at {stepName}");
                }
                return null;
            }

            if (data.Reworks == 0 && ReworkAt.TryGetValue(stepName, out var reworkStep))
            {
                data.Reworks++;
                lock (tracker.Calls)
                {
                    tracker.Calls.Add($"rework {lot.Name} from {stepName} to {reworkStep}");
                }
                return new Material { Name = lot.Name, FlowPath = FakeTracker.FlowPathAt(reworkStep), PrimaryQuantity = lot.PrimaryQuantity, SubMaterialsPrimaryQuantity = lot.SubMaterialsPrimaryQuantity };
            }

            return lot;
        }
    }

    /// <summary>Records the production order checks.</summary>
    internal sealed class FakeCompletion(List<string> calls) : IProductionOrderCompletion
    {
        public void CloseIfComplete(Material lot, string stepName)
        {
            lock (calls)
            {
                calls.Add($"close order of {lot.Name} at {stepName}");
            }
        }
    }

    /// <summary>Every resource can run every lot, except those listed in <see cref="Ineligible"/>.</summary>
    internal sealed class FakeEligibility : IResourceEligibility
    {
        public HashSet<string> Ineligible { get; } = [];

        public bool CanRun(Material lot, string resourceName) => !Ineligible.Contains(resourceName);
    }

    internal sealed class FakeAction(string key, StepHook hook, List<string> calls, Action<StepContext>? behaviour = null) : IStepAction
    {
        public string Key => key;

        public StepHook Hook => hook;

        public Task ExecuteAsync(StepContext context)
        {
            lock (calls)
            {
                calls.Add($"{key} {context.Lot.Name}");
            }
            behaviour?.Invoke(context);
            return Task.CompletedTask;
        }
    }

    internal sealed class FakeCondition(string key, Func<Material, bool> shouldRun) : IStepCondition
    {
        public string Key => key;

        public bool ShouldRun(Material lot) => shouldRun(lot);
    }

    internal sealed class FakeOccupancy(List<string> calls) : IResourceOccupancyPolicy
    {
        public Task<IDisposable> AcquireFreeResourceAsync(string resourceName, Material lot)
        {
            lock (calls)
            {
                calls.Add($"acquire {resourceName}");
            }
            return Task.FromResult<IDisposable>(new Lease(calls, resourceName));
        }

        public void Done(string lotName)
        {
            lock (calls)
            {
                calls.Add($"done {lotName}");
            }
        }

        private sealed class Lease(List<string> calls, string resourceName) : IDisposable
        {
            public void Dispose()
            {
                lock (calls)
                {
                    calls.Add($"release {resourceName}");
                }
            }
        }
    }

    /// <summary>
    /// Records operator check-in and check-out per step in the shared call list.
    /// </summary>
    internal sealed class FakeOperatorCheckIn(List<string> calls) : IOperatorCheckIn
    {
        public void EnsureOperator() { }

        public Task<IAsyncDisposable> CheckInAsync(string resourceName)
        {
            lock (calls)
            {
                calls.Add($"checkIn operator @ {resourceName}");
            }
            return Task.FromResult<IAsyncDisposable>(new Lease(calls, resourceName));
        }

        private sealed class Lease(List<string> calls, string resourceName) : IAsyncDisposable
        {
            public ValueTask DisposeAsync()
            {
                lock (calls)
                {
                    calls.Add($"checkOut operator @ {resourceName}");
                }
                return ValueTask.CompletedTask;
            }
        }
    }

    /// <summary>
    /// Operator check-in that does nothing (tests that do not look at it).
    /// </summary>
    internal sealed class SilentOperatorCheckIn : IOperatorCheckIn
    {
        public void EnsureOperator() { }

        public Task<IAsyncDisposable> CheckInAsync(string resourceName) => Task.FromResult<IAsyncDisposable>(new Nothing());

        private sealed class Nothing : IAsyncDisposable
        {
            public ValueTask DisposeAsync() => ValueTask.CompletedTask;
        }
    }

    /// <summary>
    /// Deterministic "random": always the lowest value of the range.
    /// </summary>
    internal sealed class FirstValueRandom : IRandomSource
    {
        public int Next(int minInclusive, int maxExclusive) => minInclusive;
    }

    internal static class StepTestFactory
    {
        /// <summary>
        /// A small line: COAT, DEVELOPER, Expose (single material), ASHING PRE, INSP CD (conditional), AOI (no
        /// resources) and the PRE_CURE batch step.
        /// </summary>
        public static LineOptions TestLineOptions(string? inspCdCondition = null) => new()
        {
            Startup = new StartupOptions { Operator = new OperatorOptions { Calendar = "KommSemi Calendar" } },
            Order = new OrderOptions
            {
                Product = "2EDN7524F",
                Facility = "Production FE SC",
                LotFlowPath = "FLOW:A:1/SUB:A:1/PREPARATION:1",
                WaferFlowPath = "KANBAN:A:1/KANBAN:1",
                StartFlowPath = "FLOW:A:1/SUB:A:1/COAT:1"
            },
            Steps = new(StringComparer.OrdinalIgnoreCase)
            {
                ["COAT"] = new() { Resources = ["SUSS Coat-001", "SUSS Coat-002"] },
                ["DEVELOPER"] = new() { Resources = ["SUSS Devs-001"] },
                ["Expose"] = new() { Resources = ["Rudolph Steppers-001"], SingleMaterial = true },
                ["ASHING PRE"] = new() { Resources = ["Mattson-001"], Actions = ["split"] },
                ["INSP CD"] = new() { Resources = ["VISTEC-001"], Condition = inspCdCondition },
                ["AOI"] = new() { Resources = [] },
                ["PRE_CURE"] = new() { Resources = ["Koyo VF-5900A"], Batch = new BatchOptions { MinQuantity = 70, MaxQuantity = 100 } },
                ["RwCOAT"] = new() { Resources = ["SUSS Coat-002"] },
                ["Wafer Shipping FE"] = new() { PassThrough = true, ClosesProductionOrder = true, Ship = true, Receive = false },
                ["Wafer Reception BE"] = new() { PassThrough = true },
                ["Wafer PACKING"] = new() { PassThrough = true },
            }
        };

        public static LineDefinition TestLine(string? inspCdCondition = null) =>
            new(Options.Create(TestLineOptions(inspCdCondition)));

        public static SimulationClock FastClock() =>
            new(Options.Create(new SimulationOptions { Speed = 1_000_000m, MinPollInterval = TimeSpan.Zero }));

        public static StepExecutor Executor(FakeTracker tracker, IEnumerable<IStepAction>? actions = null,
            IResourceOccupancyPolicy? occupancy = null, LineDefinition? line = null, IOperatorCheckIn? operatorCheckIn = null,
            IResourceEligibility? eligibility = null, SetUpLots? setUpLots = null)
        {
            var random = new FirstValueRandom();
            return new StepExecutor(
                tracker,
                occupancy ?? new FakeOccupancy(tracker.Calls),
                operatorCheckIn ?? new SilentOperatorCheckIn(),
                new ResourceCatalog(line ?? TestLine(), new FakeStepResources(), random),
                eligibility ?? new FakeEligibility(),
                FastClock(),
                random,
                actions ?? [],
                NullLogger<StepExecutor>.Instance,
                setUpLots);
        }

        public static (LotFlow Flow, BatchQueues Queues) Flow(FakeTracker tracker, IEnumerable<IStepAction>? actions = null,
            IEnumerable<IStepCondition>? conditions = null, string? inspCdCondition = null, IReworkChaos? chaos = null)
        {
            var line = TestLine(inspCdCondition);
            var queues = new BatchQueues(line);
            var flow = new LotFlow(
                line,
                Executor(tracker, actions, line: line),
                tracker,
                new ResourceCatalog(line, new FakeStepResources(), new FirstValueRandom()),
                queues,
                new InFlightLots(),
                conditions ?? [],
                new FakeShipper(tracker),
                new FakeCompletion(tracker.Calls),
                chaos ?? new FakeChaos(tracker),
                NullLogger<LotFlow>.Instance);
            return (flow, queues);
        }

        public static Material Lot(string name, string? atStep = null, decimal quantity = 0) => new()
        {
            Name = name,
            FlowPath = atStep == null ? null : FakeTracker.FlowPathAt(atStep),
            PrimaryQuantity = quantity
        };
    }
}
