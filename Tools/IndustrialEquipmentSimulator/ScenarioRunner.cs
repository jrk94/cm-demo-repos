using IndustrialEquipmentSimulator.Services;

namespace IndustrialEquipmentSimulator
{
    public partial class ScenarioRunner
    {
        public ScenarioRunner(IEventsService eventsService,
            decimal speed = 1m, decimal defectProbability = 0.8m, bool terminateOnStart = false)
        {
            this._speed = speed;
            this._terminateOnStart = terminateOnStart;
            this._eventsService = eventsService;
        }

        public async System.Threading.Tasks.Task RunAsync()
        {
            cts = new CancellationTokenSource();

            // Start listening for a shutdown key
            var inputTask = System.Threading.Tasks.Task.Run(() =>
            {
                Console.WriteLine("Press 'q' to quit.");
                while (true)
                {
                    var key = Console.ReadKey(intercept: true);
                    if (key.KeyChar == 'q' || key.KeyChar == 'Q')
                    {
                        Console.WriteLine("\nShutdown initiated...");
                        cts.Cancel();
                        break;
                    }
                }
            });

            LoadStateModels();

            while (!cts.Token.IsCancellationRequested)
            {
                if (this._terminateOnStart)
                {
                    //Console.WriteLine($"Terminate Materials Previous Runs.");
                    //TerminateLotMaterialsCreatedByMLSimulator();
                    //TerminatePanelMaterialsCreatedByMLSimulator();
                    //TerminateBoardMaterialsCreatedByMLSimulator();
                    //Console.WriteLine($"Terminate POs Previous Runs.");
                    //TerminatePOsCreatedByMLSimulator();
                }

                Console.WriteLine($"Starting MES Run.");

                Task[] tasks = [
                    MESRun_MetalPlate_SemiFinishedGood(),
                    //MESRun_CoilCopper_SemiFinishedGood(),
                    //MESRun_Electric_SemiFinishedGood(),
                    //MESRun_Foam_SemiFinishedGood()
                ];

                Task.WaitAll(tasks);

                //await MESRun_FinalAssemble_FinishedGood();

                Console.WriteLine($"Finishing MES Run.");
            }
        }
    }
}