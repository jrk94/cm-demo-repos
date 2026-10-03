namespace SemiSimulator.Mes
{
    /// <summary>
    /// How MES calls are retried ("Mes" configuration section).
    /// </summary>
    public sealed class MesOptions
    {
        public const string SectionName = "Mes";

        /// <summary>Retries after the first attempt on transient errors (stale object, SQL deadlock).</summary>
        public int RetryMaxAttempts { get; set; } = 5;

        /// <summary>Base delay of the linear backoff (1x, 2x, ...). Kept short: callers may hold the track lock.</summary>
        public TimeSpan RetryDelay { get; set; } = TimeSpan.FromSeconds(1);
    }

    /// <summary>
    /// Diagnostics switches ("Diagnostics" configuration section; --timings sets LogMesCallDurations).
    /// </summary>
    public sealed class DiagnosticsOptions
    {
        public const string SectionName = "Diagnostics";

        /// <summary>Log every MES call with its duration, outcome and number of attempts.</summary>
        public bool LogMesCallDurations { get; set; }

        /// <summary>Log a per-operation duration summary (count, failures, avg, p95, max) when the run ends.</summary>
        public bool SummaryOnExit { get; set; } = true;
    }
}
