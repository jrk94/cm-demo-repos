namespace OPCUASimulator
{
    internal class Program
    {
        private static async System.Threading.Tasks.Task Main(string[] args)
        {
            Console.WriteLine("Starting Scenario Run");
            await new ScenarioRunner().RunAsync();
            Console.WriteLine("Finished Scenario Run");
        }
    }
}