using CFX.Structures.SolderReflow;
using Cmf.Foundation.BusinessOrchestration.GenericServiceManagement.InputObjects;
using Cmf.Navigo.BusinessObjects;
using Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects;
using IPCCFXSimulator.Objects;

namespace IPCCFXSimulator
{
    public partial class ScenarioRunner
    {
        private async Task<Material?> SMTLineExecution(Material? lot, MaterialCollection panels)
        {
            _scenario.Log.Debug($"Starting SMT Line");

            lot = new ComplexDispatchAndTrackInMaterialsInput()
            {
                MaterialCollection = new Dictionary<Material, DispatchMaterialParameters>()
                {
                    {
                        GetMaterialByName(lot), new DispatchMaterialParameters()
                        {
                            Resource = GetResourceByName(this.resourceSMTLine)
                        }
                    }
                },
                IgnoreLastServiceId = true
            }.ComplexDispatchAndTrackInMaterialsSync().Materials.First();

            _scenario.Log.Info($"Tracked In Lot {lot?.Name} in the SMT Line");

            List<Func<Material, Material, decimal, Task<Material>>> smtLineExecution =
            [
                PrinterExecution,
                SPIExecution,
                PP1Execution,
                PP2Execution,
                ReflowOvenExecution,
                AOIExecution
            ];

            var tasks = new List<System.Threading.Tasks.Task>();
            foreach (var panel in panels)
            {
                tasks.Add(ProcessPipeline(lot, panel, smtLineExecution, this._speed));
            }

            await System.Threading.Tasks.Task.WhenAll(tasks);
            _scenario.Log.Debug($"Finished Line Processing");

            return lot;
        }

        private async System.Threading.Tasks.Task ProcessPipeline(Material lot, Material panel, List<Func<Material, Material, decimal, Task<Material>>> pipeline, decimal speed = 1)
        {
            Material current = panel;
            foreach (var step in pipeline)
            {
                current = await step(lot, current, speed);
            }
            _scenario.Log.Debug($"Item {panel.Name} finished processing.");
        }

        private async Task<Material> PrinterExecution(Material lot, Material? panel, decimal speed = 1)
        {
            int executionTime = Decimal.ToInt32(new Random().Next(15, 40) * 1000 / speed);

            await System.Threading.Tasks.Task.Delay(executionTime / 4);

            _scenario.Log.Debug($"Tracking In Printer for Panel {panel?.Name}");
            panel = TrackInMaterial(panel, this.printerResource);
            _scenario.Log.Info($"Tracked In Printer for Panel {panel?.Name}");

            await System.Threading.Tasks.Task.Delay(executionTime);

            _scenario.Log.Debug($"Tracking Out Printer for Panel {panel?.Name}");
            panel = TrackOutMaterial(panel);
            _scenario.Log.Info($"Tracked Out Printer for Panel {panel?.Name}");

            return panel;
        }

        private async Task<Material> SPIExecution(Material lot, Material panel, decimal speed = 1)
        {
            int executionTime = Decimal.ToInt32(new Random().Next(5, 20) * 1000 / speed);

            await System.Threading.Tasks.Task.Delay(executionTime / 4);

            _scenario.Log.Debug($"Tracking In SPI for Panel {panel?.Name}");
            panel = TrackInMaterial(panel, this.spiResource);
            _scenario.Log.Info($"Tracked In SPI for Panel {panel?.Name}");

            await System.Threading.Tasks.Task.Delay(executionTime);

            _scenario.Log.Debug($"Tracking Out SPI for Panel {panel?.Name}");
            panel = TrackOutMaterial(panel);
            _scenario.Log.Info($"Tracked Out SPI for Panel {panel?.Name}");

            return panel;
        }

        private async Task<Material> PP1Execution(Material lot, Material panel, decimal speed = 1)
        {
            int executionTime = Decimal.ToInt32(new Random().Next(15, 40) * 1000 / speed);

            await System.Threading.Tasks.Task.Delay(executionTime / 4);

            _scenario.Log.Debug($"Tracking In PP1 for Panel {panel?.Name}");
            panel = TrackInMaterial(panel, this.ppResources[0]);
            _scenario.Log.Info($"Tracked In PP1 for Panel {panel?.Name}");

            await System.Threading.Tasks.Task.Delay(executionTime);

            _scenario.Log.Debug($"Tracking Out PP1 for Panel {panel?.Name}");
            panel = TrackOutMaterial(panel);
            _scenario.Log.Info($"Tracked Out PP1 for Panel {panel?.Name}");

            return panel;
        }

