using Cmf.Foundation.BusinessOrchestration.GenericServiceManagement.InputObjects;
using Cmf.Navigo.BusinessObjects;
using Common.Interfaces.Test;
using IoTTestOrchestrator;
using IPCCFXSimulator.Objects;
using ScenarioBuilder.Implementations.Configuration;

namespace IPCCFXSimulator
{
    public class ScenarioRunner
    {
        private TestScenario _scenario;
        private IInstanceContext _manager;
        private Dictionary<string, IPCCFX.PluginMain> _cfxSimulators = [];

        public async System.Threading.Tasks.Task RunAsync()
        {
            var driverHandle = "CMF.Driver.IPCCFX";
            var driver = $"amqp://localhost:5001";
            var driverAddress = "/queue/CMF.Driver.IPCCFX";
            var targetHandle = "oven.test.machine";
            var target = $"amqp://localhost:5672";
            var managerName = "IPC-CFX Manager";

            var scenario = new ScenarioConfiguration()
               .WriteLogsTo("c:/temp/CFX-Simulator.log")// Activate this line to send the logs to a particular place
               .ManagerId("IPC-CFXManager")
               .ConfigPath("C:\\Users\\jroque\\Downloads\\IPC-CFXManager\\config.full.json")
               .StartMode<LocalStartMode.PluginMain>(new LocalStartMode.Plugin.SettingsBuilder()
                .ManagerLocation("C:\\Users\\jroque\\Downloads\\IPC-CFXManager")
                .Build())
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
                _manager = (context.Instances["Manager"] as IInstanceContext);

                _cfxSimulators["Oven"].SendMessage(new CFX.CFXEnvelope(new CFX.EndpointConnected
                {
                    CFXHandle = driverHandle
                }),
                    Cmf.Connect.IoT.Driver.IpcCfx.DriverObjects.CommandExecutionMode.Publish,
                    Cmf.Connect.IoT.Driver.IpcCfx.DriverObjects.CommandExecutionDestination.Exchange);

                MaterialCollection panels = [];
                Material lot = new();

                try
                {
                    SMTOrderPreparationExecution(out Product? product, out ProductionOrder? productionOrder, out Facility? facility, out lot);

                    panels = SerializationExecution(product, productionOrder, facility, ref lot);

                    lot = await SMTLineExecution(lot, panels);
                    lot = DepanelExecution(lot, panels);
                }
                catch (Exception ex)
                {
                }
                finally
                {
                    var lossreason = new GetObjectByNameInput()
                    {
                        Name = "Broken",
                        Type = typeof(Cmf.Navigo.BusinessObjects.Reason)
                    }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Reason;

                    for (int i = 0; i < panels.Count; i++)
                    {
                        Material? panel = panels[i];
                        panel = new GetObjectByNameInput()
                        {
                            Name = panel.Name,
                            Type = typeof(Cmf.Navigo.BusinessObjects.Material)
                        }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Material;

                        if (panel.UniversalState != Cmf.Foundation.Common.Base.UniversalState.Terminated)
                        {
                            new Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.TerminateMaterialInput()
                            {
                                Material = panel,
                                LossReason = lossreason
                            }.TerminateMaterialSync();
                        }
                    }
                    lot = new GetObjectByNameInput()
                    {
                        Name = lot.Name,
                        Type = typeof(Cmf.Navigo.BusinessObjects.Material)
                    }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Material;

                    if (lot.UniversalState != Cmf.Foundation.Common.Base.UniversalState.Terminated)
                    {
                        new Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.TerminateMaterialInput()
                        {
                            Material = lot,
                            LossReason = lossreason

                        }.TerminateMaterialSync();
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

        private async Task<Material?> SMTLineExecution(Material? lot, MaterialCollection panels)
        {
            #region SMT Line

            _scenario.Log.Debug($"Starting SMT Line");

            // TrackIn Lot in Line

            var resourceSMTLine = new GetObjectByNameInput()
            {
                Name = "SMT Line 1",
                Type = typeof(Cmf.Navigo.BusinessObjects.Resource)
            }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Resource;

            lot = new Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.ComplexDispatchAndTrackInMaterialsInput()
            {
                MaterialCollection = new Dictionary<Material, DispatchMaterialParameters>()
                    {
                        {
                            lot, new DispatchMaterialParameters()
                            {
                                Resource = resourceSMTLine
                            }
                        }
                    }
            }.ComplexDispatchAndTrackInMaterialsSync().Materials.First();

            _scenario.Log.Debug($"Starting Panel Processing");

            List<Func<Material, Task<Material>>> smtLineExecution =
            [
                PrinterExecution,
                    SPIExecution,
                    PP1Execution,
                    PP2Execution,
                    PP3Execution,
                    ReflowOvenExecution,
                    AOIExecution
            ];

            var tasks = new List<System.Threading.Tasks.Task>();

            foreach (var item in panels)
            {
                tasks.Add(ProcessPipeline(item, smtLineExecution));
            }

            await System.Threading.Tasks.Task.WhenAll(tasks);

            _scenario.Log.Debug($"Finished Panel Processing");

            lot = new GetObjectByNameInput()
            {
                Name = lot.Name,
                Type = typeof(Cmf.Navigo.BusinessObjects.Material)
            }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Material;

            lot = new Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.ComplexTrackOutAndMoveMaterialsToNextStepInput()
            {
                Materials = new Dictionary<Material, ComplexTrackOutAndMoveNextParameters>()
                    {
                        { lot, new ComplexTrackOutAndMoveNextParameters(){ FlowPath = "LASER > SMD > Depanel > THT > ICT > FCT:A:1/Depanel:4"} }
                    }
            }.ComplexTrackOutAndMoveMaterialsToNextStepSync().Materials.First().Key;

            _scenario.Log.Debug($"Finished SMT Line");

            #endregion SMT Line
            return lot;
        }

        private void SMTOrderPreparationExecution(out Product? product, out ProductionOrder? productionOrder, out Facility? facility, out Material? lot)
        {
            #region SMT Order Preparation
            _scenario.Log.Debug($"Starting Order Preparation");

            // Create a PO
            var productionOrderName = "Demo-PO-" + Guid.NewGuid();
            product = new GetObjectByNameInput()
            {
                Name = "SMT_Product_A",
                Type = typeof(Cmf.Navigo.BusinessObjects.Product)
            }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Product;
            productionOrder = new Cmf.Foundation.BusinessOrchestration.GenericServiceManagement.InputObjects.CreateObjectInput()
            {
                Object = new Cmf.Navigo.BusinessObjects.ProductionOrder()
                {
                    DueDate = DateTime.UtcNow.AddDays(1),
                    Name = productionOrderName,
                    Quantity = 10,
                    Type = "General",
                    Units = "Units",
                    Product = product
                }
            }.CreateObjectSync().Object as Cmf.Navigo.BusinessObjects.ProductionOrder;

            // Create Lot
            var lotName = "Lot-" + Guid.NewGuid();
            facility = new GetObjectByNameInput()
            {
                Name = "Production",
                Type = typeof(Cmf.Navigo.BusinessObjects.Facility)
            }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Facility;
            lot = new Cmf.Foundation.BusinessOrchestration.GenericServiceManagement.InputObjects.CreateObjectInput()
            {
                Object = new Cmf.Navigo.BusinessObjects.Material()
                {
                    Facility = facility,
                    Name = lotName,
                    ProductionOrder = productionOrder,
                    Product = product,
                    Form = "SMTLot",
                    FlowPath = "LASER > SMD > Depanel > THT > ICT > FCT:A:1/SMT Order Preparation:1",
                    PrimaryQuantity = 10,
                    PrimaryUnits = "Units",
                    Type = "Production"
                }
            }.CreateObjectSync().Object as Cmf.Navigo.BusinessObjects.Material;


            // Move Next
            lot = new Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.ComplexMoveMaterialsToNextStepInput()
            {

                Materials = new Dictionary<Material, string>()
                        {
                            {lot,  "LASER > SMD > Depanel > THT > ICT > FCT:A:1/PCB Serialization:2"}
                        }
            }.ComplexMoveMaterialsToNextStepSync().Materials.First();

            _scenario.Log.Debug($"Finished Order Preparation");

            #endregion SMT Order Preparation
        }

        private async System.Threading.Tasks.Task ProcessPipeline(Material input, List<Func<Material, Task<Material>>> pipeline)
        {
            Material current = input;
            foreach (var step in pipeline)
            {
                current = await step(current);
            }
            _scenario.Log.Debug($"Item {input.Name} finished processing.");
        }

        private Material DepanelExecution(Material? lot, MaterialCollection panels)
        {
            #region Depanel

            _scenario.Log.Debug($"Starting Depanel");

            var depanelResource = new GetObjectByNameInput()
            {
                Name = "DPL01",
                Type = typeof(Cmf.Navigo.BusinessObjects.Resource)
            }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Resource;

            lot = new Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.ComplexDispatchAndTrackInMaterialsInput()
            {
                MaterialCollection = new Dictionary<Material, DispatchMaterialParameters>()
                    {
                        { lot, new DispatchMaterialParameters() { Resource = depanelResource } }
                    }
            }.ComplexDispatchAndTrackInMaterialsSync().Materials.First();

            lot = new Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.ComplexTrackOutMaterialsInput()
            {
                Material = new Dictionary<Material, ComplexTrackOutParameters>()
                    {
                        { lot, new ComplexTrackOutParameters() }
                    }
            }.ComplexTrackOutMaterialsSync().Materials.First().Key;

            new Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.DetachMaterialsInput()
            {
                Material = lot,
                SubMaterialsToDetach = panels,
                TerminateParentMaterial = true,
                IgnoreLastServiceId = true
            }.DetachMaterialsSync();

            _scenario.Log.Debug($"Finished Depanel");

            #endregion
            return lot;
        }

        private async Task<Material> AOIExecution(Material panel)
        {
            #region AOI

            var aoiResource = new GetObjectByNameInput()
            {
                Name = "AOI01",
                Type = typeof(Cmf.Navigo.BusinessObjects.Resource)
            }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Resource;

            panel = new Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.ComplexTrackInMaterialsInput()
            {
                Materials =
                [
                    panel
                ],
                Resource = aoiResource
            }.ComplexTrackInMaterialsSync().Materials.First();

            panel = new Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.ComplexTrackOutMaterialsInput()
            {
                Material = new Dictionary<Material, ComplexTrackOutParameters>()
                        {
                            { panel, new ComplexTrackOutParameters() }
                        }
            }.ComplexTrackOutMaterialsSync().Materials.First().Key;

            #endregion
            return panel;
        }

        private async Task<Material> ReflowOvenExecution(Material? panel)
        {
            #region Reflow Oven

            var reflowOvenResource = new GetObjectByNameInput()
            {
                Name = "OVN01",
                Type = typeof(Cmf.Navigo.BusinessObjects.Resource)
            }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Resource;

            var events = new Events();
            var transactionId = Guid.NewGuid();
            var workStarted = new CFX.Production.WorkStarted
            {
                TransactionID = transactionId,
                PrimaryIdentifier = panel.Name,
                Lane = 1
            };

            _scenario.Log.Debug($"Work Started '{panel.Name}'");

            this._cfxSimulators["Oven"].SendMessage(new CFX.CFXEnvelope(workStarted),
                Cmf.Connect.IoT.Driver.IpcCfx.DriverObjects.CommandExecutionMode.Publish,
                Cmf.Connect.IoT.Driver.IpcCfx.DriverObjects.CommandExecutionDestination.Exchange);

            _scenario.Utilities.WaitFor(60, $"Oven material for '{panel.Name}' never trackedin", () =>
            {
                panel = new GetObjectByNameInput()
                {
                    Name = panel.Name,
                    Type = typeof(Cmf.Navigo.BusinessObjects.Material)
                }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Material;

                return panel?.SystemState == MaterialSystemState.InProcess;
            });

            var product = new GetObjectByIdInput()
            {
                Id = panel.Product.Id,
                Type = typeof(Cmf.Navigo.BusinessObjects.Product)
            }.GetObjectByIdSync().Instance as Cmf.Navigo.BusinessObjects.Product;

            var unitsProcessed = new CFX.Production.Processing.UnitsProcessed
            {
                TransactionId = transactionId,
                OverallResult = CFX.Structures.ProcessingResult.Succeeded,
                CommonProcessData = events.Products.FirstOrDefault(prod => prod.Key == product.Name).Value
            };

            _scenario.Log.Debug($"Units Processed '{panel.Name}'");

            this._cfxSimulators["Oven"].SendMessage(new CFX.CFXEnvelope(unitsProcessed),
                Cmf.Connect.IoT.Driver.IpcCfx.DriverObjects.CommandExecutionMode.Publish,
                Cmf.Connect.IoT.Driver.IpcCfx.DriverObjects.CommandExecutionDestination.Exchange);

            await System.Threading.Tasks.Task.Delay(5000);
            var workCompleted = new CFX.Production.WorkCompleted
            {
                TransactionID = transactionId,
                PrimaryIdentifier = panel.Name
            };

            _scenario.Log.Debug($"Work Completed '{panel.Name}'");

            this._cfxSimulators["Oven"].SendMessage(new CFX.CFXEnvelope(workCompleted),
                Cmf.Connect.IoT.Driver.IpcCfx.DriverObjects.CommandExecutionMode.Publish,
                Cmf.Connect.IoT.Driver.IpcCfx.DriverObjects.CommandExecutionDestination.Exchange);

            _scenario.Utilities.WaitFor(60, $"Oven material for '{panel.Name}' never trackedout", () =>
            {
                panel = new GetObjectByNameInput()
                {
                    Name = panel.Name,
                    Type = typeof(Cmf.Navigo.BusinessObjects.Material)
                }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Material;

                return panel?.SystemState == MaterialSystemState.Queued;
            });

            #endregion

            return panel;
        }

        private async Task<Material> PP3Execution(Material panel)
        {
            #region P&P3

            var pp3Resource = new GetObjectByNameInput()
            {
                Name = "PickPlace03",
                Type = typeof(Cmf.Navigo.BusinessObjects.Resource)
            }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Resource;

            panel = new Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.ComplexTrackInMaterialsInput()
            {
                Materials =
                [
                    panel
                ],
                Resource = pp3Resource
            }.ComplexTrackInMaterialsSync().Materials.First();

            panel = new Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.ComplexTrackOutMaterialsInput()
            {
                Material = new Dictionary<Material, ComplexTrackOutParameters>()
                        {
                            { panel, new ComplexTrackOutParameters() }
                        }
            }.ComplexTrackOutMaterialsSync().Materials.First().Key;

            #endregion
            return panel;
        }

        private async Task<Material> PP2Execution(Material panel)
        {
            #region P&P2

            var pp2Resource = new GetObjectByNameInput()
            {
                Name = "PickPlace02",
                Type = typeof(Cmf.Navigo.BusinessObjects.Resource)
            }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Resource;

            panel = new Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.ComplexTrackInMaterialsInput()
            {
                Materials =
                [
                    panel
                ],
                Resource = pp2Resource
            }.ComplexTrackInMaterialsSync().Materials.First();

            panel = new Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.ComplexTrackOutMaterialsInput()
            {
                Material = new Dictionary<Material, ComplexTrackOutParameters>()
                        {
                            { panel, new ComplexTrackOutParameters() }
                        }
            }.ComplexTrackOutMaterialsSync().Materials.First().Key;

            #endregion
            return panel;
        }

        private async Task<Material> PP1Execution(Material panel)
        {
            #region P&P1

            var pp1Resource = new GetObjectByNameInput()
            {
                Name = "PickPlace01",
                Type = typeof(Cmf.Navigo.BusinessObjects.Resource)
            }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Resource;

            panel = new Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.ComplexTrackInMaterialsInput()
            {
                Materials =
                [
                    panel
                ],
                Resource = pp1Resource
            }.ComplexTrackInMaterialsSync().Materials.First();

            panel = new Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.ComplexTrackOutMaterialsInput()
            {
                Material = new Dictionary<Material, ComplexTrackOutParameters>()
                        {
                            { panel, new ComplexTrackOutParameters() }
                        }
            }.ComplexTrackOutMaterialsSync().Materials.First().Key;

            #endregion
            return panel;
        }

        private async Task<Material> SPIExecution(Material panel)
        {
            #region SPI

            var spiResource = new GetObjectByNameInput()
            {
                Name = "SPI01",
                Type = typeof(Cmf.Navigo.BusinessObjects.Resource)
            }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Resource;

            panel = new Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.ComplexTrackInMaterialsInput()
            {
                Materials = new MaterialCollection()
                        {
                            panel
                        },
                Resource = spiResource
            }.ComplexTrackInMaterialsSync().Materials.First();

            panel = new Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.ComplexTrackOutMaterialsInput()
            {
                Material = new Dictionary<Material, ComplexTrackOutParameters>()
                        {
                            { panel, new ComplexTrackOutParameters() }
                        }
            }.ComplexTrackOutMaterialsSync().Materials.First().Key;

            #endregion SPI
            return panel;
        }

        private async Task<Material> PrinterExecution(Material? panel)
        {
            #region Printer

            var printerResource = new GetObjectByNameInput()
            {
                Name = "PRT01",
                Type = typeof(Cmf.Navigo.BusinessObjects.Resource)
            }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Resource;

            panel = new GetObjectByNameInput()
            {
                Name = panel.Name,
                Type = typeof(Cmf.Navigo.BusinessObjects.Material)
            }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Material;

            panel = new Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.ComplexTrackInMaterialsInput()
            {
                Materials = new MaterialCollection()
                        {
                            panel
                        },
                Resource = printerResource
            }.ComplexTrackInMaterialsSync().Materials.First();

            panel = new Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.ComplexTrackOutMaterialsInput()
            {
                Material = new Dictionary<Material, ComplexTrackOutParameters>()
                        {
                            { panel, new ComplexTrackOutParameters() }
                        }
            }.ComplexTrackOutMaterialsSync().Materials.First().Key;

            #endregion Printer

            return panel;
        }

        private MaterialCollection SerializationExecution(Product? product, ProductionOrder? productionOrder, Facility? facility, ref Material? lot)
        {
            #region Serialization
            _scenario.Log.Debug($"Starting Serialization");

            // Dispatch and TrackIn

            var resourceLaserMark = new GetObjectByNameInput()
            {
                Name = "LMK01",
                Type = typeof(Cmf.Navigo.BusinessObjects.Resource)
            }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Resource;

            lot = new Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.ComplexDispatchAndTrackInMaterialsInput()
            {
                MaterialCollection = new Dictionary<Material, DispatchMaterialParameters>()
                    {
                        {
                            lot, new DispatchMaterialParameters()
                            {
                                Resource = resourceLaserMark
                            }
                        }
                    }
            }.ComplexDispatchAndTrackInMaterialsSync().Materials.First();

            // Create Panels
            var panels = new MaterialCollection();
            for (int i = 0; i < lot.PrimaryQuantity; i++)
            {
                var panelName = "Panel-" + Guid.NewGuid();
                panels.Add(new Cmf.Navigo.BusinessObjects.Material()
                {
                    Facility = facility,
                    Name = panelName,
                    ProductionOrder = productionOrder,
                    Product = product,
                    Form = "Panel",
                    FlowPath = "LASER > SMD > Depanel > THT > ICT > FCT:A:1/PCB Serialization:2",
                    PrimaryQuantity = 1,
                    PrimaryUnits = "Units",
                    Type = "Production"
                });
            }

            var expandMaterialOutput = new Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.ExpandMaterialInput()
            {
                Form = "Panel",
                Material = lot,
                SubMaterials = panels
            }.ExpandMaterialSync();

            lot = expandMaterialOutput.Material;
            panels = expandMaterialOutput.ExpandedSubMaterials;

            // TrackOut and Move Next

            lot = new Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.ComplexTrackOutAndMoveMaterialsToNextStepInput()
            {
                Materials = new Dictionary<Material, ComplexTrackOutAndMoveNextParameters>()
                    {
                        { lot,  new ComplexTrackOutAndMoveNextParameters() { FlowPath = "LASER > SMD > Depanel > THT > ICT > FCT:A:1/SMD_TOP:3" }}
                    }
            }.ComplexTrackOutAndMoveMaterialsToNextStepSync().Materials.First().Key;

            _scenario.Log.Debug($"Finished Serialization");
            #endregion Serialization

            return panels;
        }

    }
}
