using CNCOPCUASimulator.Objects;

namespace CNCOPCUASimulator
{
    internal class CncCycleSimulator
    {
        private readonly CncMachineState _state;
        private readonly Func<Task> _broadcastAsync;
        private int _partCounter = 441;
        private string _currentWorkOrder = "WO-8821";

        public CncCycleSimulator(CncMachineState state, Func<Task> broadcastAsync)
        {
            _state = state;
            _broadcastAsync = broadcastAsync;
        }

        public async Task RunCyclesAsync(IoTTestOrchestrator.OPCUA.PluginMain opc, CancellationToken ct)
        {
            var rng = new Random();
            int totalParts = 0;

            while (!ct.IsCancellationRequested)
            {
                string partId = $"BRK-2026-{_partCounter++:D4}";
                string trackInTime = DateTime.UtcNow.ToString("HH:mm:ss");
                bool coolantFault = rng.NextDouble() < 0.15;
                bool spindleWarning = rng.NextDouble() < 0.10;

                // ── TRACK IN ──────────────────────────────────────────────────
                Console.WriteLine($"\n[{DateTime.UtcNow:HH:mm:ss}] TRACK_IN  part={partId} order={_currentWorkOrder}");
                _state.WriteTag(opc, "Material.CurrentPartId", partId);
                _state.WriteTag(opc, "Material.WorkOrderId", _currentWorkOrder);
                _state.WriteTag(opc, "Material.TrackInTime", trackInTime);
                _state.WriteTag(opc, "Material.TrackOutResult", "");
                _state.WriteTag(opc, "Material.TrackOutTime", "");
                await _broadcastAsync();

                // ── CYCLE START ───────────────────────────────────────────────
                _state.WriteTag(opc, "Controller.Execution", "ACTIVE");
                _state.WriteTag(opc, "Controller.Program", "O1001_BRACKET_AL6061");
                _state.WriteTag(opc, "Controller.Block", "N0010");
                _state.WriteTag(opc, "Spindle.ToolNumber", 4);
                _state.WriteTag(opc, "Spindle.Speed", 8200.0f);
                _state.WriteTag(opc, "Spindle.Load", 12.0f);
                _state.WriteTag(opc, "Axis.Feedrate", 500.0f);
                _state.WriteTag(opc, "Coolant.FlowRate", 8.5f);
                await _broadcastAsync();

                Console.WriteLine($"[{DateTime.UtcNow:HH:mm:ss}] CYCLE_START tool=T04 speed=8200rpm feed=500mm/min");

                var cycleStart = DateTime.UtcNow;
                bool cycleInterrupted = false;

                for (int tick = 0; tick < 9 && !ct.IsCancellationRequested; tick++)
                {
                    await Task.Delay(6000, ct);

                    _state.WriteTag(opc, "Spindle.Temperature", (float)Math.Round(22.0 + tick * 0.8 + rng.NextDouble() * 0.4, 1));
                    _state.WriteTag(opc, "Spindle.Load", (float)Math.Round(spindleWarning && tick == 4 ? 82.0 : 10.0 + rng.NextDouble() * 8.0, 1));
                    _state.WriteTag(opc, "Axis.X.Position", (float)Math.Round(rng.NextDouble() * 300.0, 3));
                    _state.WriteTag(opc, "Axis.Y.Position", (float)Math.Round(rng.NextDouble() * 200.0, 3));
                    _state.WriteTag(opc, "Axis.Z.Position", (float)Math.Round(-20.0 - rng.NextDouble() * 60.0, 3));
                    _state.WriteTag(opc, "Axis.X.Load", (float)Math.Round(5.0 + rng.NextDouble() * 10.0, 1));
                    _state.WriteTag(opc, "Axis.Y.Load", (float)Math.Round(5.0 + rng.NextDouble() * 10.0, 1));
                    _state.WriteTag(opc, "Axis.Z.Load", (float)Math.Round(8.0 + rng.NextDouble() * 15.0, 1));
                    _state.WriteTag(opc, "Controller.Block", $"N{(tick + 1) * 10:D4}");

                    if (spindleWarning && tick == 4)
                    {
                        _state.WriteTag(opc, "Condition.Spindle", "WARNING");
                        Console.WriteLine($"[{DateTime.UtcNow:HH:mm:ss}] CONDITION spindle=WARNING load=82%");
                    }

                    if (coolantFault && tick == 6)
                    {
                        _state.WriteTag(opc, "Condition.Coolant", "FAULT");
                        _state.WriteTag(opc, "Coolant.FlowRate", 1.2f);
                        _state.WriteTag(opc, "Controller.Execution", "INTERRUPTED");
                        cycleInterrupted = true;
                        Console.WriteLine($"[{DateTime.UtcNow:HH:mm:ss}] CONDITION coolant=FAULT flow=1.2L/min");
                    }

                    await _broadcastAsync();

                    if (cycleInterrupted) break;
                }

                float cycleTime = (float)Math.Round((DateTime.UtcNow - cycleStart).TotalSeconds * 10, 1);
                string trackOutResult;

                if (cycleInterrupted)
                {
                    trackOutResult = "SCRAPPED";
                    _state.WriteTag(opc, "Material.TrackOutResult", trackOutResult);
                    _state.WriteTag(opc, "Material.TrackOutTime", DateTime.UtcNow.ToString("HH:mm:ss"));
                    await _broadcastAsync();

                    await Task.Delay(2000, ct);

                    _state.WriteTag(opc, "Condition.Coolant", "NORMAL");
                    _state.WriteTag(opc, "Coolant.FlowRate", 8.5f);
                    _state.WriteTag(opc, "Controller.Execution", "READY");
                    Console.WriteLine($"[{DateTime.UtcNow:HH:mm:ss}] TRACK_OUT part={partId} result=SCRAPPED");
                }
                else
                {
                    trackOutResult = "PASS";
                    totalParts++;
                    _state.WriteTag(opc, "Condition.Spindle", "NORMAL");
                    _state.WriteTag(opc, "Controller.Execution", "PROGRAM_COMPLETED");
                    _state.WriteTag(opc, "Controller.Block", "N9999");
                    _state.WriteTag(opc, "Controller.CycleTime", cycleTime);
                    _state.WriteTag(opc, "Controller.PartCount", totalParts);
                    _state.WriteTag(opc, "Spindle.Speed", 0.0f);
                    _state.WriteTag(opc, "Spindle.Load", 0.0f);
                    _state.WriteTag(opc, "Axis.Feedrate", 0.0f);
                    _state.WriteTag(opc, "Coolant.FlowRate", 0.0f);
                    _state.WriteTag(opc, "Material.TrackOutResult", trackOutResult);
                    _state.WriteTag(opc, "Material.TrackOutTime", DateTime.UtcNow.ToString("HH:mm:ss"));
                    Console.WriteLine($"[{DateTime.UtcNow:HH:mm:ss}] CYCLE_COMPLETE cycleTime={cycleTime}s");
                    Console.WriteLine($"[{DateTime.UtcNow:HH:mm:ss}] TRACK_OUT part={partId} result=PASS");
                }

                await _broadcastAsync();

                _state.WriteTag(opc, "Controller.Execution", "READY");
                await _broadcastAsync();
                await Task.Delay(1500, ct);
            }
        }
    }
}
