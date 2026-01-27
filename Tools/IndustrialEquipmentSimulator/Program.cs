using Cmf.LightBusinessObjects.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System.Globalization;

namespace IndustrialEquipmentSimulator
{
    internal class Program
    {
        private static async Task Main(string[] args)
        {
            // Build a generic host for configuration, logging, env, etc.
            var builder = Host.CreateApplicationBuilder(args);
            builder.Configuration
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
                .AddEnvironmentVariables();

            var configuration = builder.Configuration;

            // Parse CLI args
            decimal speed = 100m;
            decimal defectProbability = 0.8m;
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

                        Console.WriteLine($"Configured Speed will be: {speed}");
                        i++;
                        break;
                    case "--defectprobability":
                    case "-d":
                        if (!decimal.TryParse(args[i + 1], NumberStyles.Number, CultureInfo.InvariantCulture, out defectProbability))
                        {
                            Console.WriteLine("Error: --defectProbability requires a valid decimal (e.g., --defectProbability 0.25).");
                            return;
                        }
                        Console.WriteLine($"Configured Speed will be: {defectProbability}");
                        i++;
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

                CultureInfo ci = new CultureInfo("en-US");
                Thread.CurrentThread.CurrentCulture = ci;

                return cfg;
            };

            // Register ClientConfiguration in DI
            builder.Services.Configure<ClientConfiguration>(clientConfigSection);
            builder.Services.AddSingleton<IndustrialEquipmentSimulator.Services.ITokenService, IndustrialEquipmentSimulator.Services.TokenService>();
            builder.Services.AddSingleton<IndustrialEquipmentSimulator.Services.IEventsService, IndustrialEquipmentSimulator.Services.EventsService>();
            builder.Services.AddTransient<ScenarioRunner>(provider =>
                new ScenarioRunner(
                    provider.GetRequiredService<IndustrialEquipmentSimulator.Services.IEventsService>(),
                    speed,
                    defectProbability));

            // Build the host
            var host = builder.Build();

            Console.WriteLine($"Starting Scenario Run (speed={speed.ToString(CultureInfo.InvariantCulture)})");
            var scenarioRunner = host.Services.GetRequiredService<ScenarioRunner>();
            await scenarioRunner.RunAsync();
            Console.WriteLine("Finished Scenario Run");
        }
    }
}
