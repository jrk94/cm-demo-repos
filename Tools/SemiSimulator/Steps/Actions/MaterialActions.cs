using Cmf.Navigo.BusinessObjects;
using Microsoft.Extensions.Logging;
using SemiSimulator.Mes;

namespace SemiSimulator.Steps.Actions
{
    /// <summary>
    /// SILICON WAFER COMPOSE: after the track-in, composes the lot from the wafers it was created with.
    /// </summary>
    public sealed class ComposeAction(IMesGateway mes, IMaterialTracker tracker, ILogger<ComposeAction> logger) : IStepAction
    {
        // Dies per wafer when a wafer has no secondary quantity
        private const int defaultDiesPerWafer = 500;

        public const string ActionKey = "compose";
        public const StepHook ActionHook = StepHook.AfterTrackIn;

        public string Key => ActionKey;

        public StepHook Hook => ActionHook;

        public Task ExecuteAsync(StepContext context)
        {
            var wafers = context.Data.Wafers
                ?? throw new InvalidOperationException($"'{context.Step.Name}' needs the lot's wafers to compose '{context.Lot.Name}'");

            logger.LogDebug($"Composing Lot '{context.Lot.Name}' with {wafers.Count} wafer material(s)");

            var sourceMaterials = new ComposeSourceMaterialCollection();
            foreach (Material wafer in wafers)
            {
                sourceMaterials.Add(new ComposeSourceMaterial()
                {
                    Material = tracker.Reload(wafer),
                    Position = sourceMaterials.Count + 1,
                    ComposedPrimaryQuantity = wafer.PrimaryQuantity ?? 1,
                    ComposedSecondaryQuantity = wafer.SecondaryQuantity ?? defaultDiesPerWafer
                });
            }

            context.Lot = mes.Materials.Compose(tracker.Reload(context.Lot), sourceMaterials);

            logger.LogInformation($"Composed Lot '{context.Lot.Name}'");
            return Task.CompletedTask;
        }
    }

    /// <summary>
    /// Sub-material track-in (e.g. SILICON WAFER PEELING): after the lot's track-in, tracks its wafers in and out.
    /// </summary>
    public sealed class SubMaterialTrackingAction(IMesGateway mes, IMaterialTracker tracker) : IStepAction
    {
        public const string ActionKey = "subMaterialTracking";
        public const StepHook ActionHook = StepHook.AfterTrackIn;

        public string Key => ActionKey;

        public StepHook Hook => ActionHook;

        public async Task ExecuteAsync(StepContext context)
        {
            context.Lot = mes.Materials.LoadChildren(context.Lot);
            context.Lot.SubMaterials = await tracker.TrackInSubMaterialsAsync(context.Lot.SubMaterials, context.ResourceName);
            await tracker.TrackOutSubMaterialsAsync(context.Lot.SubMaterials, context.ResourceName);
        }
    }

    /// <summary>
    /// Split &amp; track-out (ASHING PRE): instead of a normal track-out, splits the lot's wafers into random groups and
    /// tracks each group out as a new lot (the parent terminates with the last group), then moves them all next.
    /// </summary>
    public sealed class SplitTrackOutAction(IMesGateway mes, IMaterialTracker tracker, IRandomSource random, ILogger<SplitTrackOutAction> logger) : IStepAction
    {
        // At most this many lots come out of one split
        private const int maxSplitGroups = 4;

        public const string ActionKey = "splitTrackOut";
        public const StepHook ActionHook = StepHook.TrackOut;

        public string Key => ActionKey;

        public StepHook Hook => ActionHook;

        public async Task ExecuteAsync(StepContext context)
        {
            var lot = mes.Materials.LoadChildren(tracker.Reload(context.Lot));

            var groups = SplitIntoRandomGroups(lot.SubMaterials.Cast<Material>().ToList(), maxSplitGroups, random);
            logger.LogDebug($"Split & TrackOut Lot '{lot.Name}' with {lot.SubMaterials.Count} wafer(s) into {groups.Count} lot(s)");

            // The step only allows Split & TrackOut: every group becomes a new lot and the parent terminates once its
            // last wafers are split off
            var childLots = new List<Material>();
            for (int i = 0; i < groups.Count; i++)
            {
                var childLot = await tracker.SplitAndTrackOutAsync(lot, groups[i], isLastSplit: i == groups.Count - 1);
                childLots.Add(childLot);
                logger.LogInformation($"Split & Tracked Out Lot '{childLot.Name}' with {groups[i].Count} wafer(s) from '{lot.Name}'");
            }

            context.OutputLots.AddRange(tracker.MoveNext(childLots) ?? childLots);
        }

        /// <summary>
        /// Shuffles <paramref name="items"/> and cuts them into 1..<paramref name="maxGroups"/> non-empty groups of random size.
        /// </summary>
        public static List<List<T>> SplitIntoRandomGroups<T>(IReadOnlyList<T> items, int maxGroups, IRandomSource random)
        {
            if (items.Count == 0)
            {
                return [];
            }

            var shuffled = items.OrderBy(_ => random.Next(0, int.MaxValue)).ToList();

            int groupCount = random.Next(1, Math.Min(maxGroups, shuffled.Count) + 1);

            // Pick groupCount - 1 distinct cut points between items
            var cuts = Enumerable.Range(1, shuffled.Count - 1)
                .OrderBy(_ => random.Next(0, int.MaxValue))
                .Take(groupCount - 1)
                .Order()
                .Append(shuffled.Count)
                .ToList();

            var groups = new List<List<T>>();
            int start = 0;
            foreach (var cut in cuts)
            {
                groups.Add(shuffled.GetRange(start, cut - start));
                start = cut;
            }

            return groups;
        }
    }

    /// <summary>
    /// INSP CD runs for lots of the "2EDN Product Family" product group, or lots with the INSPCD attribute set to TRUE.
    /// </summary>
    public sealed class InspCdRequiredCondition(IMesGateway mes) : IStepCondition
    {
        private const string inspectedProductGroup = "2EDN Product Family";
        private const string inspCdAttribute = "INSPCD";

        public const string ConditionKey = "inspCdRequired";

        public string Key => ConditionKey;

        public bool ShouldRun(Material lot)
        {
            var product = mes.MasterData.GetById<Product>(lot.Product.Id, levelsToLoad: 2);

            // Attributes is Dictionary<string, object>: compare the value as a string, and a missing attribute means no
            bool attributeSet = lot.Attributes != null
                && lot.Attributes.TryGetValue(inspCdAttribute, out var value)
                && string.Equals(value?.ToString(), "TRUE", StringComparison.OrdinalIgnoreCase);

            return product?.ProductGroup?.Name == inspectedProductGroup || attributeSet;
        }
    }
}
