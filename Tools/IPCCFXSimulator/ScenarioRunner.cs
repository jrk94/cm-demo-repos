using Cmf.Foundation.BusinessObjects;
using Cmf.Foundation.BusinessOrchestration.GenericServiceManagement.InputObjects;
using Cmf.Navigo.BusinessObjects;
using IoTTestOrchestrator;
using IPCCFXSimulator.Services;
using ScenarioBuilder.Implementations.Configuration;
using System.Collections.Concurrent;
using System.Data;

namespace IPCCFXSimulator
{
    public partial class ScenarioRunner
    {
        private decimal _speed;
        private decimal _defectProbability;
        private bool _terminateOnStart;
        private TestScenario _scenario;
        private Dictionary<string, IPCCFX.PluginMain> _cfxSimulators = [];
        private CancellationTokenSource cts;
        private readonly IEventsService _eventsService;

        private readonly string[] availableProducts = ["SMT PowerUnit_DP_A", "SMT PowerUnit_DP_B", "SMT PowerUnit_DP_C", "SMT PowerUnit_DP_D"];
        private readonly string flowPathSerialization = "PCBA_SingleSide:A:1/PCB Serialization:1";
        private readonly string flowPathTrackoutLine = "PCBA_SingleSide:A:1/SMT:2";
        private readonly string lotForm = "SMTLot";
        private readonly string resourceSMTLine = "SMT03";
        private readonly string resourceLaserMark = "PCB-LM01";
        private readonly string[] ppResources = ["PnP06", "PnP07"];
        private readonly string spiResource = "SPI03";
        private readonly string printerResource = "PRT03";
        private readonly string aoiResource = "AOI03";
        private readonly string reworkResource = "RWK01";
        private readonly ConcurrentDictionary<string, string> defectBoards = [];
        private static readonly object _trackLock = new object();

        private StateModel _stateModel;

        public ScenarioRunner(IEventsService eventsService,
            decimal speed = 1m, decimal defectProbability = 0.8m, bool terminateOnStart = false)
        {
            this._speed = speed;
            this._defectProbability = defectProbability;
            this._terminateOnStart = terminateOnStart;
            this._eventsService = eventsService;
        }

        public async System.Threading.Tasks.Task RunAsync()
        {
            cts = new CancellationTokenSource();

            // Start listening for a shutdown key
            var inputTask = System.Threading.Tasks.Task.Run(() =>
            {
                Console.WriteLine("Press 'q' to quit.");
                while (true)
                {
                    var key = Console.ReadKey(intercept: true);
                    if (key.KeyChar == 'q' || key.KeyChar == 'Q')
                    {
                        Console.WriteLine("\nShutdown initiated...");
                        cts.Cancel();
                        break;
                    }
                }
            });

            var driverHandle = "CMF.Driver.IPCCFX";
            var driver = $"amqp://localhost:5001";
            var driverAddress = "/queue/CMF.Driver.IPCCFX";
            var targetHandle = "oven.test.machine";
            var target = $"amqp://localhost:5672";
            var managerName = "IPCCFX_Manager";

            var scenario = new ScenarioConfiguration()
               .WriteLogsTo("c:/temp/CFX-Simulator.log")// Activate this line to send the logs to a particular place
               .ManagerId(managerName)
               .ConfigPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "config.full.json"))
               //.StartMode<LocalStartMode.PluginMain>(new LocalStartMode.Plugin.SettingsBuilder()
               // .ManagerLocation("C:\\Users\\jroque\\Downloads\\IPCCFX_Manager")
               // .Build())
               .AddSimulatorPlugin<IPCCFX.PluginMain>(new IPCCFX.Plugin.SettingsBuilder()
                .AddBroker()
                .AddTestCFXEndpoint(targetHandle, "", target)
                .AddConnectIoTCFXEndpoint(driverHandle, driverAddress, driver)
            .Build());

            _scenario = new TestScenario(scenario);
            var context = _scenario.Context();

