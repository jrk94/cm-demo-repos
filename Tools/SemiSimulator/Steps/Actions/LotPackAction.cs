using Cmf.Navigo.BusinessObjects;
using Cmf.Navigo.BusinessOrchestration.MaterialLogisticsManagement.InputObjects;
using Microsoft.Extensions.Logging;
using SemiSimulator.Mes;

namespace SemiSimulator.Steps.Actions
{
    /// <summary>
    /// Whole-lot packing steps (e.g. RTU PACKING): after the track-in, packs the lot's quantity — one package per unit — by
    /// quantity (no sub-materials), unlike the wafer-id <c>pack</c> action. The lot can only track out once everything is packed.
    /// </summary>
    public sealed class LotPackAction(IMesGateway mes, IMaterialTracker tracker, ILogger<LotPackAction> logger) : IStepAction
    {
        public const string ActionKey = "lotPack";
        public const StepHook ActionHook = StepHook.AfterTrackIn;

        public string Key => ActionKey;

        public StepHook Hook => ActionHook;

        public Task ExecuteAsync(StepContext context)
        {
            var lot = tracker.Reload(context.Lot);
            int quantity = decimal.ToInt32(lot.PrimaryQuantity ?? 0);

            for (int i = 0; i < quantity; i++)
            {
                lot = mes.Materials.PackLot(lot);
                logger.LogInformation($"Packed unit {i + 1}/{quantity} of '{lot.Name}'");
            }

            context.Lot = lot;
            return Task.CompletedTask;
        }
    }

    /// <summary>
    /// Palletizing steps (e.g. RTU FINAL PACKAGING): after the track-in, nests the material's packages (the boxes packed by
    /// <see cref="LotPackAction"/>) into parent packages of the MES's next packing level, up to that level's maximum quantity,
    /// then closes them. Mirrors the MES multi-level packing wizard.
    /// </summary>
    public sealed class PalletPackAction(IMesGateway mes, IMaterialTracker tracker, ILogger<PalletPackAction> logger) : IStepAction
    {
        public const string ActionKey = "palletPack";
        public const StepHook ActionHook = StepHook.AfterTrackIn;

        public string Key => ActionKey;

        public StepHook Hook => ActionHook;

        public Task ExecuteAsync(StepContext context)
        {
            var lot = tracker.Reload(context.Lot);

            var level = mes.Materials.GetMultiLevelPackingInformation(lot).FirstOrDefault()
                ?? throw new InvalidOperationException($"No multi-level packing level for '{lot.Name}' at {context.Step.Name}");
            var packageProduct = level.PackageProduct;
            int maxQuantity = (int)(level.MaximumQuantity ?? 0);

            var materialPackages = mes.Materials.GetMaterialPackages(lot.Id);
            var chunks = materialPackages.Chunk(maxQuantity).ToList();

            var parameters = new CreatePackageParametersCollection();
            foreach (var chunk in chunks)
            {
                parameters.Add(new CreatePackageParameters()
                {
                    Mode = PackingContentType.Packages,
                    Product = packageProduct
                });
            }

            var parentPackages = mes.Materials.CreatePackages(parameters);

            for (int i = 0; i < chunks.Count; i++)
            {
                var childPackages = new PackageCollection();
                childPackages.AddRange(chunks[i]);
                mes.Materials.AddPackagesToPackage(parentPackages[i], childPackages, lot);
            }

            mes.Materials.ClosePackages(lot, parentPackages);
            logger.LogInformation($"Palletized '{lot.Name}': {parentPackages.Count} parent package(s) across {chunks.Count} pallet(s)");

            context.Lot = tracker.Reload(lot);
            return Task.CompletedTask;
        }
    }
}
