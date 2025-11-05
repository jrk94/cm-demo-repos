using IoTTestOrchestrator;
using OPCUA.Helpers.OpcTagModel;
using ScenarioBuilder.Implementations.Configuration;
using System.Text.Json;

namespace OPCUASimulator
{
    public class ScenarioRunner
    {
        private TestScenario _scenario;
        private Dictionary<string, OPCUA.PluginMain> _opcuaSimulators = [];
        private CancellationTokenSource cts;
        private const string OPCUASERVER = @"opc.tcp://localhost:4840";
        private static bool startModeEnabled = false;
        private static readonly object modeLock = new object();

        public ScenarioRunner()
        {
        }

        public async System.Threading.Tasks.Task RunAsync()
        {
            cts = new CancellationTokenSource();

            // Start listening for a shutdown key
            var inputTask = System.Threading.Tasks.Task.Run(() =>
            {
                Console.WriteLine("Press 's' to start simulation;\nPress 'q' to quit.");
                while (true)
                {
                    var key = Console.ReadKey(intercept: true);
                    if (key.KeyChar == 'q' || key.KeyChar == 'Q')
                    {
                        Console.WriteLine("\nShutdown initiated...");
                        cts.Cancel();
                        break;
                    }

                    if (key.KeyChar == 's' || key.KeyChar == 'S')
                    {
                        lock (modeLock)
                        {
                            startModeEnabled = !startModeEnabled; // Toggle mode
                            Console.WriteLine(startModeEnabled
                                ? "\nStart Mode Out of Control initiated..."
                                : "\nStart Mode disabled...");
                        }
                        break;
                    }
                }
            });

            var scenario = new ScenarioConfiguration()
               .WriteLogsTo("c:/temp/CFX-Simulator.log")// Activate this line to send the logs to a particular place
               .ManagerId("OPCUAManager")
             .ConfigPath("C:\\Users\\jroque\\Downloads\\Agentic Manager\\config.full.json")
             // .Build())
             .AddSimulatorPlugin<OPCUA.PluginMain>(new OPCUA.Plugin.SettingsBuilder()
                .Address(OPCUASERVER)
                .AddTag(new OpcTag()
                {
                    Name = "NozzleSection1",
                    NodeId = "ns=2;s=nozzleSection1",
                    AccessMode = AccessMode.ReadAndWrite,
                    Value = JsonSerializer.SerializeToElement(0),
                    Type = "Float"
                })
                .AddTag(new OpcTag()
                {
                    Name = "NozzleSection2",
                    NodeId = "ns=2;s=nozzleSection2",
                    AccessMode = AccessMode.ReadAndWrite,
                    Value = JsonSerializer.SerializeToElement(0),
                    Type = "Float"
                })
                .AddTag(new OpcTag()
                {
                    Name = "NozzleSection3",
                    NodeId = "ns=2;s=nozzleSection3",
                    AccessMode = AccessMode.ReadAndWrite,
                    Value = JsonSerializer.SerializeToElement(0),
                    Type = "Float"
                })
                .AddTag(new OpcTag()
                {
                    Name = "TemperatureSection1",
                    NodeId = "ns=2;s=temperatureSection1",
                    AccessMode = AccessMode.ReadAndWrite,
                    Value = JsonSerializer.SerializeToElement(100),
                    Type = "Float"
                })
                .AddTag(new OpcTag()
                {
                    Name = "TemperatureSection2",
                    NodeId = "ns=2;s=temperatureSection2",
                    AccessMode = AccessMode.ReadAndWrite,
                    Value = JsonSerializer.SerializeToElement(200),
                    Type = "Float"
                })
                .AddTag(new OpcTag()
                {
                    Name = "TemperatureSection3",
                    NodeId = "ns=2;s=temperatureSection3",
                    AccessMode = AccessMode.ReadAndWrite,
                    Value = JsonSerializer.SerializeToElement(90),
                    Type = "Float"
                })
                .AddTag(new OpcTag()
                {
                    Name = "PressureSection1",
                    NodeId = "ns=2;s=pressureSection1",
                    AccessMode = AccessMode.ReadAndWrite,
                    Value = JsonSerializer.SerializeToElement(0.6),
                    Type = "Float"
                })
                .AddTag(new OpcTag()
                {
                    Name = "PressureSection2",
                    NodeId = "ns=2;s=pressureSection2",
                    AccessMode = AccessMode.ReadAndWrite,
                    Value = JsonSerializer.SerializeToElement(1.8),
                    Type = "Float"
                })
                .AddTag(new OpcTag()
                {
                    Name = "PressureSection3",
                    NodeId = "ns=2;s=pressureSection3",
                    AccessMode = AccessMode.ReadAndWrite,
                    Value = JsonSerializer.SerializeToElement(0.2),
                    Type = "Float"
                })
            .Build());

            _scenario = new TestScenario(scenario);
            var context = _scenario.Context();
            OPCUA.PluginMain opcuaSimulator = (context.Simulators["OPCUA"] as OPCUA.PluginMain);

            try
            {
                _scenario.Start();
                _scenario.StartSimulators();

                while (!cts.Token.IsCancellationRequested)
                {
                    bool shouldRun;
                    lock (modeLock)
                    {
                        shouldRun = startModeEnabled;
                    }

                    if (shouldRun)
                    {
                        opcuaSimulator.WriteTag("TemperatureSection1", 200);
                        var x = opcuaSimulator.ReadTag("Nozzle1");
                    }
                    else
                    {
                        await Task.Delay(100, cts.Token); // Small delay to avoid busy-waiting
                    }
                }
            }
            catch (Exception ex)
            {
            }
            finally
            {
                _scenario.ShutdownSimulators();
                _scenario.Shutdown();
            }
        }
    }
}