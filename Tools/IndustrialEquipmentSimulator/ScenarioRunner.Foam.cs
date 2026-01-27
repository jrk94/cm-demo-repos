using Cmf.Navigo.BusinessObjects;
using Material = Cmf.Navigo.BusinessObjects.Material;

namespace IndustrialEquipmentSimulator
{
    public partial class ScenarioRunner
    {
        /// <summary>
        /// Foam
        /// - Flow
        ///     - Foam Prep
        ///     - Foam
        ///     - Kanban Final Assembly
        /// </summary>
        /// <returns></returns>
        private async System.Threading.Tasks.Task MESRun_Foam_SemiFinishedGood()
        {
            OrderPreparation("Foam", "Fabrication_Foam:A:1/FOAM PREP:1", out Product? product, out ProductionOrder? productionOrder, out Facility? facility, out MaterialCollection? lots);

            List<Func<Material, decimal, Task<object>>> execution =
            [
                FoamPrep,
                Foam,
                //OutdoorBraze,
                //CompressorTubBraze
            ];

            var tasks = new List<System.Threading.Tasks.Task<MaterialCollection>>();
            foreach (var lot in lots)
            {
                tasks.Add(ProcessPipeline(lot, execution, this._speed));
            }

            await System.Threading.Tasks.Task.WhenAll(tasks);

            //CloseProductionOrder(productionOrder);
        }

        private async Task<object> FoamPrep(Material lot, decimal speed = 1)
        {
            string resourceName = ResourcePicker("FoamPrep");

            lot = await MaterialTracking(lot, resourceName, "FoamPrep", speed, [15, 40]);

            return lot;
        }

        private async Task<object> Foam(Material lot, decimal speed = 1)
        {
            string resourceName = ResourcePicker("Foam");

            int executionTime = Decimal.ToInt32(new Random().Next(15, 40) * 1000 / speed);

            lot = await MaterialTracking(lot, resourceName, "Foam", speed, [15, 40], "SEMIE10", postTrackInAction: async (material, resourceName) =>
            {
                await System.Threading.Tasks.Task.Delay(executionTime);
                return ManualAssembly(lot);
            });

            return lot;
        }
    }
}