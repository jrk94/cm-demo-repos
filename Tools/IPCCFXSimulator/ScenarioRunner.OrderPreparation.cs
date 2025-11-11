using Cmf.Foundation.BusinessOrchestration.GenericServiceManagement.InputObjects;
using Cmf.Navigo.BusinessObjects;
using Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects;

namespace IPCCFXSimulator
{
    public partial class ScenarioRunner
    {
        private void SMTOrderPreparationExecution(out Product? product, out ProductionOrder? productionOrder, out Facility? facility, out Material? lot)
        {
            Random random = new Random();
            int randomPos = random.Next(0, availableProducts.Length);

            _scenario.Log.Debug($"Creating Production Order for product '{availableProducts[randomPos]}'");

            var productionOrderName = "Demo-PO-" + Guid.NewGuid();
            product = new GetObjectByNameInput()
            {
                Name = availableProducts[randomPos],
                Type = typeof(Cmf.Navigo.BusinessObjects.Product)
            }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Product;

            productionOrder = new CreateObjectInput()
            {
                Object = new Cmf.Navigo.BusinessObjects.ProductionOrder()
                {
                    DueDate = DateTime.UtcNow.AddDays(1),
                    Name = productionOrderName,
                    Quantity = random.Next(1, 20),
                    Type = "SMT",
                    Units = "Boards",
                    Product = product
                }
            }.CreateObjectSync().Object as Cmf.Navigo.BusinessObjects.ProductionOrder;

            _scenario.Log.Info($"Creating Production Order for product '{availableProducts[randomPos]}'");

            _scenario.Log.Debug($"Creating Lot for Production Order for product '{productionOrder?.Name}'");
            var lotName = "Lot-" + Guid.NewGuid();
            facility = new GetObjectByNameInput()
            {
                Name = "Production",
                Type = typeof(Cmf.Navigo.BusinessObjects.Facility)
            }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Facility;

            lot = new CreateObjectInput()
            {
                Object = new Cmf.Navigo.BusinessObjects.Material()
                {
                    Facility = facility,
                    Name = lotName,
                    ProductionOrder = productionOrder,
                    Product = product,
                    Form = lotForm,
                    FlowPath = flowPathSerialization,
                    PrimaryQuantity = random.Next(1, 6) * 2,
                    PrimaryUnits = "Boards",
                    Type = "Production"
                }
            }.CreateObjectSync().Object as Cmf.Navigo.BusinessObjects.Material;

            lot = new SetOrUnSetMaterialDispatchableInput
            {
                Material = lot,
                ExecuteRule = true,
                IgnoreLastServiceId = true,
                IsToOverrideCurrentSetService = false
            }.SetOrUnSetMaterialDispatchableSync().Material;

            _scenario.Log.Info($"Created Lot for Production Order for product '{productionOrder?.Name}'");
        }

        private MaterialCollection SerializationExecution(Product? product, ProductionOrder? productionOrder, Facility? facility, ref Material? lot)
        {
            _scenario.Log.Debug($"Starting Serialization");

            _scenario.Log.Debug($"Tracking In Lot at Resource {this.resourceLaserMark} '{lot?.Name}'");

            lot = new ComplexDispatchAndTrackInMaterialsInput()
            {
                MaterialCollection = new Dictionary<Material, DispatchMaterialParameters>()
                {
                    {
                        lot, new DispatchMaterialParameters()
                        {
                            Resource = GetResourceByName(this.resourceLaserMark)
                        }
                    }
                },
                IgnoreLastServiceId = true
            }.ComplexDispatchAndTrackInMaterialsSync().Materials.First();

            _scenario.Log.Debug($"Tracked In Lot at Resource {this.resourceLaserMark} '{lot?.Name}'");

            _scenario.Log.Debug($"Tracking out Lot '{lot?.Name}'");

            lot = new ComplexTrackOutAndMoveMaterialsToNextStepInput()
            {
                Materials = new Dictionary<Material, ComplexTrackOutAndMoveNextParameters>()
                {
                    { lot,  new ComplexTrackOutAndMoveNextParameters() { FlowPath = this.flowPathTrackoutLine }}
                },
                IgnoreLastServiceId = true
            }.ComplexTrackOutAndMoveMaterialsToNextStepSync().Materials.First().Key;
            _scenario.Log.Info($"Tracked out Lot '{lot?.Name}'");

            lot = new LoadMaterialChildrenInput()
            {
                Material = lot
            }.LoadMaterialChildrenSync().Material;

            _scenario.Log.Debug($"Finished Serialization");

            return lot.SubMaterials;
        }
    }
}