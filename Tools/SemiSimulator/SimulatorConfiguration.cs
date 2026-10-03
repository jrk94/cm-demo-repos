using Microsoft.Extensions.Configuration;

namespace SemiSimulator
{
    /// <summary>
    /// Where the simulator's configuration comes from, so one build can run against several environments.
    /// </summary>
    public static class SimulatorConfiguration
    {
        /// <summary>Prefix of the environment variables that override the configuration (stripped from the key).</summary>
        public const string EnvironmentPrefix = "SEMISIM_";

        /// <summary>Environment variable that points at another line file than the line.json next to the executable.</summary>
        public const string LineFileVariable = EnvironmentPrefix + "LINE_FILE";

        /// <summary>
        /// Adds the sources, from lowest to highest precedence:
        /// <list type="number">
        /// <item>appsettings.json (optional: the environment variables can supply everything);</item>
        /// <item>the line file: <paramref name="lineFile"/>, else the SEMISIM_LINE_FILE variable, else line.json;</item>
        /// <item>environment variables with the SEMISIM_ prefix, "__" separating the levels
        /// (SEMISIM_ClientConfiguration__Connection__EnvironmentAddress, SEMISIM_Line__Order__MaxOrders,
        /// SEMISIM_Line__Chaos__ScrapReasons__0);</item>
        /// <item><paramref name="overrides"/>, i.e. the command line.</item>
        /// </list>
        /// </summary>
        /// <param name="baseDirectory">Where appsettings.json and the default line.json are.</param>
        /// <param name="lineFile">The --line argument; a relative path is resolved against the current directory.</param>
        public static IConfigurationBuilder AddSimulatorSources(this IConfigurationBuilder builder, string baseDirectory,
            string? lineFile, IEnumerable<KeyValuePair<string, string?>> overrides)
        {
            lineFile = string.IsNullOrWhiteSpace(lineFile) ? Environment.GetEnvironmentVariable(LineFileVariable) : lineFile;

            builder
                .SetBasePath(baseDirectory)
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true);

            if (string.IsNullOrWhiteSpace(lineFile))
            {
                builder.AddJsonFile("line.json", optional: false, reloadOnChange: false);
            }
            else
            {
                builder.AddJsonFile(Path.GetFullPath(lineFile), optional: false, reloadOnChange: false);
            }

            return builder
                .AddEnvironmentVariables(EnvironmentPrefix)
                .AddInMemoryCollection(overrides);
        }
    }
}
