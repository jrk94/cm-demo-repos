using Cmf.Foundation.BusinessOrchestration;
using Cmf.Foundation.BusinessOrchestration.GenericServiceManagement.InputObjects;
using Cmf.Navigo.BusinessObjects;
using Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects;
using IoTTestOrchestrator;
using IPCCFXSimulator.Objects;
using ScenarioBuilder.Implementations.Configuration;

namespace IPCCFXSimulator
{
    public class ScenarioRunner
    {
        private decimal _speed;
        private TestScenario _scenario;
        private Dictionary<string, IPCCFX.PluginMain> _cfxSimulators = [];
        private CancellationTokenSource cts;

        private Dictionary<string, Cmf.Navigo.BusinessObjects.Reason> _reasons = [];
        private Dictionary<string, Cmf.Navigo.BusinessObjects.Reason> _defectTracking = [];

        public ScenarioRunner(decimal speed = 1)
        {
            this._speed = speed;
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
            var driver = $"amqp://localhost:62990";
            var driverAddress = "/queue/CMF.Driver.IPCCFX";
            var targetHandle = "oven.test.machine";
            var target = $"amqp://localhost:5672";
            var managerName = "SystemAutomationManager";

            var scenario = new ScenarioConfiguration()
               .WriteLogsTo("c:/temp/CFX-Simulator.log")// Activate this line to send the logs to a particular place
               .ManagerId(managerName)
               //.ConfigPath("C:\\cmf\\cm-demo-repos\\Tools\\IPCCFXSimulator\\Artifacts\\DataPlatform.config.full.json
               .ConfigPath("C:\\cmf\\cm-demo-repos\\Tools\\IPCCFXSimulator\\Artifacts\\MESSummit.config.full.json")
               //.ConfigPath("C:\\temp\\IPC-CFXManager\\config.full.json")
               //.StartMode<LocalStartMode.PluginMain>(new LocalStartMode.Plugin.SettingsBuilder()
               // .ManagerLocation("C:\\temp\\IPC-CFXManager")
               // .Build())
               .AddSimulatorPlugin<IPCCFX.PluginMain>(new IPCCFX.Plugin.SettingsBuilder()
                .AddBroker()
                .AddTestCFXEndpoint(targetHandle, "", target, startInternalPublisher: false, startEquipmentSubscriber: false)

            //.AddConnectIoTCFXEndpoint(driverHandle, driverAddress, driver)
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

                InitializeReasons();

                while (!cts.Token.IsCancellationRequested)
                {
                    _scenario.Log.Debug($"Starting MES Run.");
                    await MESRun();
                    _scenario.Log.Info($"Finishing MES Run.");
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
                lot = DepanelExecution(lot, panels);
            }
            catch (Exception ex)
            {
                _scenario.Log.Error($"Something went wrong {ex.Message}");
            }
            finally
            {
                try
                {
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
                                LossReason = this._reasons["Terminate"]
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
                            LossReason = this._reasons["Terminate"]
                        }.TerminateMaterialSync();
                    }
                }
                catch (Exception ex)
                {
                }

            }
        }

