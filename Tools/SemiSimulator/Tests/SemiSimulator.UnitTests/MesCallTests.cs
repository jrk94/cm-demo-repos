using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SemiSimulator.Mes;
using Xunit;

namespace SemiSimulator.UnitTests
{
    public class MesCallTests
    {
        private const string StaleObjectError = "Object Lot.1 has changed since last viewed";
        private const string DeadlockError = "Transaction was deadlocked on lock resources with another process";

        private readonly ListLogger<MesCall> _logger = new();
        private readonly MesCallStatistics _statistics = new();

        private MesCall CreateMesCall(bool logDurations = false, int retryMaxAttempts = 5) =>
            new(_logger,
                Options.Create(new MesOptions { RetryMaxAttempts = retryMaxAttempts, RetryDelay = TimeSpan.Zero }),
                new StaticOptionsMonitor<DiagnosticsOptions>(new DiagnosticsOptions { LogMesCallDurations = logDurations }),
                _statistics,
                TimeProvider.System);

        [Fact]
        public void Run_ReturnsTheCallResult()
        {
            var result = CreateMesCall().Run("GetObjectByName", () => "Lot.1");

            Assert.Equal("Lot.1", result);
        }

        [Theory]
        [InlineData(StaleObjectError)]
        [InlineData(DeadlockError)]
        public void Run_RetriesTransientErrorsUntilTheCallSucceeds(string transientError)
        {
            int calls = 0;

            var result = CreateMesCall().Run("ComplexTrackOutMaterials", () =>
            {
                calls++;
                if (calls < 3)
                {
                    throw new InvalidOperationException(transientError);
                }
                return "ok";
            });

            Assert.Equal("ok", result);
            Assert.Equal(3, calls);
        }

        [Fact]
        public void Run_DoesNotRetryOtherErrors()
        {
            int calls = 0;

            var ex = Assert.Throws<InvalidOperationException>(() => CreateMesCall().Run<string>("ComplexDispatchAndTrackInMaterials", () =>
            {
                calls++;
                throw new InvalidOperationException("The maximum number of concurrent materials in process has been reached");
            }));

            Assert.Equal(1, calls);
            Assert.Contains("maximum number of concurrent materials", ex.Message);
        }

        [Fact]
        public void Run_RethrowsTheOriginalErrorAfterTheLastRetry()
        {
            int calls = 0;

            var ex = Assert.Throws<InvalidOperationException>(() => CreateMesCall(retryMaxAttempts: 2).Run<string>("ComposeMaterial", () =>
            {
                calls++;
                throw new InvalidOperationException(StaleObjectError);
            }));

            Assert.Equal(3, calls);
            Assert.Equal(StaleObjectError, ex.Message);
        }

        [Fact]
        public void Run_RecordsEveryCallInTheStatistics()
        {
            var mesCall = CreateMesCall();
            mesCall.Run("GetObjectByName", () => 1);
            mesCall.Run("GetObjectByName", () => 2);
            Assert.ThrowsAny<Exception>(() => mesCall.Run<int>("TerminateMaterial", () => throw new InvalidOperationException("boom")));

            var summary = _statistics.Summarize().ToDictionary(s => s.Operation);

            Assert.Equal(2, summary["GetObjectByName"].Count);
            Assert.Equal(0, summary["GetObjectByName"].Failures);
            Assert.Equal(1, summary["TerminateMaterial"].Count);
            Assert.Equal(1, summary["TerminateMaterial"].Failures);
        }

        [Fact]
        public void Run_LogsTheDurationAndAttempts_WhenTimingsAreOn()
        {
            int calls = 0;
            CreateMesCall(logDurations: true).Run("ComplexTrackInMaterials", () =>
            {
                if (++calls == 1)
                {
                    throw new InvalidOperationException(StaleObjectError);
                }
                return 0;
            }, subject: "Lot.1");

            var entry = Assert.Single(_logger.Entries, e => e.Level == LogLevel.Information);
            Assert.Contains("MES ComplexTrackInMaterials Lot.1 took", entry.Message);
            Assert.Contains("(2 attempt(s))", entry.Message);
        }

        [Fact]
        public void Run_LogsFailures_WhenTimingsAreOn()
        {
            Assert.ThrowsAny<Exception>(() => CreateMesCall(logDurations: true)
                .Run<int>("TerminateMaterial", () => throw new InvalidOperationException("No reason"), subject: "BG Tape.0005"));

            var entry = Assert.Single(_logger.Entries, e => e.Level == LogLevel.Warning);
            Assert.Contains("MES TerminateMaterial BG Tape.0005 failed after", entry.Message);
            Assert.Contains("No reason", entry.Message);
        }

        [Fact]
        public void Run_DoesNotLogDurations_WhenTimingsAreOff()
        {
            CreateMesCall(logDurations: false).Run("GetObjectByName", () => 0);

            Assert.DoesNotContain(_logger.Entries, e => e.Level >= LogLevel.Information);
        }

        [Theory]
        [InlineData(StaleObjectError, true)]
        [InlineData(DeadlockError, true)]
        [InlineData("Error resolving type specified in JSON 'Cmf.Foundation.Common.DataChangedSinceLastViewedCmfException, Cmf.Foundation.Common'. Path 'Outputs[0].$type'", true)]
        [InlineData("Not enough Quantity for SourceProduct BG Tape", false)]
        [InlineData("An unexpected problem occurred.", false)]
        public void IsTransient_OnlyMatchesConcurrencyErrors(string message, bool expected)
        {
            Assert.Equal(expected, MesCall.IsTransient(new Exception(message)));
        }
    }
}