            try
            {
                _scenario.Start();
                _scenario.StartSimulators();

                IPCCFXSimulator.Utilities.WaitForConnection(_scenario, managerName);

                _cfxSimulators.Add("Oven", (context.Simulators["IPC-CFX"] as IPCCFX.PluginMain));
                _cfxSimulators["Oven"].SendMessage(new CFX.CFXEnvelope(new CFX.EndpointConnected
                {
                    CFXHandle = driverHandle
                }),
                    Cmf.Connect.IoT.Driver.IpcCfx.DriverObjects.CommandExecutionMode.Publish,
                    Cmf.Connect.IoT.Driver.IpcCfx.DriverObjects.CommandExecutionDestination.Exchange);

                while (!cts.Token.IsCancellationRequested)
                {
                    if (this._terminateOnStart)
                    {
                        _scenario.Log.Debug($"Terminate Materials Previous Runs.");
                        TerminateLotMaterialsCreatedByMLSimulator();
                        TerminatePanelMaterialsCreatedByMLSimulator();
                        TerminateBoardMaterialsCreatedByMLSimulator();
                        _scenario.Log.Debug($"Terminate POs Previous Runs.");
                        TerminatePOsCreatedByMLSimulator();
                    }

                    _stateModel = new GetObjectByNameInput()
                    {
                        Name = "SEMI E10",
                        Type = typeof(Cmf.Foundation.BusinessObjects.StateModel),
                        IgnoreLastServiceId = true
                    }.GetObjectByNameSync().Instance as Cmf.Foundation.BusinessObjects.StateModel;

                    _scenario.Log.Debug($"Starting MES Run.");
                    await MESRun();
                    _scenario.Log.Info($"Finishing MES Run.");
                }
            }
            catch (Exception ex)
            {
                _scenario.Log.Error(ex.Message);
            }
            finally
            {
                _scenario.ShutdownSimulators();
                _scenario.Shutdown();
            }
        }

        private async System.Threading.Tasks.Task MESRun()
        {
            MaterialCollection panels = [];
            Material lot = new();

            try
            {
                _scenario.Log.Debug($"Starting SMT Order Preparation");
                SMTOrderPreparationExecution(out Product? product, out ProductionOrder? productionOrder, out Facility? facility, out lot);
                _scenario.Log.Info($"Finishing SMT Order Preparation");

                panels = SerializationExecution(product, productionOrder, facility, ref lot);

                lot = await SMTLineExecution(lot, panels);

                IEnumerable<System.Threading.Tasks.Task> tasks = panels.Select(panel => OffLineExecution(panel, this._speed));
                await System.Threading.Tasks.Task.WhenAll(tasks);

                _scenario.Log.Debug($"Finished Process");
            }
            catch (Exception ex)
            {
                _scenario.Log.Error($"Something went wrong {ex.Message}");
            }
            finally
            {
                var lossreason = new GetObjectByNameInput()
                {
                    Name = "Terminate",
                    Type = typeof(Cmf.Navigo.BusinessObjects.Reason)
                }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Reason;

                try
                {
                    for (int i = 0; i < panels.Count; i++)
                    {
                        Material? panel = panels[i];
                        if (panel.UniversalState != Cmf.Foundation.Common.Base.UniversalState.Terminated)
                        {
                            new Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.TerminateMaterialInput()
                            {
                                Material = GetMaterialByName(panel),
                                LossReason = lossreason
                            }.TerminateMaterialSync();
                        }
                    }
                    lot = GetMaterialByName(lot);

                    if (lot.UniversalState != Cmf.Foundation.Common.Base.UniversalState.Terminated)
                    {
                        new Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.TerminateMaterialInput()
                        {
                            Material = lot,
                            LossReason = lossreason
                        }.TerminateMaterialSync();
                    }

                    var productionOrder = new GetObjectByIdInput()
                    {
                        Id = panels.First().ProductionOrder.Id,
                        Type = typeof(Cmf.Navigo.BusinessObjects.ProductionOrder)
                    }.GetObjectByIdSync().Instance as ProductionOrder;

                    new TerminateObjectInput()
                    {
                        Object = productionOrder
                    }.TerminateObjectSync();
                }
                catch (Exception ex)
                {
                }
            }
        }
    }
}