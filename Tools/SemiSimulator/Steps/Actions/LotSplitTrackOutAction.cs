using Cmf.Navigo.BusinessObjects;
using Microsoft.Extensions.Logging;
using SemiSimulator.Mes;

namespace SemiSimulator.Steps.Actions
{
    /// <summary>
    /// Split & track-out steps for lots without sub-materials (e.g. COMPRESSOR TUB BRAZE, which only allows a split at
    /// track-out): the lot's quantity is cut into 1..4 random parts, each split off into a new lot and tracked out; the
    /// parent terminates when its last part goes. Unlike <c>splitTrackOut</c>, which splits by wafers.
    /// </summary>
    public sealed class LotSplitTrackOutAction(IMaterialTracker tracker, IRandomSource random, ILogger<LotSplitTrackOutAction> logger) : IStepAction
    {
        // At most this many lots come out of one split
        private const int maxSplitGroups = 4;

        public const string ActionKey = "lotSplitTrackOut";
        public const StepHook ActionHook = StepHook.TrackOut;

        public string Key => ActionKey;

        public StepHook Hook => ActionHook;

        /// <summary>The quantity cut into 1..<paramref name="maxGroups"/> random whole parts (each at least 1).</summary>
        public static List<int> SplitQuantities(int quantity, int maxGroups, IRandomSource random) =>
            SplitTrackOutAction.SplitIntoRandomGroups(Enumerable.Range(0, quantity).ToList(), maxGroups, random).Select(g => g.Count).ToList();

        // Many lots split on the same resource at once (COMPRESSOR TUB BRAZE): the resource keeps changing under each
        // call, past the tracker's own retries. Wait a moment and try again, a few times.
        private const int splitAttempts = 5;

        private async Task<Material> SplitWithRetriesAsync(Material lot, int quantity, bool isLastSplit)
        {
            for (int attempt = 1; ; attempt++)
            {
                try
                {
                    return await tracker.SplitQuantityAndTrackOutAsync(lot, quantity, isLastSplit);
                }
                catch (Exception ex) when (attempt < splitAttempts && ex.Message.Contains("has changed since last viewed", StringComparison.OrdinalIgnoreCase))
                {
                    logger.LogDebug($"Splitting {quantity} off '{lot.Name}' hit a changed resource, retrying ({attempt}/{splitAttempts}): {ex.Message}");
                    await Task.Delay(TimeSpan.FromMilliseconds(500 * attempt));
                }
            }
        }

        // Moving the split lots on also checks the resource they were processed on, which other lots keep changing
        private async Task<List<Material>?> MoveNextWithRetriesAsync(List<Material> lots)
        {
            for (int attempt = 1; ; attempt++)
            {
                try
                {
                    return tracker.MoveNext(tracker.Reload(lots).Cast<Material>().ToList());
                }
                catch (Exception ex) when (attempt < splitAttempts && ex.Message.Contains("has changed since last viewed", StringComparison.OrdinalIgnoreCase))
                {
                    logger.LogDebug($"Moving {lots.Count} split lot(s) on hit a changed resource, retrying ({attempt}/{splitAttempts}): {ex.Message}");
                    await Task.Delay(TimeSpan.FromMilliseconds(500 * attempt));
                }
            }
        }

        public async Task ExecuteAsync(StepContext context)
        {
            var lot = tracker.Reload(context.Lot);
            var parts = SplitQuantities(decimal.ToInt32(lot.PrimaryQuantity ?? 0), maxSplitGroups, random);
            if (parts.Count == 0)
            {
                throw new InvalidOperationException($"'{lot.Name}' has no quantity to split at {context.Step.Name}");
            }

            var childLots = new List<Material>();
            for (int i = 0; i < parts.Count; i++)
            {
                var childLot = await SplitWithRetriesAsync(lot, parts[i], isLastSplit: i == parts.Count - 1);
                childLots.Add(childLot);
                logger.LogInformation($"Split & Tracked Out Lot '{childLot.Name}' with {parts[i]} unit(s) from '{lot.Name}'");
            }

            context.OutputLots.AddRange(await MoveNextWithRetriesAsync(childLots) ?? childLots);
        }
    }
}
