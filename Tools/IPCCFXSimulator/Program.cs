using Cmf.LightBusinessObjects.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using System.Globalization;

namespace IPCCFXSimulator
{
    internal class Program
    {
        private static async Task Main(string[] args)
        {
            // Build a generic host for configuration, logging, env, etc.
            var builder = Host.CreateApplicationBuilder(args);

            // (Optional) Be explicit; Host.CreateApplicationBuilder already loads:
            // appsettings.json, appsettings.{Environment}.json, UserSecrets (in Development), and environment variables.
            // If you want to ensure reload-on-change and extra sources, uncomment below.
            //
            builder.Configuration
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);
            //.AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: true)
            //.AddEnvironmentVariables(prefix: "IPCCFX_");

            var configuration = builder.Configuration;

            // Parse CLI args
            decimal speed = 100m;
            decimal defectProbability = 0.1m;
            for (int i = 0; i < args.Length; i++)
            {
                switch (args[i].ToLowerInvariant())
                {
                    case "--speed":
                    case "-s":
                        if (!decimal.TryParse(args[i + 1], NumberStyles.Number, CultureInfo.InvariantCulture, out speed))
                        {
                            Console.WriteLine("Error: --speed requires a valid decimal (e.g., --speed 1.25).");
                            return;
                        }
                        break;
                    case "--defectProbability":
                    case "-d":
                        if (!decimal.TryParse(args[i + 1], NumberStyles.Number, CultureInfo.InvariantCulture, out defectProbability))
                        {
                            Console.WriteLine("Error: --defectProbability requires a valid decimal (e.g., --defectProbability 0.25).");
                            return;
                        }
                        break;

                    default:
                        Console.WriteLine($"Unknown argument: {args[i]}");
                        return;
                }
            }

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

                return cfg;
            };

            // Build the host (not strictly required here, but future-proofs logging/DI if you add it)
            var host = builder.Build();

            Console.WriteLine($"Starting Scenario Run (speed={speed.ToString(CultureInfo.InvariantCulture)})");
            await new ScenarioRunner().RunAsync();
            Console.WriteLine("Finished Scenario Run");
        }
    }
}
