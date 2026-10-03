using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SemiSimulator.Steps;

namespace SemiSimulator.Pipeline
{
    /// <summary>
    /// Runs the simulation until the host stops (Ctrl+C / SIGTERM): prepares the MES, starts the batch steps and the
    /// order source; on stop, no new orders are created and the lots already moving finish their current run.
    /// </summary>
    public sealed class SimulationHost(
        LineStartup startup,
        OrderSource orders,
        BatchProcessor batches,
        LotFlow flow,
        InFlightLots inFlight,
        ILogger<SimulationHost> logger) : BackgroundService
    {
        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            // Let the host finish starting before the (synchronous) MES calls of the preparation
            await Task.Yield();

            startup.Prepare();

            var batchLoops = batches.RunLoopsAsync(lot => flow.Start(lot, new LotRunData()), stoppingToken);
            await orders.RunAsync(stoppingToken);
            await batchLoops;

            if (inFlight.Count > 0)
            {
                logger.LogInformation($"Stopping: waiting for {inFlight.Count} lot run(s) in progress to finish");
            }
            await inFlight.WhenAllAsync();
        }
    }
}
