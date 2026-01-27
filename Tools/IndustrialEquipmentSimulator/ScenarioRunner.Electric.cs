using Cmf.Navigo.BusinessObjects;
using Material = Cmf.Navigo.BusinessObjects.Material;
using Task = System.Threading.Tasks.Task;

namespace IndustrialEquipmentSimulator
{
    public partial class ScenarioRunner
    {
        /// <summary>
        /// Electric
        /// - Flow
        ///     - Main Board
        ///     - Door Prep
        ///     - Filter Prep
        ///     - Staging MB
        ///     - Kanban Final Assembly
        /// </summary>
        /// <returns></returns>
        private async System.Threading.Tasks.Task MESRun_Electric_SemiFinishedGood()
        {
            OrderPreparation("Electric", "Fabrication_Electric:A:1/MAIN BOARD:1", out Product? product, out ProductionOrder? productionOrder, out Facility? facility, out MaterialCollection? lots);

            List<Func<Material, decimal, Task<object>>> coilCopperExecution =
            [
                MainBoard,
                DoorPrep,
                FilterPrep,
                StagingMB
            ];

            var tasks = new List<System.Threading.Tasks.Task<MaterialCollection>>();
            foreach (var lot in lots)
            {
                tasks.Add(ProcessPipeline(lot, coilCopperExecution, this._speed));
            }

            await System.Threading.Tasks.Task.WhenAll(tasks);

            CloseProductionOrder(productionOrder, lots.Sum(lot => lot.PrimaryQuantity ?? 0));
        }

        private async Task<object> MainBoard(Material lot, decimal speed = 1)
        {
            string resourceName = ResourcePicker("MainBoard");

            int executionTime = Decimal.ToInt32(new Random().Next(15, 40) * 1000 / speed);

            lot = await MaterialTracking(lot, resourceName, "MainBoard", speed, [170, 220], "SEMIE10", postTrackInAction: async (material, resourceName) =>
            {
                await System.Threading.Tasks.Task.Delay(executionTime);
                return ManualAssembly(lot);
            });

            return lot;
        }

        private async Task<object> DoorPrep(Material lot, decimal speed = 1)
        {
            var descriptor = "DoorPrep";
            string resourceName = ResourcePicker("DoorPrep");
            Resource? resource;
            Employee employeeToCheckIn = new Employee() { Name = this.employeeDefect.ElementAt(Random.Shared.Next(this.employeeDefect.Count)).Key };

            int executionTime = Decimal.ToInt32(new Random().Next(15, 40) * 1000 / speed);

            lot = await MaterialTracking(lot, resourceName, "DoorPrep", speed, [170, 220],
                preTrackInAction: (material, resourceName) =>
                {
                    CheckInOperator(resourceName, employeeToCheckIn.Name, out resource, out Employee emp);
                    employeeToCheckIn = emp;
                    return Task.FromResult(material);
                },
                postTrackInAction: (material, resourceName) =>
                {
                    material = ManualAssembly(material);
                    return Task.FromResult(material);
                },
                postTrackOutAction: (material, resourceName) =>
                {
                    CheckOutOperatorIfNoMaterialsInProcess(resourceName, employeeToCheckIn.Name, out resource, out _);
                    return Task.FromResult(material);
                });

            LogWithGuid($"Tracked Out {descriptor} {lot?.Name}");
            return lot;
        }

        private async Task<object> FilterPrep(Material lot, decimal speed = 1)
        {
            string resourceName = ResourcePicker("FilterPrep");

            int executionTime = Decimal.ToInt32(new Random().Next(15, 40) * 1000 / speed);

            lot = await MaterialTracking(lot, resourceName, "FilterPrep", speed, [170, 220], "SEMIE10", postTrackInAction: async (material, resourceName) =>
            {
                await System.Threading.Tasks.Task.Delay(executionTime);
                return ManualAssembly(lot);
            });
            return lot;
        }

        private async Task<object> StagingMB(Material lot, decimal speed = 1)
        {
            string resourceName = ResourcePicker("StagingMB");

            int executionTime = Decimal.ToInt32(new Random().Next(15, 40) * 1000 / speed);

            lot = await MaterialTracking(lot, resourceName, "StagingMB", speed, [170, 220], "SEMIE10", postTrackInAction: async (material, resourceName) =>
            {
                await System.Threading.Tasks.Task.Delay(executionTime);
                return ManualAssembly(lot);
            });
            return lot;
        }
    }
}
