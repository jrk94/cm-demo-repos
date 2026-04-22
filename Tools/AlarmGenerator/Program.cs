using Cmf.LightBusinessObjects.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using AlarmGenerator;
using System.Globalization;

namespace AlarmSimulator
{
    internal class Program
    {
        private static async System.Threading.Tasks.Task Main(string[] args)
        {
            // Build a generic host for configuration, logging, env, etc.
            var builder = Host.CreateApplicationBuilder(args);
            builder.Configuration
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
                .AddEnvironmentVariables();

            var configuration = builder.Configuration;

            // Bind configuration for ClientConfiguration (supports env-specific overrides and reload)
            var clientConfigSection = configuration.GetSection("ClientConfiguration");

            // If you need "live" reload behavior, bind on each factory call:
            ClientConfigurationProvider.ConfigurationFactory = () =>
            {
                // Rebind each time to pick up changes from appsettings.{Environment}.json or env vars
                var cfg = clientConfigSection.Get<ClientConfiguration>() ?? new ClientConfiguration();

                // Optionally, add lightweight guard rails
                if (string.IsNullOrWhiteSpace(cfg.HostAddress))
                    throw new InvalidOperationException("ClientConfiguration: HostAddress is required.");
                if (string.IsNullOrWhiteSpace(cfg.ClientTenantName))
                    throw new InvalidOperationException("ClientConfiguration: ClientTenantName is required.");
                if (string.IsNullOrWhiteSpace(cfg.ClientId))
                    throw new InvalidOperationException("ClientConfiguration: ClientId is required.");
                if (cfg.SecurityPortalBaseAddress == null)
                    throw new InvalidOperationException("ClientConfiguration: SecurityPortalBaseAddress is required.");

                CultureInfo ci = new CultureInfo("en-US");
                Thread.CurrentThread.CurrentCulture = ci;

                return cfg;
            };

            // Register ClientConfiguration in DI
            builder.Services.Configure<ClientConfiguration>(clientConfigSection);

            // Build the host
            var host = builder.Build();

            Console.WriteLine("Starting Scenario Run");
            await new ScenarioRunner().RunAsync();
            Console.WriteLine("Finished Scenario Run");
        }
    }
}