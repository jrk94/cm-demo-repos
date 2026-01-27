using IndustrialEquipmentSimulator.Services;

namespace IndustrialEquipmentSimulator
{
    public partial class ScenarioRunner
    {
        public ScenarioRunner(IEventsService eventsService,
            decimal speed = 1m, decimal defectProbability = 0.8m)
        {
            this._speed = speed;
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
            ResourcesStartInStandby();

            while (!cts.Token.IsCancellationRequested)
            {
                try
                {
                    Console.ForegroundColor = ConsoleColor.Yellow;
                    Console.WriteLine("\n****************************************");
                    Console.WriteLine("***        Starting MES Run.        ***");
                    Console.WriteLine("****************************************\n");
                    Console.ResetColor();

                    Task[] tasks = [
                        MESRun_MetalPlate_SemiFinishedGood(),
                        MESRun_CoilCopper_SemiFinishedGood(),
                        MESRun_Electric_SemiFinishedGood(),
                        MESRun_Foam_SemiFinishedGood(),
                        MESRun_FinalAssemble_FinishedGood()
                    ];

                    Task.WaitAll(tasks);
                    Console.ForegroundColor = ConsoleColor.Cyan;
                    Console.WriteLine("\n****************************************");
                    Console.WriteLine("***        Finishing MES Run.       ***");
                    Console.WriteLine("****************************************\n");
                    Console.ResetColor();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error during MES Run: {ex.Message}");
                }
            }
        }
    }
}