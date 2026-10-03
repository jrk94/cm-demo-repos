using Cmf.Navigo.BusinessObjects;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SemiSimulator.Mes;
using SemiSimulator.Pipeline;
using Xunit;
using Xunit.Abstractions;
using Task = System.Threading.Tasks.Task;

namespace SemiSimulator.IntegrationTests
{
    /// <summary>
    /// Integration tests against the MES configured in appsettings.json, with the line in line.json.
    /// The lots must already be queued at the batch step (e.g. produced by a previous simulator run);
    /// set SEMISIM_LOTS="Lot.A,Lot.B,..." to choose them.
    /// </summary>
    [Trait("Category", "Integration")]
    public class BatchStepTests
    {
        // High speed shrinks the simulated process delay to about a second
        private const decimal speed = 100m;

        private readonly ITestOutputHelper _output;
        private readonly ServiceProvider _services;

        public BatchStepTests(ITestOutputHelper output)
        {
            _output = output;
            _services = TestServices.Build(speed);
        }

        [Theory]
        [InlineData("PRE_CURE")]
        [InlineData("CureWafers")]
        public async Task ProcessAsync_RunsTheQueuedLotsAsABatch(string stepName)
        {
            var lots = TestServices.LoadLots(_services, TestServices.LotNamesFromEnvironment());

            var processed = await _services.GetRequiredService<BatchProcessor>().ProcessAsync(stepName, lots);

            foreach (var material in processed)
            {
                _output.WriteLine($"{material.Name} -> {material.FlowPath}");
            }

            Assert.NotEmpty(processed);
            Assert.All(processed, m => Assert.Contains(m.Name, lots.Select(l => l.Name)));
        }
    }

    /// <summary>
    /// Builds the simulator's services from appsettings.json and line.json, as the console host does.
    /// </summary>
    internal static class TestServices
    {
        public static ServiceProvider Build(decimal speed)
        {
            var configuration = new ConfigurationBuilder()
                .SetBasePath(AppContext.BaseDirectory)
                .AddJsonFile("appsettings.json", optional: false)
                .AddJsonFile("line.json", optional: false)
                .AddEnvironmentVariables()
                .AddInMemoryCollection(new Dictionary<string, string?> { ["Simulation:Speed"] = speed.ToString(System.Globalization.CultureInfo.InvariantCulture) })
                .Build();

            return new Microsoft.Extensions.DependencyInjection.ServiceCollection()
                .AddLogging()
                .AddSemiSimulator(configuration)
                .BuildServiceProvider();
        }

        public static IReadOnlyList<string> LotNamesFromEnvironment()
        {
            var lotNames = Environment.GetEnvironmentVariable("SEMISIM_LOTS")?
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

            return lotNames is { Length: > 0 }
                ? lotNames
                : throw new InvalidOperationException("Set SEMISIM_LOTS to the lots queued at the batch step, e.g. SEMISIM_LOTS=Lot.A,Lot.B");
        }

        public static MaterialCollection LoadLots(IServiceProvider services, IEnumerable<string> lotNames)
        {
            var materials = services.GetRequiredService<IMaterialGateway>();
            var lots = new MaterialCollection();
            foreach (var lotName in lotNames)
            {
                lots.Add(materials.GetByName(lotName) ?? throw new InvalidOperationException($"Lot '{lotName}' not found"));
            }
            return lots;
        }
    }
}
