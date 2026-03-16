using CNCOPCUASimulator.Objects;
using IoTTestOrchestrator.Common.Interfaces.Test;
using IoTTestOrchestrator.OPCUA.Helpers.OpcTagModel;
using IoTTestOrchestrator.ScenarioBuilder;
using IoTTestOrchestrator.ScenarioBuilder.Implementations.Configuration;
using System.Text.Json;

namespace CNCOPCUASimulator
{
    /// <summary>
    /// Orchestrates the CNC simulator: builds the OPC-UA scenario, wires up the
    /// WebSocket server and cycle simulator, then drives the start/stop loop.
    /// </summary>
    public class ScenarioRunner
    {
        private TestScenario _scenario;
        private CancellationTokenSource _cts;
        private readonly SemaphoreSlim _startSignal = new(0, 1);

        private const string OpcUaServer = "opc.tcp://localhost:4840";
        private const string MachineId = "CNC_007";
        private const string ManagerName = "test";

        public async Task RunAsync()
        {
            _cts = new CancellationTokenSource();

            Console.WriteLine("CNC Simulator — MTConnect/CESMII Profile");
            Console.WriteLine($"WebSocket UI server : {CncWebSocketServer.WsUrl}");
            Console.WriteLine($"OPC-UA server       : {OpcUaServer}");
            Console.WriteLine("Press 'q' to quit");

            _ = Task.Run(() =>
            {
                while (true)
                {
                    var key = Console.ReadKey(intercept: true);
                    if (key.KeyChar is 'q' or 'Q')
                    {
                        Console.WriteLine("\nShutdown initiated…");
                        _cts.Cancel();
                        break;
                    }
                }
            });

            var scenario = new ScenarioConfiguration()
                .ManagerId(ManagerName)
                .ConfigPath("C:/Users/Roque/Downloads/roque/config.downloaded.json")
                .AddSimulatorPlugin<IoTTestOrchestrator.OPCUA.PluginMain>(
                    new IoTTestOrchestrator.OPCUA.Plugin.SettingsBuilder()
                        .Address(OpcUaServer)
                        .AddTag(new OpcTag { Name = "Controller.Execution", NodeId = "ns=2;s=cnc007.controller.execution", AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement("READY"), Type = "String" })
                        .AddTag(new OpcTag { Name = "Controller.Program", NodeId = "ns=2;s=cnc007.controller.program", AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement("O1001_BRACKET_AL6061"), Type = "String" })
                        .AddTag(new OpcTag { Name = "Controller.Block", NodeId = "ns=2;s=cnc007.controller.block", AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement("N0000"), Type = "String" })
                        .AddTag(new OpcTag { Name = "Controller.EmergencyStop", NodeId = "ns=2;s=cnc007.controller.emergencyStop", AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement("ARMED"), Type = "String" })
                        .AddTag(new OpcTag { Name = "Controller.PartCount", NodeId = "ns=2;s=cnc007.controller.partCount", AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(0), Type = "Int32" })
                        .AddTag(new OpcTag { Name = "Controller.CycleTime", NodeId = "ns=2;s=cnc007.controller.cycleTime", AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(0.0), Type = "Float" })
                        .AddTag(new OpcTag { Name = "Spindle.Speed", NodeId = "ns=2;s=cnc007.spindle.speed", AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(0.0), Type = "Float" })
                        .AddTag(new OpcTag { Name = "Spindle.Load", NodeId = "ns=2;s=cnc007.spindle.load", AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(0.0), Type = "Float" })
                        .AddTag(new OpcTag { Name = "Spindle.Override", NodeId = "ns=2;s=cnc007.spindle.override", AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(100.0), Type = "Float" })
                        .AddTag(new OpcTag { Name = "Spindle.Temperature", NodeId = "ns=2;s=cnc007.spindle.temperature", AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(22.0), Type = "Float" })
                        .AddTag(new OpcTag { Name = "Spindle.ToolNumber", NodeId = "ns=2;s=cnc007.spindle.toolNumber", AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(0), Type = "Int32" })
                        .AddTag(new OpcTag { Name = "Axis.X.Position", NodeId = "ns=2;s=cnc007.axis.x.position", AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(0.0), Type = "Float" })
                        .AddTag(new OpcTag { Name = "Axis.X.Load", NodeId = "ns=2;s=cnc007.axis.x.load", AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(0.0), Type = "Float" })
                        .AddTag(new OpcTag { Name = "Axis.Y.Position", NodeId = "ns=2;s=cnc007.axis.y.position", AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(0.0), Type = "Float" })
                        .AddTag(new OpcTag { Name = "Axis.Y.Load", NodeId = "ns=2;s=cnc007.axis.y.load", AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(0.0), Type = "Float" })
                        .AddTag(new OpcTag { Name = "Axis.Z.Position", NodeId = "ns=2;s=cnc007.axis.z.position", AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(0.0), Type = "Float" })
                        .AddTag(new OpcTag { Name = "Axis.Z.Load", NodeId = "ns=2;s=cnc007.axis.z.load", AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(0.0), Type = "Float" })
                        .AddTag(new OpcTag { Name = "Axis.Feedrate", NodeId = "ns=2;s=cnc007.axis.feedrate", AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(0.0), Type = "Float" })
                        .AddTag(new OpcTag { Name = "Axis.FeedrateOverride", NodeId = "ns=2;s=cnc007.axis.feedrateOverride", AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(100.0), Type = "Float" })
                        .AddTag(new OpcTag { Name = "Coolant.FlowRate", NodeId = "ns=2;s=cnc007.coolant.flowRate", AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(0.0), Type = "Float" })
                        .AddTag(new OpcTag { Name = "Coolant.Temperature", NodeId = "ns=2;s=cnc007.coolant.temperature", AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(20.0), Type = "Float" })
                        .AddTag(new OpcTag { Name = "Condition.Spindle", NodeId = "ns=2;s=cnc007.condition.spindle", AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement("NORMAL"), Type = "String" })
                        .AddTag(new OpcTag { Name = "Condition.Coolant", NodeId = "ns=2;s=cnc007.condition.coolant", AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement("NORMAL"), Type = "String" })
                        .AddTag(new OpcTag { Name = "Condition.Axes", NodeId = "ns=2;s=cnc007.condition.axes", AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement("NORMAL"), Type = "String" })
                        .AddTag(new OpcTag { Name = "Material.CurrentPartId", NodeId = "ns=2;s=cnc007.material.currentPartId", AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(""), Type = "String" })
                        .AddTag(new OpcTag { Name = "Material.WorkOrderId", NodeId = "ns=2;s=cnc007.material.workOrderId", AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(""), Type = "String" })
                        .AddTag(new OpcTag { Name = "Material.TrackInTime", NodeId = "ns=2;s=cnc007.material.trackInTime", AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(""), Type = "String" })
                        .AddTag(new OpcTag { Name = "Material.TrackOutResult", NodeId = "ns=2;s=cnc007.material.trackOutResult", AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(""), Type = "String" })
                        .AddTag(new OpcTag { Name = "Material.TrackOutTime", NodeId = "ns=2;s=cnc007.material.trackOutTime", AccessMode = AccessMode.ReadAndWrite, Value = JsonSerializer.SerializeToElement(""), Type = "String" })
                        .Build());

            _scenario = new TestScenario(scenario);
            var context = _scenario.Context();

            _scenario.Run(async (scenario, context) =>
            {
                RunAsync(scenario, context).GetAwaiter().GetResult();
            });
        }

