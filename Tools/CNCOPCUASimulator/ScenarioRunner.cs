using IoTTestOrchestrator.OPCUA.Helpers.OpcTagModel;
using IoTTestOrchestrator.ScenarioBuilder;
using IoTTestOrchestrator.ScenarioBuilder.Implementations.Configuration;
using System.Text.Json;

namespace OPCUASimulator
{
    /// <summary>
    /// Simulates a CNC Machining Center exposing data via OPC-UA.
    /// Node structure follows MTConnect data items and CESMII CNC Smart Manufacturing Profile.
    ///
    /// Simulated machine: CNC_007 (3-axis vertical machining center)
    /// Cycle: aluminium bracket, ~90s per part
    ///
    /// MTConnect references:
    ///   - Controller / Path data items (execution, program, block)
    ///   - Axes data items (position, load, feedrate)
    ///   - Spindle data items (speed, load, override)
    ///   - Condition items mapped to OPC-UA alarms
    ///   - Material track-in / track-out as Events
    /// </summary>
    public class ScenarioRunner
    {
        private TestScenario _scenario;
        private CancellationTokenSource _cts;
        private const string OpcUaServer = "opc.tcp://localhost:4840";
        private const string MachineId = "CNC_007";

        // Simulated state
        private int _partCounter = 441;
        private string _currentWorkOrder = "WO-8821";
        private CncExecutionState _executionState = CncExecutionState.Ready;