        private async Task<Material> PP2Execution(Material lot, Material panel, decimal speed = 1)
        {
            int executionTime = Decimal.ToInt32(new Random().Next(15, 40) * 1000 / speed);

            await System.Threading.Tasks.Task.Delay(executionTime / 4);

            _scenario.Log.Debug($"Tracking In PP2 for Panel {panel?.Name}");
            panel = TrackInMaterial(panel, this.ppResources[1]);
            _scenario.Log.Info($"Tracked In PP2 for Panel {panel?.Name}");

            await System.Threading.Tasks.Task.Delay(executionTime);

            _scenario.Log.Debug($"Tracking Out PP2 for Panel {panel?.Name}");
            panel = TrackOutMaterial(panel);
            _scenario.Log.Info($"Tracked Out PP2 for Panel {panel?.Name}");

            return panel;
        }

        private async Task<Material> ReflowOvenExecution(Material lot, Material? panel, decimal speed = 1)
        {
            var rand = new Random();
            int executionTime = Decimal.ToInt32(rand.Next(180, 300) * 1000 / speed);

            var events = new Events(new Dictionary<string, ReflowProcessData>
            {
                {
                   availableProducts[0],
                    new ReflowProcessData()
                    {
                        ConveyorSpeed = 100,
                        ConveyorSpeedSetpoint = 100,
                        ZoneData = Events.AdjustReadingsRandomly(Events.ZoneData_A)
                    }
                },
                {
                    availableProducts[1],
                    new ReflowProcessData()
                    {
                        ConveyorSpeed = 100,
                        ConveyorSpeedSetpoint = 100,
                        ZoneData = Events.AdjustReadingsRandomly(Events.ZoneData_B)
                    }
                },
                {
                    availableProducts[2],
                    new ReflowProcessData()
                    {
                        ConveyorSpeed = 100,
                        ConveyorSpeedSetpoint = 100,
                        ZoneData = Events.AdjustReadingsRandomly(Events.ZoneData_C)
                    }
                },
                {
                    availableProducts[3],
                    new ReflowProcessData()
                    {
                        ConveyorSpeed = 100,
                        ConveyorSpeedSetpoint = 100,
                        ZoneData = Events.AdjustReadingsRandomly(Events.ZoneData_D)
                    }
                }
            });

            var product = new GetObjectByIdInput()
            {
                Id = panel.Product.Id,
                Type = typeof(Cmf.Navigo.BusinessObjects.Product),
                IgnoreLastServiceId = true
            }.GetObjectByIdSync().Instance as Cmf.Navigo.BusinessObjects.Product;

            var processData = events.Products.FirstOrDefault(prod => prod.Key == product.Name).Value;
            if (rand.NextDouble() < (double)this._defectProbability)
            {
                var defect = Events.Defects.ElementAt(rand.Next(Events.Defects.Count));
                processData = new ReflowProcessData()
                {
                    ConveyorSpeed = 100,
                    ConveyorSpeedSetpoint = 100,
                    ZoneData = Events.AdjustReadingsRandomly(defect.Value, 0.3)
                };

                foreach (var board in panel.SubMaterials)
                {
                    this.defectBoards.TryAdd(board.Name, defect.Key);
                }
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
                return GetMaterialByName(panel)?.SystemState == MaterialSystemState.InProcess;
            });

            var unitsProcessed = new CFX.Production.Processing.UnitsProcessed
            {
                TransactionId = transactionId,
                OverallResult = CFX.Structures.ProcessingResult.Succeeded,
                CommonProcessData = processData
            };

            _scenario.Log.Debug($"Units Processed '{panel.Name}'");

            this._cfxSimulators["Oven"].SendMessage(new CFX.CFXEnvelope(unitsProcessed),
                Cmf.Connect.IoT.Driver.IpcCfx.DriverObjects.CommandExecutionMode.Publish,
                Cmf.Connect.IoT.Driver.IpcCfx.DriverObjects.CommandExecutionDestination.Exchange);

