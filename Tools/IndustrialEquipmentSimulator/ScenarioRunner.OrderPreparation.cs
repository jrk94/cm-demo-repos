using Cmf.Foundation.BusinessOrchestration.GenericServiceManagement.InputObjects;
using Cmf.Navigo.BusinessObjects;
using Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects;
using Cmf.Navigo.BusinessOrchestration.OrderManagement.InputObjects;

namespace IndustrialEquipmentSimulator
{
    public partial class ScenarioRunner
    {
        private void OrderPreparation(string identifier, string startFlowPath, out Product? product, out ProductionOrder? productionOrder, out Facility? facility, out MaterialCollection? lots,
            int maxOrderQty = 20, ProductionOrderCharacteristicCollection productionOrderCharacteristicCollection = null, string productName = null)
        {
            if (string.IsNullOrEmpty(productName))
            {
                int randomPos = Random.Shared.Next(0, availableProducts[identifier].Count);
                productName = availableProducts[identifier][randomPos];
            }

            Console.WriteLine($"Create Order for {productName}");

            facility = new GetObjectByNameInput()
            {
                Name = "Production InduTech",
                Type = typeof(Cmf.Navigo.BusinessObjects.Facility)
            }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Facility;

            var productionOrderName = $"PO-{identifier}-" + Guid.NewGuid();
            product = new GetObjectByNameInput()
            {
                Name = productName,
                Type = typeof(Cmf.Navigo.BusinessObjects.Product)
            }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Product;

            var orderQuantity = Random.Shared.Next(1, maxOrderQty);
            productionOrder = new CreateObjectInput()
            {
                Object = new Cmf.Navigo.BusinessObjects.ProductionOrder()
                {
                    Facility = facility,
                    DueDate = DateTime.UtcNow.AddDays(1),
                    PlannedStartDate = DateTime.UtcNow,
                    PlannedEndDate = DateTime.UtcNow.AddDays(1),
                    Priority = 3,
                    Name = productionOrderName,
                    Quantity = orderQuantity,
                    Type = "Standard",
                    Units = "Unit-",
                    Product = product,
                    UseProductCharacteristicRules = productionOrderCharacteristicCollection?.Count > 0 ? true : false,
                    ProductionOrderCharacteristics = productionOrderCharacteristicCollection
                }
            }.CreateObjectSync().Object as Cmf.Navigo.BusinessObjects.ProductionOrder;

            productionOrder = new ReleaseProductionOrdersInput()
            {
                ProductionOrders = [productionOrder]
            }.ReleaseProductionOrdersSync().ProductionOrders.First();

            lots = [];

            foreach (var lotQuantity in SplitRandomly(orderQuantity))
            {
                var lotName = $"Lot-{productName}-{Guid.NewGuid()}";

                MaterialCharacteristicCollection materialCharacteristicCollection = null;
                if (productionOrderCharacteristicCollection?.Count > 0)
                {
                    materialCharacteristicCollection = [];
                    productionOrderCharacteristicCollection.ForEach(characteristic => materialCharacteristicCollection.Add(new MaterialCharacteristic() { Name = characteristic.Name, Value = characteristic.Value, Order = characteristic.Order }));
                }

                var lot = new CreateObjectInput()
                {
                    Object = new Cmf.Navigo.BusinessObjects.Material()
                    {
                        Facility = facility,
                        Name = lotName,
                        ProductionOrder = productionOrder,
                        Product = product,
                        Form = lotForm,
                        FlowPath = startFlowPath,
                        PrimaryQuantity = lotQuantity,
                        PrimaryUnits = "Unit-",
                        Type = "Production",
                        CapacityClass = "Standard",
                        MaterialCharacteristics = materialCharacteristicCollection
                    }
                }.CreateObjectSync().Object as Cmf.Navigo.BusinessObjects.Material;

                lot = new SetOrUnSetMaterialDispatchableInput
                {
                    Material = lot,
                    ExecuteRule = true,
                    IgnoreLastServiceId = true,
                    IsToOverrideCurrentSetService = false
                }.SetOrUnSetMaterialDispatchableSync().Material;

                lots.Add(lot);
            }
            Console.WriteLine($"Created Order for {productName}");
        }
    }
}