        public async Task RunAsync()
        {
            _cts = new CancellationTokenSource();

            var inputTask = Task.Run(() =>
            {
                Console.WriteLine("CNC Simulator - MTConnect/CESMII Profile");
                Console.WriteLine("Press 's' to start cycle simulation");
                Console.WriteLine("Press 'f' to inject a spindle fault");
                Console.WriteLine("Press 'q' to quit");

                while (true)
                {
                    var key = Console.ReadKey(intercept: true);
                    if (key.KeyChar == 'q' || key.KeyChar == 'Q')
                    {
                        Console.WriteLine("\nShutdown initiated...");
                        _cts.Cancel();
                        break;
                    }
                }
            });

            var managerName = "test";
            var scenario = new ScenarioConfiguration()
                .WriteLogsTo("c:/temp/CNC-Simulator.log")
                .ManagerId(managerName)
                .ConfigPath("C:/Users/jroque/Downloads/roque/config.downloaded.json")
                .AddSimulatorPlugin<IoTTestOrchestrator.OPCUA.PluginMain>(new IoTTestOrchestrator.OPCUA.Plugin.SettingsBuilder()
                    .Address(OpcUaServer)

                    // -------------------------------------------------------------------------
                    // CONTROLLER - maps to MTConnect Controller component
                    // -------------------------------------------------------------------------

                    // MTConnect: Execution - active program execution state
                    // Values: READY, ACTIVE, INTERRUPTED, FEED_HOLD, STOPPED, OPTIONAL_STOP, PROGRAM_STOPPED, PROGRAM_COMPLETED
                    .AddTag(new OpcTag()
                    {
                        Name = "Controller.Execution",
                        NodeId = "ns=2;s=cnc007.controller.execution",
                        AccessMode = AccessMode.ReadAndWrite,
                        Value = JsonSerializer.SerializeToElement("READY"),
                        Type = "String"
                    })

                    // MTConnect: Program - name of the active NC program
                    .AddTag(new OpcTag()
                    {
                        Name = "Controller.Program",
                        NodeId = "ns=2;s=cnc007.controller.program",
                        AccessMode = AccessMode.ReadAndWrite,
                        Value = JsonSerializer.SerializeToElement("O1001_BRACKET_AL6061"),
                        Type = "String"
                    })

                    // MTConnect: Block - current executing NC block
                    .AddTag(new OpcTag()
                    {
                        Name = "Controller.Block",
                        NodeId = "ns=2;s=cnc007.controller.block",
                        AccessMode = AccessMode.ReadAndWrite,
                        Value = JsonSerializer.SerializeToElement("N0000"),
                        Type = "String"
                    })

                    // MTConnect: EmergencyStop - ARMED or TRIGGERED
                    .AddTag(new OpcTag()
                    {
                        Name = "Controller.EmergencyStop",
                        NodeId = "ns=2;s=cnc007.controller.emergencyStop",
                        AccessMode = AccessMode.ReadAndWrite,
                        Value = JsonSerializer.SerializeToElement("ARMED"),
                        Type = "String"
                    })

                    // MTConnect: PartCount - cumulative parts produced
                    .AddTag(new OpcTag()
                    {
                        Name = "Controller.PartCount",
                        NodeId = "ns=2;s=cnc007.controller.partCount",
                        AccessMode = AccessMode.ReadAndWrite,
                        Value = JsonSerializer.SerializeToElement(0),
                        Type = "Int32"
                    })

                    // MTConnect: CycleTime - last completed cycle duration in seconds
                    .AddTag(new OpcTag()
                    {
                        Name = "Controller.CycleTime",
                        NodeId = "ns=2;s=cnc007.controller.cycleTime",
                        AccessMode = AccessMode.ReadAndWrite,
                        Value = JsonSerializer.SerializeToElement(0.0),
                        Type = "Float"
                    })

                    // -------------------------------------------------------------------------
                    // SPINDLE - maps to MTConnect Rotary axis component (C1 / spindle)
                    // -------------------------------------------------------------------------

                    // MTConnect: RotaryVelocity (Spindle Speed) in RPM
                    .AddTag(new OpcTag()
                    {
                        Name = "Spindle.Speed",
                        NodeId = "ns=2;s=cnc007.spindle.speed",
                        AccessMode = AccessMode.ReadAndWrite,
                        Value = JsonSerializer.SerializeToElement(0.0),
                        Type = "Float"
                    })

                    // MTConnect: Load (Spindle Load) in % of rated load
                    .AddTag(new OpcTag()
                    {
                        Name = "Spindle.Load",
                        NodeId = "ns=2;s=cnc007.spindle.load",
                        AccessMode = AccessMode.ReadAndWrite,
                        Value = JsonSerializer.SerializeToElement(0.0),
                        Type = "Float"
                    })

                    // MTConnect: RotaryVelocityOverride - operator override % (0-200)
                    .AddTag(new OpcTag()
                    {
                        Name = "Spindle.Override",
                        NodeId = "ns=2;s=cnc007.spindle.override",
                        AccessMode = AccessMode.ReadAndWrite,
                        Value = JsonSerializer.SerializeToElement(100.0),
                        Type = "Float"
                    })

                    // MTConnect: Temperature - spindle bearing temperature in °C
                    .AddTag(new OpcTag()
                    {
                        Name = "Spindle.Temperature",
                        NodeId = "ns=2;s=cnc007.spindle.temperature",
                        AccessMode = AccessMode.ReadAndWrite,
                        Value = JsonSerializer.SerializeToElement(22.0),
                        Type = "Float"
                    })

                    // MTConnect: ToolNumber - currently loaded tool
                    .AddTag(new OpcTag()
                    {
                        Name = "Spindle.ToolNumber",
                        NodeId = "ns=2;s=cnc007.spindle.toolNumber",
                        AccessMode = AccessMode.ReadAndWrite,
                        Value = JsonSerializer.SerializeToElement(0),
                        Type = "Int32"
                    })

                    // -------------------------------------------------------------------------
                    // LINEAR AXES - maps to MTConnect Linear axis components (X, Y, Z)
                    // -------------------------------------------------------------------------

                    // MTConnect: Position (actual) for X axis in mm
                    .AddTag(new OpcTag()
                    {
                        Name = "Axis.X.Position",
                        NodeId = "ns=2;s=cnc007.axis.x.position",
                        AccessMode = AccessMode.ReadAndWrite,
                        Value = JsonSerializer.SerializeToElement(0.0),
                        Type = "Float"
                    })

                    // MTConnect: Load for X axis in %
                    .AddTag(new OpcTag()
                    {
                        Name = "Axis.X.Load",
                        NodeId = "ns=2;s=cnc007.axis.x.load",
                        AccessMode = AccessMode.ReadAndWrite,
                        Value = JsonSerializer.SerializeToElement(0.0),
                        Type = "Float"
                    })

                    // MTConnect: Position (actual) for Y axis in mm
                    .AddTag(new OpcTag()
                    {
                        Name = "Axis.Y.Position",
                        NodeId = "ns=2;s=cnc007.axis.y.position",
                        AccessMode = AccessMode.ReadAndWrite,
                        Value = JsonSerializer.SerializeToElement(0.0),
                        Type = "Float"
                    })

                    // MTConnect: Load for Y axis in %
                    .AddTag(new OpcTag()
                    {
                        Name = "Axis.Y.Load",
                        NodeId = "ns=2;s=cnc007.axis.y.load",
                        AccessMode = AccessMode.ReadAndWrite,
                        Value = JsonSerializer.SerializeToElement(0.0),
                        Type = "Float"
                    })

                    // MTConnect: Position (actual) for Z axis in mm
                    .AddTag(new OpcTag()
                    {
                        Name = "Axis.Z.Position",
                        NodeId = "ns=2;s=cnc007.axis.z.position",
                        AccessMode = AccessMode.ReadAndWrite,
                        Value = JsonSerializer.SerializeToElement(0.0),
                        Type = "Float"
                    })

                    // MTConnect: Load for Z axis in %
                    .AddTag(new OpcTag()
                    {
                        Name = "Axis.Z.Load",
                        NodeId = "ns=2;s=cnc007.axis.z.load",
                        AccessMode = AccessMode.ReadAndWrite,
                        Value = JsonSerializer.SerializeToElement(0.0),
                        Type = "Float"
                    })

                    // MTConnect: PathFeedrate - actual combined feedrate in mm/min
                    .AddTag(new OpcTag()
                    {
                        Name = "Axis.Feedrate",
                        NodeId = "ns=2;s=cnc007.axis.feedrate",
                        AccessMode = AccessMode.ReadAndWrite,
                        Value = JsonSerializer.SerializeToElement(0.0),
                        Type = "Float"
                    })

                    // MTConnect: FeedrateOverride - operator override % (0-200)
                    .AddTag(new OpcTag()
                    {
                        Name = "Axis.FeedrateOverride",
                        NodeId = "ns=2;s=cnc007.axis.feedrateOverride",
                        AccessMode = AccessMode.ReadAndWrite,
                        Value = JsonSerializer.SerializeToElement(100.0),
                        Type = "Float"
                    })

                    // -------------------------------------------------------------------------
                    // COOLANT SYSTEM
                    // -------------------------------------------------------------------------

                    // MTConnect: CoolantFlowRate in L/min
                    .AddTag(new OpcTag()
                    {
                        Name = "Coolant.FlowRate",
                        NodeId = "ns=2;s=cnc007.coolant.flowRate",
                        AccessMode = AccessMode.ReadAndWrite,
                        Value = JsonSerializer.SerializeToElement(0.0),
                        Type = "Float"
                    })

                    // MTConnect: Temperature - coolant temperature in °C
                    .AddTag(new OpcTag()
                    {
                        Name = "Coolant.Temperature",
                        NodeId = "ns=2;s=cnc007.coolant.temperature",
                        AccessMode = AccessMode.ReadAndWrite,
                        Value = JsonSerializer.SerializeToElement(20.0),
                        Type = "Float"
                    })

                    // -------------------------------------------------------------------------
                    // CONDITIONS - maps to MTConnect Condition items
                    // Severity: NORMAL, WARNING, FAULT
                    // -------------------------------------------------------------------------

                    .AddTag(new OpcTag()
                    {
                        Name = "Condition.Spindle",
                        NodeId = "ns=2;s=cnc007.condition.spindle",
                        AccessMode = AccessMode.ReadAndWrite,
                        Value = JsonSerializer.SerializeToElement("NORMAL"),
                        Type = "String"
                    })

                    .AddTag(new OpcTag()
                    {
                        Name = "Condition.Coolant",
                        NodeId = "ns=2;s=cnc007.condition.coolant",
                        AccessMode = AccessMode.ReadAndWrite,
                        Value = JsonSerializer.SerializeToElement("NORMAL"),
                        Type = "String"
                    })

                    .AddTag(new OpcTag()
                    {
                        Name = "Condition.Axes",
                        NodeId = "ns=2;s=cnc007.condition.axes",
                        AccessMode = AccessMode.ReadAndWrite,
                        Value = JsonSerializer.SerializeToElement("NORMAL"),
                        Type = "String"
                    })

                    // -------------------------------------------------------------------------
                    // MATERIAL TRACKING - CESMII / ISA-95 track-in / track-out events
                    // -------------------------------------------------------------------------

                    // Part identifier currently loaded in the machine
                    .AddTag(new OpcTag()
                    {
                        Name = "Material.CurrentPartId",
                        NodeId = "ns=2;s=cnc007.material.currentPartId",
                        AccessMode = AccessMode.ReadAndWrite,
                        Value = JsonSerializer.SerializeToElement(""),
                        Type = "String"
                    })

                    // Work order driving the current production
                    .AddTag(new OpcTag()
                    {
                        Name = "Material.WorkOrderId",
                        NodeId = "ns=2;s=cnc007.material.workOrderId",
                        AccessMode = AccessMode.ReadAndWrite,
                        Value = JsonSerializer.SerializeToElement(""),
                        Type = "String"
                    })

                    // Track-in event: timestamp when part entered the machine
                    .AddTag(new OpcTag()
                    {
                        Name = "Material.TrackInTime",
                        NodeId = "ns=2;s=cnc007.material.trackInTime",
                        AccessMode = AccessMode.ReadAndWrite,
                        Value = JsonSerializer.SerializeToElement(""),
                        Type = "String"
                    })

                    // Track-out event: result of the completed operation
                    // Values: PASS, FAIL, SCRAPPED, REWORK
                    .AddTag(new OpcTag()
                    {
                        Name = "Material.TrackOutResult",
                        NodeId = "ns=2;s=cnc007.material.trackOutResult",
                        AccessMode = AccessMode.ReadAndWrite,
                        Value = JsonSerializer.SerializeToElement(""),
                        Type = "String"
                    })

                    // Track-out event: timestamp when part exited the machine
                    .AddTag(new OpcTag()
                    {
                        Name = "Material.TrackOutTime",
                        NodeId = "ns=2;s=cnc007.material.trackOutTime",
                        AccessMode = AccessMode.ReadAndWrite,
                        Value = JsonSerializer.SerializeToElement(""),
                        Type = "String"
                    })

                    .Build());

            _scenario = new TestScenario(scenario);
            var context = _scenario.Context();
            var opc = context.Simulators["OPCUA"] as IoTTestOrchestrator.OPCUA.PluginMain;

            try
            {
                _scenario.Start();
                _scenario.StartSimulators();

                Console.WriteLine($"[{MachineId}] OPC-UA server running at {OpcUaServer}");
                Console.WriteLine("Press 's' to start a part cycle simulation...");

                Thread.Sleep(10000);

                await RunCncCycleSimulationAsync(opc, _cts.Token);
            }
            catch (OperationCanceledException)
            {
                Console.WriteLine("Simulation cancelled.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
            }
            finally
            {
                _scenario.ShutdownSimulators();
                _scenario.Shutdown();
            }
        }

        /// <summary>
        /// Simulates a realistic CNC cycle sequence:
        ///   1. Track-in (part loaded by operator)
        ///   2. Program execution with live spindle, axis, and coolant data
        ///   3. Occasional WARNING or FAULT condition injection
        ///   4. Cycle complete and track-out (PASS or SCRAPPED)
        /// </summary>
        private async Task RunCncCycleSimulationAsync(IoTTestOrchestrator.OPCUA.PluginMain opc, CancellationToken ct)
        {
            var rng = new Random();
            int totalParts = 0;

            while (!ct.IsCancellationRequested)
            {
                string partId = $"BRK-2026-{_partCounter++:D4}";
                string trackInTime = DateTime.UtcNow.ToString("HH:mm:ss");
                bool injectCoolantFault = rng.NextDouble() < 0.15; // 15% chance of coolant issue
                bool injectSpindleWarning = rng.NextDouble() < 0.10; // 10% chance of spindle load spike

                // --- TRACK IN ---
                Console.WriteLine($"\n[{DateTime.UtcNow:HH:mm:ss}] TRACK_IN  part={partId} order={_currentWorkOrder}");
                opc.WriteTag("Material.CurrentPartId", partId);
                opc.WriteTag("Material.WorkOrderId", _currentWorkOrder);
                opc.WriteTag("Material.TrackInTime", trackInTime);
                opc.WriteTag("Material.TrackOutResult", "");
                opc.WriteTag("Material.TrackOutTime", "");

                // --- CYCLE START ---
                opc.WriteTag("Controller.Execution", "ACTIVE");
                opc.WriteTag("Controller.Program", "O1001_BRACKET_AL6061");
                opc.WriteTag("Controller.Block", "N0010");
                opc.WriteTag("Spindle.ToolNumber", 4);
                opc.WriteTag("Spindle.Speed", 8200.0);
                opc.WriteTag("Spindle.Load", 12.0);
                opc.WriteTag("Axis.Feedrate", 500.0);
                opc.WriteTag("Coolant.FlowRate", 8.5);

                Console.WriteLine($"[{DateTime.UtcNow:HH:mm:ss}] CYCLE_START tool=T04 speed=8200rpm feed=500mm/min");

                var cycleStart = DateTime.UtcNow;
                bool cycleInterrupted = false;

                // Simulate ~90 second cycle in fast-forward (scaled to 9s for demo purposes)
                // Each iteration = ~10 seconds of machine time
                for (int tick = 0; tick < 9 && !ct.IsCancellationRequested; tick++)
                {
                    await Task.Delay(60000, ct);

                    // Gradually increase spindle temperature (realistic thermal drift)
                    double spindleTemp = 22.0 + tick * 0.8 + rng.NextDouble() * 0.4;
                    opc.WriteTag("Spindle.Temperature", Math.Round(spindleTemp, 1));

                    // Vary spindle load slightly
                    double spindleLoad = injectSpindleWarning && tick == 4
                        ? 82.0  // spike at mid-cycle
                        : 10.0 + rng.NextDouble() * 8.0;
                    opc.WriteTag("Spindle.Load", Math.Round(spindleLoad, 1));

                    // Simulate axis movement
                    opc.WriteTag("Axis.X.Position", Math.Round(rng.NextDouble() * 300.0, 3));
                    opc.WriteTag("Axis.Y.Position", Math.Round(rng.NextDouble() * 200.0, 3));
                    opc.WriteTag("Axis.Z.Position", Math.Round(-20.0 - rng.NextDouble() * 60.0, 3));
                    opc.WriteTag("Axis.X.Load", Math.Round(5.0 + rng.NextDouble() * 10.0, 1));
                    opc.WriteTag("Axis.Y.Load", Math.Round(5.0 + rng.NextDouble() * 10.0, 1));
                    opc.WriteTag("Axis.Z.Load", Math.Round(8.0 + rng.NextDouble() * 15.0, 1));
                    opc.WriteTag("Controller.Block", $"N{(tick + 1) * 10:D4}");

                    // Inject spindle load warning at tick 4
                    if (injectSpindleWarning && tick == 4)
                    {
                        opc.WriteTag("Condition.Spindle", "WARNING");
                        Console.WriteLine($"[{DateTime.UtcNow:HH:mm:ss}] CONDITION spindle=WARNING  load=82% (possible tool wear on T04)");
                    }

                    // Inject coolant fault at tick 6 and interrupt the cycle
                    if (injectCoolantFault && tick == 6)
                    {
                        opc.WriteTag("Condition.Coolant", "FAULT");
                        opc.WriteTag("Coolant.FlowRate", 1.2);
                        opc.WriteTag("Controller.Execution", "INTERRUPTED");
                        Console.WriteLine($"[{DateTime.UtcNow:HH:mm:ss}] CONDITION coolant=FAULT    flow=1.2 L/min (below threshold 4.0)");
                        Console.WriteLine($"[{DateTime.UtcNow:HH:mm:ss}] CYCLE_INTERRUPTED");
                        cycleInterrupted = true;
                        break;
                    }
                }

                double actualCycleTime = Math.Round((DateTime.UtcNow - cycleStart).TotalSeconds * 10, 1); // scaled back to machine time
                string trackOutResult;

                if (cycleInterrupted)
                {
                    // Simulate operator intervention and recovery
                    trackOutResult = "SCRAPPED";
                    Console.WriteLine($"[{DateTime.UtcNow:HH:mm:ss}] TRACK_OUT part={partId} result=SCRAPPED cycleTime={actualCycleTime}s");

                    await Task.Delay(2000, ct); // operator clears fault

                    opc.WriteTag("Condition.Coolant", "NORMAL");
                    opc.WriteTag("Coolant.FlowRate", 8.5);
                    opc.WriteTag("Controller.Execution", "READY");
                    Console.WriteLine($"[{DateTime.UtcNow:HH:mm:ss}] CONDITION coolant=NORMAL (fault cleared by operator)");
                }
                else
                {
                    // Normal cycle complete
                    trackOutResult = "PASS";
                    totalParts++;
                    opc.WriteTag("Condition.Spindle", "NORMAL");
                    opc.WriteTag("Controller.Execution", "PROGRAM_COMPLETED");
                    opc.WriteTag("Controller.Block", "N9999");
                    opc.WriteTag("Controller.CycleTime", actualCycleTime);
                    opc.WriteTag("Controller.PartCount", totalParts);
                    opc.WriteTag("Spindle.Speed", 0.0);
                    opc.WriteTag("Spindle.Load", 0.0);
                    opc.WriteTag("Axis.Feedrate", 0.0);
                    opc.WriteTag("Coolant.FlowRate", 0.0);
                    Console.WriteLine($"[{DateTime.UtcNow:HH:mm:ss}] CYCLE_COMPLETE cycleTime={actualCycleTime}s");
                    Console.WriteLine($"[{DateTime.UtcNow:HH:mm:ss}] TRACK_OUT part={partId} result=PASS cycleTime={actualCycleTime}s");
                }

                // Write track-out to OPC-UA
                opc.WriteTag("Material.TrackOutResult", trackOutResult);
                opc.WriteTag("Material.TrackOutTime", DateTime.UtcNow.ToString("HH:mm:ss"));

                // Reset to READY before next part
                opc.WriteTag("Controller.Execution", "READY");
                await Task.Delay(1500, ct); // short idle between parts
            }
        }
    }

    /// <summary>
    /// Maps to MTConnect Execution data item values.
    /// </summary>
    public enum CncExecutionState
    {
        Ready,
        Active,
        Interrupted,
        FeedHold,
        Stopped,
        ProgramCompleted
    }
}