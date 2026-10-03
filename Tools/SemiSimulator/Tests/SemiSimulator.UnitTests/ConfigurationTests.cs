using Xunit;
using Microsoft.Extensions.Configuration;

namespace SemiSimulator.UnitTests
{
    /// <summary>
    /// The configuration sources and their precedence: files &lt; SEMISIM_ environment variables &lt; command line.
    /// </summary>
    public sealed class ConfigurationTests : IDisposable
    {
        private readonly string _directory = Directory.CreateTempSubdirectory("semisim-config").FullName;
        private readonly List<string> _variables = [];

        public void Dispose()
        {
            foreach (var name in _variables)
            {
                Environment.SetEnvironmentVariable(name, null);
            }
            Directory.Delete(_directory, recursive: true);
        }

        private void SetVariable(string name, string value)
        {
            _variables.Add(name);
            Environment.SetEnvironmentVariable(name, value);
        }

        private string Write(string name, string json)
        {
            var path = Path.Combine(_directory, name);
            File.WriteAllText(path, json);
            return path;
        }

        private IConfigurationRoot Build(string? lineFile = null, Dictionary<string, string?>? overrides = null) =>
            new ConfigurationBuilder().AddSimulatorSources(_directory, lineFile, overrides ?? []).Build();

        [Fact]
        public void AnEnvironmentVariableOverridesTheFiles()
        {
            Write("appsettings.json", """{ "Mes": { "RetryMaxAttempts": 5 } }""");
            Write("line.json", """{ "Line": { "Order": { "MaxOrders": 0 } } }""");
            SetVariable("SEMISIM_Mes__RetryMaxAttempts", "9");
            SetVariable("SEMISIM_Line__Order__MaxOrders", "20");

            var configuration = Build();

            Assert.Equal("9", configuration["Mes:RetryMaxAttempts"]);
            Assert.Equal("20", configuration["Line:Order:MaxOrders"]);
        }

        [Fact]
        public void TheCommandLineOverridesTheEnvironment()
        {
            Write("appsettings.json", "{}");
            Write("line.json", "{}");
            SetVariable("SEMISIM_Simulation__Speed", "50");

            var configuration = Build(overrides: new() { ["Simulation:Speed"] = "3" });

            Assert.Equal("3", configuration["Simulation:Speed"]);
        }

        [Fact]
        public void VariablesWithoutThePrefixAreIgnored()
        {
            Write("appsettings.json", """{ "Simulation": { "Speed": 100 } }""");
            Write("line.json", "{}");
            SetVariable("Simulation__Speed", "1");

            Assert.Equal("100", Build()["Simulation:Speed"]);
        }

        [Fact]
        public void AppSettingsCanBeMissingWhenTheEnvironmentSuppliesTheValues()
        {
            Write("line.json", "{}");
            SetVariable("SEMISIM_ClientConfiguration__Connection__EnvironmentAddress", "https://mes.example");

            Assert.Equal("https://mes.example", Build()["ClientConfiguration:Connection:EnvironmentAddress"]);
        }

        [Fact]
        public void TheLineFileArgumentReplacesLineJson()
        {
            Write("appsettings.json", "{}");
            Write("line.json", """{ "Line": { "Order": { "Product": "Default" } } }""");
            var other = Write("other.json", """{ "Line": { "Order": { "Product": "Other" } } }""");

            Assert.Equal("Other", Build(lineFile: other)["Line:Order:Product"]);
        }

        [Fact]
        public void TheLineFileVariableReplacesLineJsonButTheArgumentWins()
        {
            Write("appsettings.json", "{}");
            Write("line.json", """{ "Line": { "Order": { "Product": "Default" } } }""");
            var fromVariable = Write("variable.json", """{ "Line": { "Order": { "Product": "FromVariable" } } }""");
            var fromArgument = Write("argument.json", """{ "Line": { "Order": { "Product": "FromArgument" } } }""");
            SetVariable(SimulatorConfiguration.LineFileVariable, fromVariable);

            Assert.Equal("FromVariable", Build()["Line:Order:Product"]);
            Assert.Equal("FromArgument", Build(lineFile: fromArgument)["Line:Order:Product"]);
        }

        [Fact]
        public void AMissingLineFileFailsWithItsPath()
        {
            Write("appsettings.json", "{}");
            var missing = Path.Combine(_directory, "nope.json");

            var ex = Assert.Throws<FileNotFoundException>(() => Build(lineFile: missing));

            Assert.Contains("nope.json", ex.Message);
        }
    }
}