        private async Task RunAsync(TestScenario scenario, ITestContext context)
        {
            var opc = context.Simulators["OPCUA"] as IoTTestOrchestrator.OPCUA.PluginMain;

            var machineState = new CncMachineState();
            var messageBuilder = new CncMessageBuilder(machineState, MachineId, OpcUaServer);
            var wsServer = new CncWebSocketServer(messageBuilder, _startSignal);
            var cycleSimulator = new CncCycleSimulator(machineState, wsServer.BroadcastAsync);

            Console.WriteLine($"[{MachineId}] OPC-UA server running at {OpcUaServer}");

            Utilities.WaitForConnection(_scenario, ManagerName);

            _ = wsServer.RunAsync(_cts.Token);

            // Main loop: wait for Start from UI → run cycles → wait again
            while (!_cts.IsCancellationRequested)
            {
                Console.WriteLine($"[{MachineId}] Waiting for Start command from UI…");
                await _startSignal.WaitAsync(_cts.Token);

                wsServer.CycleCts = new CancellationTokenSource();
                Console.WriteLine($"[{MachineId}] Cycle loop started");

                try
                {
                    await cycleSimulator.RunCyclesAsync(opc, wsServer.CycleCts.Token);
                }
                catch (OperationCanceledException)
                {
                    Console.WriteLine($"[{MachineId}] Cycle interrupted by Stop command");
                }

                // Reset machine to idle
                machineState.WriteTag(opc, "Controller.Execution", "READY");
                machineState.WriteTag(opc, "Spindle.Speed", 0.0f);
                machineState.WriteTag(opc, "Spindle.Load", 0.0f);
                machineState.WriteTag(opc, "Axis.Feedrate", 0.0f);
                machineState.WriteTag(opc, "Coolant.FlowRate", 0.0f);
                await wsServer.BroadcastAsync();

                Console.WriteLine($"[{MachineId}] Idle — waiting for next Start…");
            }
        }
    }
}

