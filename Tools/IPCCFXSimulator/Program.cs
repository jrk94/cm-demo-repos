using Cmf.LightBusinessObjects.Infrastructure;
using System.Configuration;

namespace IPCCFXSimulator
{
    internal class Program
    {
        private static async System.Threading.Tasks.Task Main(string[] args)
        {
            decimal speed = 1;

            for (int i = 0; i < args.Length; i++)
            {
                switch (args[i].ToLowerInvariant())
                {
                    case "--speed":
                    case "-s":
                        if (i + 1 < args.Length && int.TryParse(args[i + 1], out int id))
                        {
                            speed = id;
                            i++;
                        }
                        else
                        {
                            Console.WriteLine("Error: --speed requires a valid decimal.");
                            return;
                        }
                        break;
                    default:
                        Console.WriteLine($"Unknown argument: {args[i]}");
                        return;
                }
            }

            ClientConfigurationProvider.ConfigurationFactory = () =>
            {
                return new ClientConfiguration()
                {
                    HostAddress = ConfigurationManager.AppSettings["HostAddress"],
                    ClientTenantName = ConfigurationManager.AppSettings["ClientTenantName"],
                    IsUsingLoadBalancer = false,
                    ClientId = ConfigurationManager.AppSettings["ClientId"],
                    UseSsl = bool.Parse(ConfigurationManager.AppSettings["UseSsl"]),
                    SecurityAccessToken = ConfigurationManager.AppSettings["SecurityAccessToken"],
                    SecurityPortalBaseAddress = new Uri(ConfigurationManager.AppSettings["SecurityPortalBaseAddress"])
                };
            };

            Console.WriteLine("Starting Scenario Run");
            await new ScenarioRunner().RunAsync();
            Console.WriteLine("Finished Scenario Run");
        }
    }
}