        private async Task<Material?> SMTLineExecution(Material? lot, MaterialCollection panels)
        {
            #region SMT Line

            _scenario.Log.Debug($"Starting SMT Line");

            // TrackIn Lot in Line
            _scenario.Log.Debug($"Tracking in Lot {lot?.Name} in the SMT Line");
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
            _scenario.Log.Info($"Tracked In Lot {lot?.Name} in the SMT Line");

            _scenario.Log.Debug($"Starting Panel Processing");

            List<Func<Material, decimal, Task<Material>>> smtLineExecution =
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
                tasks.Add(ProcessPipeline(item, smtLineExecution, this._speed));
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

            // Random Product
            string[] availableProducts = ["SMT_Product_A", "SMT_Product_B", "SMT_Product_C", "SMT_Product_D"];
            Random random = new Random();
            int randomPos = random.Next(0, availableProducts.Length);

            _scenario.Log.Debug($"Creating Production Order for product '{availableProducts[randomPos]}'");

            // Create a PO
            var productionOrderName = "Demo-PO-" + Guid.NewGuid();
            product = new GetObjectByNameInput()
            {
                Name = availableProducts[randomPos],
                Type = typeof(Cmf.Navigo.BusinessObjects.Product)
            }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Product;
            productionOrder = new Cmf.Foundation.BusinessOrchestration.GenericServiceManagement.InputObjects.CreateObjectInput()
            {
                Object = new Cmf.Navigo.BusinessObjects.ProductionOrder()
                {
                    DueDate = DateTime.UtcNow.AddDays(1),
                    Name = productionOrderName,
                    Quantity = random.Next(1, 20),
                    Type = "SMT",
                    Units = "Units",
                    Product = product
                }
            }.CreateObjectSync().Object as Cmf.Navigo.BusinessObjects.ProductionOrder;
            _scenario.Log.Info($"Creating Production Order for product '{availableProducts[randomPos]}'");

            _scenario.Log.Debug($"Creating Lot for Production Order for product '{productionOrder?.Name}'");
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
                    PrimaryQuantity = random.Next(1, 10),
                    PrimaryUnits = "Units",
                    Type = "Production"
                }
            }.CreateObjectSync().Object as Cmf.Navigo.BusinessObjects.Material;
            _scenario.Log.Info($"Created Lot for Production Order for product '{productionOrder?.Name}'");

            // Move Next
            _scenario.Log.Debug($"Moving Lot for Next Step");
            lot = new Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.ComplexMoveMaterialsToNextStepInput()
            {
                Materials = new Dictionary<Material, string>()
                        {
                            {lot,  "LASER > SMD > Depanel > THT > ICT > FCT:A:1/PCB Serialization:2"}
                        }
            }.ComplexMoveMaterialsToNextStepSync().Materials.First();

            _scenario.Log.Info($"Moved Lot for Next Step");

            #endregion SMT Order Preparation
        }

        private void InitializeReasons()
        {
            List<string> reasons = ["Terminate", "Component Lift / Floating", "Dewetting", "Head-in-Pillow", "Misalignment", "Solder Balling", "Solder Bridging", "Tombstoning", "Voiding"];

            reasons.ForEach(reason =>
            {
                this._reasons.Add(reason, new GetObjectByNameInput()
                {
                    Name = reason,
                    Type = typeof(Reason)
                }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Reason);
            });
        }

        private async System.Threading.Tasks.Task ProcessPipeline(Material input, List<Func<Material, decimal, Task<Material>>> pipeline, decimal speed = 1)
        {
            Material current = input;
            foreach (var step in pipeline)
            {
                current = await step(current, speed);
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
                Type = typeof(Cmf.Navigo.BusinessObjects.Resource),
                IgnoreLastServiceId = false
            }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Resource;

            _scenario.Log.Debug($"Tracking In Depanel for Lot {lot.Name}");
            lot = new Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.ComplexDispatchAndTrackInMaterialsInput()
            {
                MaterialCollection = new Dictionary<Material, DispatchMaterialParameters>()
                    {
                        { lot, new DispatchMaterialParameters() { Resource = depanelResource } }
                    },
                IgnoreLastServiceId = false
            }.ComplexDispatchAndTrackInMaterialsSync().Materials.First();
            _scenario.Log.Info($"Tracked In Depanel for Lot {lot?.Name}");

            _scenario.Log.Debug($"Tracking Out Depanel for Lot {lot?.Name}");
            lot = new Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.ComplexTrackOutMaterialsInput()
            {
                Material = new Dictionary<Material, ComplexTrackOutParameters>()
                    {
                        { lot, new ComplexTrackOutParameters() }
                    },
                IgnoreLastServiceId = false
            }.ComplexTrackOutMaterialsSync().Materials.First().Key;
            _scenario.Log.Info($"Tracked Out Depanel for Lot {lot?.Name}");

            _scenario.Log.Debug($"Detaching Panels for Lot {lot?.Name}");
            new Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.DetachMaterialsInput()
            {
                Material = lot,
                SubMaterialsToDetach = panels,
                TerminateParentMaterial = true,
                IgnoreLastServiceId = false
            }.DetachMaterialsSync();
            _scenario.Log.Info($"Detached Panels for Lot {lot?.Name}");

            _scenario.Log.Debug($"Finished Depanel");

            #endregion Depanel

            return lot;
        }

        private async Task<Material> AOIExecution(Material panel, decimal speed = 1)
        {
            int executionTime = Decimal.ToInt32(new Random().Next(15, 45) * 1000 / speed);

            #region AOI
            _scenario.Log.Debug($"Tracking In AOI for Panel {panel?.Name}");
            panel = TrackInPanel(panel, "AOI01");
            _scenario.Log.Info($"Tracked In AOI for Panel {panel?.Name}");

            // await System.Threading.Tasks.Task.Delay(executionTime);

            if (this._defectTracking.TryGetValue(panel.Name, out Reason? value))
            {
                panel = new RecordMaterialDefectsInput
                {
                    Material = panel,
                    MaterialDefects =
                    [
                        new MaterialDefect()
                        {
                            DefectSource = MaterialDefectSource.None,
                            DefectType = MaterialDefectDefectType.Unit,
                            Reason = value },
                    ]
                }.RecordMaterialDefectsSync().Material;
                _scenario.Log.Warning($"Defect Panel {panel?.Name}");
            }

            _scenario.Log.Debug($"Tracking Out AOI for Panel {panel?.Name}");
            panel = TrackOutPanel(panel);
            _scenario.Log.Info($"Tracked Out AOI for Panel {panel?.Name}");

            #endregion AOI

            return panel;
        }

        private async Task<Material> ReflowOvenExecution(Material? panel, decimal speed = 1)
        {
            int executionTime = Decimal.ToInt32(new Random().Next(180, 300) * 1000 / speed);

            #region Reflow Oven

            var rand = new Random();
            var guess = rand.Next(1, 10);
            Events events;

            if (guess >= 5)
            {
                _scenario.Log.Warning("SolderBalling scenario reached");
                this._defectTracking.Add(panel.Name, this._reasons["Solder Balling"]);
                events = new Events(ScenarioReflowData.SolderBalling);
            }
            else
            {
                events = new Events(ScenarioReflowData.Random);
            }

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
                return getPanelByName(panel)?.SystemState == MaterialSystemState.InProcess;
            });

            var product = new GetObjectByIdInput()
            {
                Id = panel.Product.Id,
                Type = typeof(Cmf.Navigo.BusinessObjects.Product),
                IgnoreLastServiceId = false
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

            await System.Threading.Tasks.Task.Delay(10);

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
                return getPanelByName(panel)?.SystemState == MaterialSystemState.Queued;
            });

            #endregion Reflow Oven

            return panel;
        }

        private async Task<Material> PP3Execution(Material panel, decimal speed = 1)
        {
            int executionTime = Decimal.ToInt32(new Random().Next(15, 30) * 1000 / speed);

            #region P&P3
            _scenario.Log.Debug($"Tracking In PP3 for Panel {panel?.Name}");
            panel = TrackInPanel(panel, "PickPlace03");
            _scenario.Log.Info($"Tracked In PP3 for Panel {panel?.Name}");

            // await System.Threading.Tasks.Task.Delay(executionTime);

            _scenario.Log.Debug($"Tracking Out PP3 for Panel {panel?.Name}");
            panel = TrackOutPanel(panel);
            _scenario.Log.Info($"Tracked Out PP3 for Panel {panel?.Name}");

            #endregion P&P3

            return panel;
        }

        private async Task<Material> PP2Execution(Material panel, decimal speed = 1)
        {
            int executionTime = Decimal.ToInt32(new Random().Next(15, 30) * 1000 / speed);

            #region P&P2
            _scenario.Log.Debug($"Tracking In PP2 for Panel {panel?.Name}");
            panel = TrackInPanel(panel, "PickPlace02");
            _scenario.Log.Info($"Tracked In PP2 for Panel {panel?.Name}");

            // await System.Threading.Tasks.Task.Delay(executionTime);

            _scenario.Log.Debug($"Tracking Out PP2 for Panel {panel?.Name}");
            panel = TrackOutPanel(panel);
            _scenario.Log.Info($"Tracked Out PP2 for Panel {panel?.Name}");

            #endregion P&P2

            return panel;
        }

        private async Task<Material> PP1Execution(Material panel, decimal speed = 1)
        {
            int executionTime = Decimal.ToInt32(new Random().Next(15, 30) * 1000 / speed);

            #region P&P1
            _scenario.Log.Debug($"Tracking In PP1 for Panel {panel?.Name}");
            panel = TrackInPanel(panel, "PickPlace01");
            _scenario.Log.Info($"Tracked In PP1 for Panel {panel?.Name}");

            // await System.Threading.Tasks.Task.Delay(executionTime);

            _scenario.Log.Debug($"Tracking Out PP1 for Panel {panel?.Name}");
            panel = TrackOutPanel(panel);
            _scenario.Log.Info($"Tracked Out PP1 for Panel {panel?.Name}");

            #endregion P&P1

            return panel;
        }

        private async Task<Material> SPIExecution(Material panel, decimal speed = 1)
        {
            int executionTime = Decimal.ToInt32(new Random().Next(5, 10) * 1000 / speed);

            #region SPI
            _scenario.Log.Debug($"Tracking In SPI for Panel {panel?.Name}");
            panel = TrackInPanel(panel, "SPI01");
            _scenario.Log.Info($"Tracked In SPI for Panel {panel?.Name}");

            // await System.Threading.Tasks.Task.Delay(executionTime);

            _scenario.Log.Debug($"Tracking Out SPI for Panel {panel?.Name}");
            panel = TrackOutPanel(panel);
            _scenario.Log.Info($"Tracked Out SPI for Panel {panel?.Name}");

            #endregion SPI

            return panel;
        }

        private async Task<Material> PrinterExecution(Material? panel, decimal speed = 1)
        {
            int executionTime = Decimal.ToInt32(new Random().Next(15, 30) * 1000 / speed);

            #region Printer
            _scenario.Log.Debug($"Tracking In Printer for Panel {panel?.Name}");
            panel = TrackInPanel(panel, "PRT01");
            _scenario.Log.Info($"Tracked In Printer for Panel {panel?.Name}");

            // await System.Threading.Tasks.Task.Delay(executionTime);

            _scenario.Log.Debug($"Tracking Out Printer for Panel {panel?.Name}");
            panel = TrackOutPanel(panel);
            _scenario.Log.Info($"Tracked Out Printer for Panel {panel?.Name}");

            #endregion Printer

            return panel;
        }

        private static Material TrackInPanel(Material? panel, string resourceName)
        {
            return (Retrier(() => new Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.ComplexTrackInMaterialsInput()
            {
                Materials = new MaterialCollection()
                        {
                            getPanelByName(panel)
                        },
                Resource = getResourceByName(resourceName),
                IgnoreLastServiceId = false
            }.ComplexTrackInMaterialsSync() as BaseOutput)
                            as Cmf.Navigo.BusinessOrchestration.MaterialManagement.OutputObjects.ComplexTrackInMaterialsOutput).Materials.First();
        }

        private static Material TrackOutPanel(Material? panel)
        {
            panel = (Retrier(() => new Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.ComplexTrackOutMaterialsInput()
            {
                Material = new Dictionary<Material, ComplexTrackOutParameters>()
                        {
                            { getPanelByName(panel), new ComplexTrackOutParameters() }
                        },
                IgnoreLastServiceId = false
            }.ComplexTrackOutMaterialsSync() as BaseOutput)
                as Cmf.Navigo.BusinessOrchestration.MaterialManagement.OutputObjects.ComplexTrackOutMaterialsOutput).Materials.First().Key;
            return panel;
        }

        private static BaseOutput Retrier(Func<BaseOutput> serviceToCall)
        {
            var retryCount = 0;
            try
            {
                return serviceToCall();
            }
            catch (Exception ex)
            {
                if (retryCount > 4)
                {
                    throw ex;
                }
                if (ex.Message.Contains("has changed since last viewed"))
                {
                    retryCount += 1;
                    return Retrier(serviceToCall);
                }
                else
                {
                    throw ex;
                }
            }
        }

        private static Cmf.Navigo.BusinessObjects.Resource? getResourceByName(string resourceName)
        {
            return new GetObjectByNameInput()
            {
                Name = resourceName,
                Type = typeof(Cmf.Navigo.BusinessObjects.Resource),
                IgnoreLastServiceId = false
            }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Resource;
        }

        private static Material? getPanelByName(Material? panel)
        {
            panel = new GetObjectByNameInput()
            {
                Name = panel.Name,
                Type = typeof(Cmf.Navigo.BusinessObjects.Material),
                IgnoreLastServiceId = false
            }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Material;
            return panel;
        }

        private MaterialCollection SerializationExecution(Product? product, ProductionOrder? productionOrder, Facility? facility, ref Material? lot)
        {
            #region Serialization

            _scenario.Log.Debug($"Starting Serialization");

            // Dispatch and TrackIn
            _scenario.Log.Debug($"Tracking In Lot at Resource LMK01 '{lot?.Name}'");
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
                    },
                IgnoreLastServiceId = false
            }.ComplexDispatchAndTrackInMaterialsSync().Materials.First();
            _scenario.Log.Debug($"Tracked In Lot at Resource LMK01 '{lot?.Name}'");

            // Create Panels
            var panels = new MaterialCollection();
            for (int i = 0; i < lot.PrimaryQuantity; i++)
            {
                var panelName = "Panel-" + Guid.NewGuid().ToString().Substring(0, 8);
                _scenario.Log.Info($"Creating Panel Id '{panelName}'");
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

            _scenario.Log.Debug($"Creating Panels for '{lot?.Name}'");
            var expandMaterialOutput = new Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.ExpandMaterialInput()
            {
                Form = "Panel",
                Material = lot,
                SubMaterials = panels
            }.ExpandMaterialSync();

            lot = expandMaterialOutput.Material;
            panels = expandMaterialOutput.ExpandedSubMaterials;
            _scenario.Log.Info($"Created Panels for '{lot?.Name}'");

            // TrackOut and Move Next
            _scenario.Log.Debug($"Tracking out Lot '{lot?.Name}'");
            lot = new Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.ComplexTrackOutAndMoveMaterialsToNextStepInput()
            {
                Materials = new Dictionary<Material, ComplexTrackOutAndMoveNextParameters>()
                    {
                        { lot,  new ComplexTrackOutAndMoveNextParameters() { FlowPath = "LASER > SMD > Depanel > THT > ICT > FCT:A:1/SMD_TOP:3" }}
                    }
            }.ComplexTrackOutAndMoveMaterialsToNextStepSync().Materials.First().Key;
            _scenario.Log.Info($"Tracked out Lot '{lot?.Name}'");

            _scenario.Log.Debug($"Finished Serialization");

            #endregion Serialization

            return panels;
        }
    }
}