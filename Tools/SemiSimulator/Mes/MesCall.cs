using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Polly;
using Polly.Retry;

namespace SemiSimulator.Mes
{
    /// <summary>
    /// Single entry point for every MES (LightBusinessObjects) call: retries transient errors and measures the
    /// call from start to end, retries included.
    /// </summary>
    public interface IMesCall
    {
        /// <param name="operation">MES service name, e.g. "ComplexDispatchAndTrackInMaterials".</param>
        /// <param name="call">The LightBusinessObjects call.</param>
        /// <param name="subject">What the call acts on (lot, resource...), for the logs.</param>
        T Run<T>(string operation, Func<T> call, string? subject = null);
    }

    public sealed class MesCall : IMesCall
    {
        private readonly ILogger<MesCall> _logger;
        private readonly IOptionsMonitor<DiagnosticsOptions> _diagnostics;
        private readonly MesCallStatistics _statistics;
        private readonly TimeProvider _timeProvider;
        private readonly ResiliencePipeline _retry;

        public MesCall(ILogger<MesCall> logger, IOptions<MesOptions> options, IOptionsMonitor<DiagnosticsOptions> diagnostics,
            MesCallStatistics statistics, TimeProvider timeProvider)
        {
            _logger = logger;
            _diagnostics = diagnostics;
            _statistics = statistics;
            _timeProvider = timeProvider;

            var mesOptions = options.Value;
            _retry = new ResiliencePipelineBuilder { TimeProvider = timeProvider }
                .AddRetry(new RetryStrategyOptions
                {
                    ShouldHandle = new PredicateBuilder().Handle<Exception>(IsTransient),
                    MaxRetryAttempts = mesOptions.RetryMaxAttempts,
                    Delay = mesOptions.RetryDelay,
                    BackoffType = DelayBackoffType.Linear,
                    UseJitter = false,
                    OnRetry = args =>
                    {
                        _logger.LogDebug("MES call retry {Attempt} in {DelayMs} ms after: {Error}",
                            args.AttemptNumber + 1, args.RetryDelay.TotalMilliseconds, args.Outcome.Exception?.Message);
                        return default;
                    }
                })
                .Build();
        }

        /// <summary>
        /// MES concurrency errors that succeed when the same call is simply repeated.
        /// </summary>
        public static bool IsTransient(Exception ex) =>
            ex.Message.Contains("has changed since last viewed") ||
            // Same error inside a BatchExecute output, which the client fails to deserialize
            ex.Message.Contains("DataChangedSinceLastViewed") ||
            ex.Message.Contains("deadlocked on lock resources");

        public T Run<T>(string operation, Func<T> call, string? subject = null)
        {
            int attempts = 0;
            long start = _timeProvider.GetTimestamp();
            try
            {
                var result = _retry.Execute(() =>
                {
                    attempts++;
                    return call();
                });
                Complete(operation, subject, start, attempts, succeeded: true, error: null);
                return result;
            }
            catch (Exception ex)
            {
                Complete(operation, subject, start, attempts, succeeded: false, error: ex.Message);
                throw;
            }
        }

        private void Complete(string operation, string? subject, long start, int attempts, bool succeeded, string? error)
        {
            var elapsed = _timeProvider.GetElapsedTime(start);
            _statistics.Record(operation, elapsed, succeeded);

            if (!_diagnostics.CurrentValue.LogMesCallDurations)
            {
                return;
            }

            if (succeeded)
            {
                _logger.LogInformation("MES {Operation} {Subject} took {ElapsedMs:F0} ms ({Attempts} attempt(s))",
                    operation, subject ?? "-", elapsed.TotalMilliseconds, attempts);
            }
            else
            {
                _logger.LogWarning("MES {Operation} {Subject} failed after {ElapsedMs:F0} ms ({Attempts} attempt(s)): {Error}",
                    operation, subject ?? "-", elapsed.TotalMilliseconds, attempts, error);
            }
        }
    }
}