            await System.Threading.Tasks.Task.Delay(executionTime);

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
                return GetMaterialByName(panel)?.SystemState == MaterialSystemState.Queued;
            });

            return panel;
        }

        private async Task<Material> AOIExecution(Material lot, Material panel, decimal speed = 1)
        {
            int executionTime = Decimal.ToInt32(new Random().Next(15, 45) * 1000 / speed);

            await System.Threading.Tasks.Task.Delay(executionTime / 4);

            lot = GetMaterialByName(lot);

            if (lot.UniversalState == Cmf.Foundation.Common.Base.UniversalState.Terminated)
            {
                try
                {
                    lot = new UnterminateMaterialInput()
                    {
                        Material = lot,
                        UnterminateJustification = "Lot Material Rework Return"
                    }.UnterminateMaterialSync().Material;

                    lot = Retrier(() => new ComplexDispatchAndTrackInMaterialsInput()
                    {
                        MaterialCollection = new Dictionary<Material, DispatchMaterialParameters>()
                        {
                            { lot, new DispatchMaterialParameters() { Resource =  GetResourceByName(this.resourceSMTLine) } }
                        },
                        IgnoreLastServiceId = true
                    }.ComplexDispatchAndTrackInMaterialsSync()).Materials.First();

                    new InsertMaterialIntoLineInput()
                    {
                        Material = GetMaterialByName(panel),
                        LineMaterial = lot,
                        LineFlowPath = "SMT_Line_2PnP:A:1/AOI:6",
                        IsSpecial = true
                    }.InsertMaterialIntoLineSync();
                }
                catch (Exception ex)
                {
                    _scenario.Log.Debug($"Error {ex.Message} for Lot {lot?.Name}");
                }
            }

            _scenario.Log.Debug($"Tracking In AOI for Panel {panel?.Name}");
            panel = TrackInMaterial(panel, this.aoiResource);
            _scenario.Log.Info($"Tracked In AOI for Panel {panel?.Name}");

            await System.Threading.Tasks.Task.Delay(executionTime);

            var isToSendToRework = false;

            panel = new LoadMaterialChildrenInput()
            {
                Material = panel
            }.LoadMaterialChildrenSync().Material;

            if (panel.SubMaterials.Any(board => this.defectBoards.ContainsKey(board.Name)))
            {
                foreach (var board in panel.SubMaterials)
                {
                    if (this.defectBoards.TryRemove(board.Name, out string defectName))
                    {
                        isToSendToRework = true;
                        _scenario.Log.Debug($"Creating Defect {defectName} for Panel {panel?.Name}");
                        var defectReason = new GetObjectByNameInput()
                        {
                            Name = defectName,
                            Type = typeof(Cmf.Navigo.BusinessObjects.Reason)
                        }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Reason;

                        try
                        {
                            panel = new RecordMaterialDefectsInput()
                            {
                                Material = GetMaterialByName(panel),
                                MaterialDefects = [
                                    new MaterialDefect()
                                    {
                                        Reason = defectReason,
                                        DefectSource = MaterialDefectSource.None
                                    }
                                ]
                            }.RecordMaterialDefectsSync().Material;

                            panel = new RecordMaterialDefectsInput()
                            {
                                Material = GetMaterialByName(board),
                                MaterialDefects = [
                                    new MaterialDefect()
                                {
                                    Reason = defectReason,
                                    DefectSource = MaterialDefectSource.None
                                }
                                ]
                            }.RecordMaterialDefectsSync().Material.ParentMaterial;
                            _scenario.Log.Debug($"Created Defect {defectReason.Name} for Board {board?.Name}");
                        }
                        catch (Exception ex)
                        {
                            _scenario.Log.Debug($"Error {ex.Message} for Board {board?.Name}");
                        }
                    }
                }
            }

            _scenario.Log.Debug($"Tracking Out AOI for Panel {panel?.Name}");

            panel = TrackOutMaterial(panel);

            _scenario.Log.Info($"Tracked Out AOI for Panel {panel?.Name}");

            if (isToSendToRework)
            {
                panel = HandleRework(panel);
                await AOIExecution(lot, panel, speed);
            }

            return panel;
        }

        private Material HandleRework(Material panel)
        {
            _scenario.Log.Debug($"Dispatch and Tracking In to Rework for Panel {panel?.Name}");

            panel = Retrier(() => new ComplexDispatchAndTrackInMaterialsInput()
            {
                MaterialCollection = new Dictionary<Material, DispatchMaterialParameters>()
                {
                    { GetMaterialByName(panel), new DispatchMaterialParameters() { Resource =  GetResourceByName(this.reworkResource) } }
                },
                IgnoreLastServiceId = true
            }.ComplexDispatchAndTrackInMaterialsSync()).Materials.First();

            var defects = GetMaterialDefectsByMaterial(panel);
            defects.ForEach(def => def.SystemState = MaterialDefectSystemState.Accepted);

            panel = new ManageMaterialDefectsInput()
            {
                Material = panel,
                MaterialDefects = defects,
            }.ManageMaterialDefectsSync().Material;

            panel = new LoadMaterialChildrenInput()
            {
                Material = panel
            }.LoadMaterialChildrenSync().Material;

            foreach (var board in panel.SubMaterials)
            {
                defects = GetMaterialDefectsByMaterial(board);
                defects.ForEach(def => def.SystemState = MaterialDefectSystemState.Accepted);

                panel = new ManageMaterialDefectsInput()
                {
                    Material = board,
                    MaterialDefects = defects,
                }.ManageMaterialDefectsSync().Material.ParentMaterial;
            }

            panel = Retrier(() => new ComplexTrackOutAndMoveMaterialsToNextStepInput()
            {
                Materials = new Dictionary<Material, ComplexTrackOutAndMoveNextParameters>()
                {
                    { GetMaterialByName(panel),  new ComplexTrackOutAndMoveNextParameters() { FlowPath = this.flowPathTrackoutLine }}
                }
            }.ComplexTrackOutAndMoveMaterialsToNextStepSync()).Materials.First().Key;
            return panel;
        }
    }
}