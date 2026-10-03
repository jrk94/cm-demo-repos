using System.Collections.Concurrent;
using Cmf.Navigo.BusinessObjects;
using Microsoft.Extensions.Logging;
using SemiSimulator.Line;
using SemiSimulator.Mes;

namespace SemiSimulator.Steps
{
    /// <summary>
    /// The simulator's operator: the employee of the user the simulator runs as. Resources that require check-in for
    /// material or resource operations (e.g. METAL DEPOSITION) only accept track-ins from a checked-in employee.
    /// </summary>
    public interface IOperatorCheckIn
    {
        /// <summary>Finds the employee of the current user, creating it when there is none, and clocks it in when required.</summary>
        void EnsureOperator();

        /// <summary>
        /// Checks the operator in on the resource when the resource requires it (and it is not checked in yet). Dispose
        /// the lease once the lot's work on the resource is done: the operator is checked out after the last lease of
        /// the resource is released and no material is in process there.
        /// </summary>
        Task<IAsyncDisposable> CheckInAsync(string resourceName);
    }

    public sealed class OperatorCheckIn(IMesGateway mes, LineDefinition line, ILogger<OperatorCheckIn> logger) : IOperatorCheckIn
    {
        private readonly ConcurrentDictionary<string, ResourceUse> _uses = new(StringComparer.OrdinalIgnoreCase);
        private Employee? _operator;

        public void EnsureOperator()
        {
            var user = mes.Labor.GetCurrentUser();

            var employee = mes.Labor.FindEmployeeByUserAccount(user.UserAccount);
            if (employee == null)
            {
                var options = line.Startup.Operator;
                var calendar = mes.MasterData.GetByName<Calendar>(options.Calendar!)
                    ?? throw new InvalidOperationException($"Calendar '{options.Calendar}' (Line:Startup:Operator:Calendar) not found");

                logger.LogInformation($"User '{user.UserAccount}' has no employee: creating one with calendar '{calendar.Name}'");
                employee = mes.Labor.CreateEmployee(new Employee()
                {
                    Name = user.UserAccount,
                    Description = $"Operator of the semiconductor simulator ({user.UserName})",
                    User = user,
                    EmployeeNumber = user.UserAccount,
                    Type = options.Type,
                    CostCenter = options.CostCenter,
                    Calendar = calendar,
                    RequireClockIn = false
                });
                logger.LogInformation($"Created employee '{employee.Name}' for user '{user.UserAccount}'");
            }

            if (employee.RequireClockIn && employee.ClockedState != ClockedState.ClockedIn)
            {
                mes.Labor.ClockIn(employee);
                logger.LogInformation($"Clocked in employee '{employee.Name}'");
            }

            _operator = employee;
            logger.LogInformation($"Simulator operator: employee '{employee.Name}' (user '{user.UserAccount}')");
        }

        public async Task<IAsyncDisposable> CheckInAsync(string resourceName)
        {
            var use = _uses.GetOrAdd(resourceName, _ => new ResourceUse());
            await use.Lock.WaitAsync();
            try
            {
                if (use.Count == 0)
                {
                    var resource = GetResource(resourceName);
                    use.Required = resource.RequireCheckInForMaterialOperations || resource.RequireCheckInForResourceOperations;
                    if (use.Required)
                    {
                        var employee = CurrentOperator() ?? throw new InvalidOperationException($"'{resourceName}' requires check-in, but no operator was set up at startup");
                        if (!mes.Labor.GetCheckedInEmployees(resource).Any(e => e.Id == employee.Id))
                        {
                            mes.Labor.CheckIn(employee, resource);
                            logger.LogInformation($"Checked in '{employee.Name}' at '{resourceName}'");
                        }
                    }
                }
                use.Count++;
            }
            finally
            {
                use.Lock.Release();
            }

            return new Lease(() => ReleaseAsync(resourceName, use));
        }

        private async Task ReleaseAsync(string resourceName, ResourceUse use)
        {
            await use.Lock.WaitAsync();
            try
            {
                use.Count--;
                if (use.Count > 0 || !use.Required || _operator == null)
                {
                    return;
                }

                // Like the other simulators: only leave the resource when nothing is in process there
                var resource = GetResource(resourceName);
                if (resource.MaterialsInProcessCount > 0)
                {
                    return;
                }

                try
                {
                    mes.Labor.CheckOut(CurrentOperator()!, resource);
                    logger.LogInformation($"Checked out '{_operator.Name}' at '{resourceName}'");
                }
                catch (Exception ex)
                {
                    logger.LogDebug($"Check-out of '{_operator.Name}' at '{resourceName}' skipped: {ex.Message}");
                }
            }
            finally
            {
                use.Lock.Release();
            }
        }

        // Every check-in/out changes the employee, so it is reloaded before each one (a stale copy is rejected)
        private Employee? CurrentOperator() =>
            _operator == null ? null : mes.MasterData.GetById<Employee>(_operator.Id) ?? _operator;

        private Resource GetResource(string resourceName) =>
            mes.Resources.GetByName(resourceName) ?? throw new InvalidOperationException($"Resource '{resourceName}' not found");

        private sealed class ResourceUse
        {
            public SemaphoreSlim Lock { get; } = new(1, 1);
            public int Count { get; set; }
            public bool Required { get; set; }
        }

        private sealed class Lease(Func<Task> release) : IAsyncDisposable
        {
            private int _released;

            public async ValueTask DisposeAsync()
            {
                if (Interlocked.Exchange(ref _released, 1) == 0)
                {
                    await release();
                }
            }
        }
    }
}
