using Cmf.Foundation.BusinessObjects;
using Cmf.Foundation.BusinessOrchestration.GenericServiceManagement.InputObjects;
using Cmf.LightBusinessObjects.Infrastructure;
using Microsoft.Extensions.Configuration;

namespace CNCOPCUASimulator
{
    internal class Program
    {
        private static async System.Threading.Tasks.Task Main(string[] args)
        {
            var config = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: false)
                .Build();

            var appSettings = config.GetSection("AppSettings");

            ClientConfigurationProvider.ConfigurationFactory = () =>
            {
                return new ClientConfiguration()
                {
                    HostAddress = appSettings["HostAddress"],
                    ClientTenantName = appSettings["ClientTenantName"],
                    IsUsingLoadBalancer = bool.Parse(appSettings["IsUsingLoadBalancer"]!),
                    ClientId = appSettings["ClientId"],
                    UseSsl = bool.Parse(appSettings["UseSsl"]!),
                    SecurityAccessToken = appSettings["SecurityAccessToken"],
                    SecurityPortalBaseAddress = new Uri(appSettings["SecurityPortalBaseAddress"]!)
                };
            };

            Console.WriteLine("Starting Scenario Run");
            await new ScenarioRunner().RunAsync();
            Console.WriteLine("Finished Scenario Run");
        }
    }
}