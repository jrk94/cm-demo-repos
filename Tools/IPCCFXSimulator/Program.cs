using Cmf.LightBusinessObjects.Infrastructure;
using System.Configuration;

namespace IPCCFXSimulator
{
    internal class Program
    {
        private static async System.Threading.Tasks.Task Main(string[] args)
        {
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