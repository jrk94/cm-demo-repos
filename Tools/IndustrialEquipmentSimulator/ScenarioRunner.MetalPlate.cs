using Cmf.Foundation.BusinessOrchestration.GenericServiceManagement.InputObjects;
using Cmf.Navigo.BusinessObjects;
using Cmf.Navigo.BusinessOrchestration.EdcManagement.DataCollectionManagement.InputObjects;
using Cmf.Navigo.BusinessOrchestration.ExceptionManagement.InputObjects;
using Cmf.Navigo.BusinessOrchestration.LaborManagement.InputObjects;
using Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects;
using Cmf.Navigo.BusinessOrchestration.ResourceManagement.InputObjects;
using IndustrialEquipmentSimulator.Objects;
using SharpCompress;
using Material = Cmf.Navigo.BusinessObjects.Material;
using Task = System.Threading.Tasks.Task;

namespace IndustrialEquipmentSimulator
{
    public partial class ScenarioRunner
    {
        /// <summary>
        /// Metal Plate
        /// - Flow
        ///     - Punch
        ///     - Bend
        ///     - Fabrication Paint White (Product.ProductGroup.Name = "White")
        ///         - Coating
        ///         - Plate Painting
        ///     - Fabrication Paint Colours (Product.ProductGroup.Name = "Color")
        ///         - Plate Coloring
        ///     - Kanban Final Assembly
        /// </summary>
        /// <returns></returns>
        private async Task MESRun_MetalPlate_SemiFinishedGood()
        {
            foreach (var productName in this.availableProducts["MetalPlate"])
            {
                OrderPreparation("MetalPlate", "Fabrication_Metal Plate:A:1/PUNCH:1", out Product? product, out ProductionOrder? productionOrder, out Facility? facility, out MaterialCollection? lots, productName: productName);

                List<Func<Material, decimal, Task<Material>>> metalPlateExecution =
                [
                    Punch,
                    Bend,
                    FabricationPaintWhite,
                    FabricationPaintColours,
                    //KanbanFinalAssembly
                ];

                var tasks = new List<Task>();
                foreach (var lot in lots)
                {
                    tasks.Add(ProcessPipeline(lot, metalPlateExecution, this._speed));
                }

                await System.Threading.Tasks.Task.WhenAll(tasks);

                if (!GetMaterialsByName(lots).Any(material => material.OpenExceptionProtocolsCount > 0))
                {
                    CloseProductionOrder(productionOrder, lots.Sum(lot => lot.PrimaryQuantity ?? 0));
                }
            }
        }

        private async Task<Material> Punch(Material lot, decimal speed = 1)
        {
            string resourceName = ResourcePicker("Punch");

            lot = await MaterialTracking(lot, resourceName, "Punch", speed, [270, 380], "SEMIE58",
                preTrackInAction: (material, resourceName) =>
                {
                    this.ValidateOnlyMaterialsInProcessSameProduct(material, resourceName);
                    this.ValidateDurables(lot, resourceName);
                    this.PrepareFeeders(resourceName);
                    return Task.FromResult(material);
                });

            return lot;
        }

        private async Task<Material> Bend(Material lot, decimal speed = 1)
        {
            string resourceName = ResourcePicker("Bend");

            lot = await MaterialTracking(lot, resourceName, "Bend", speed, [150, 220], "SEMIE58",
                preTrackInAction: (material, resource) =>
                {
                    this.ValidateOnlyMaterialsInProcessSameProduct(material, resource);
                    this.ValidateDurables(lot, resourceName);
                    return Task.FromResult(material);
                });

            return lot;
        }

        private async Task<Material> FabricationPaintWhite(Material lot, decimal speed = 1)
        {
            var product = GetProductById(lot.Product.Id);
            if (product?.ProductGroup?.Name == "White")
            {
                lot = await Coating(lot, speed);
                lot = await PlatePainting(lot, speed);
            }

            return lot;
        }

        private async Task<Material> FabricationPaintColours(Material lot, decimal speed = 1)
        {
            var product = GetProductById(lot.Product.Id);
            if (product?.ProductGroup?.Name == "Color")
            {
                lot = await PlateColoring(lot, speed);
            }
            return lot;
        }

        private async Task<Material> Coating(Material lot, decimal speed = 1)
        {
            string resourceName = ResourcePicker("Coating");
            Employee employeeToCheckIn = new Employee() { Name = this.employeeDefect.ElementAt(Random.Shared.Next(this.employeeDefect.Count)).Key };

            lot = await MaterialTracking(lot, resourceName, "Coating", speed, [270, 380], "SEMIE58",
                preTrackInAction: (material, resource) =>
                {
                    this.ValidateOnlyMaterialsInProcessSameProduct(material, resource);
                    this.PrepareFeeders(resourceName);
                    CheckInOperator(resourceName, employeeToCheckIn.Name, out _, out Employee emp);
                    employeeToCheckIn = emp;
                    return Task.FromResult(material);
                },
                postTrackOutAction: (material, resourceName) =>
                {
                    CheckOutOperatorIfNoMaterialsInProcess(resourceName, employeeToCheckIn.Name, out _, out _);
                    return Task.FromResult(material);
                });

            return lot;
        }

        private async Task<Material> PlatePainting(Material lot, decimal speed = 1, double defectProbability = 0.1)
        {
            string resourceName = ResourcePicker("PlatePainting");
            var events = _eventsService.GetEvents();
            Employee employeeToCheckIn = new Employee() { Name = this.employeeDefect.ElementAt(Random.Shared.Next(this.employeeDefect.Count)).Key };

            lot = await MaterialTracking(lot, resourceName, "PlatePainting", speed, [270, 380], "SEMIE58",
                preTrackInAction: (material, resource) =>
                {
                    this.ValidateOnlyMaterialsInProcessSameProduct(material, resource);
                    this.PrepareFeeders(resourceName);

                    CheckInOperator(resourceName, employeeToCheckIn.Name, out _, out Employee emp);
                    employeeToCheckIn = emp;

                    defectProbability = this.employeeDefect.FirstOrDefault(eDef => eDef.Key == employeeToCheckIn.Name).Value;
                    LogWithGuid($"Selected {employeeToCheckIn.Name} at {resourceName} with defect probability of {defectProbability}");
                    return Task.FromResult(material);
                },
                postTrackInAction: async (material, resource) =>
                {
                    return await HandleReworkLifecycle("White", material, resource, (double)defectProbability, speed, events);
                },
                postTrackOutAction: (material, resourceName) =>
                {
                    CheckOutOperatorIfNoMaterialsInProcess(resourceName, employeeToCheckIn.Name, out _, out _);
                    return Task.FromResult(material);
                }, disableTrackout: true);

            return lot;
        }

        private async Task<Material> PlateColoring(Material lot, decimal speed = 1, double defectProbability = 0.1)
        {
            string resourceName = ResourcePicker("Coloring");
            var events = _eventsService.GetEvents();
            Employee employeeToCheckIn = new Employee() { Name = this.employeeDefect.ElementAt(Random.Shared.Next(this.employeeDefect.Count)).Key };

            this.PrepareFeeders(resourceName);

            lot = await MaterialTracking(lot, resourceName, "Coloring", speed, [270, 380], "SEMIE58",
                preTrackInAction: (material, resource) =>
                {
                    this.ValidateOnlyMaterialsInProcessSameProduct(material, resource);
                    this.PrepareFeeders(resourceName);

                    CheckInOperator(resourceName, employeeToCheckIn.Name, out _, out Employee emp);
                    employeeToCheckIn = emp;

                    defectProbability = this.employeeDefect.FirstOrDefault(eDef => eDef.Key == employeeToCheckIn.Name).Value;
                    LogWithGuid($"Selected {employeeToCheckIn.Name} at {resourceName} with defect probability of {defectProbability}");
                    return Task.FromResult(material);
                },
                postTrackInAction: async (material, resource) =>
                {
                    return await HandleReworkLifecycle("Color", material, resource, (double)defectProbability, speed, events);
                },
                postTrackOutAction: (material, resourceName) =>
                {
                    CheckOutOperatorIfNoMaterialsInProcess(resourceName, employeeToCheckIn.Name, out _, out _);
                    return Task.FromResult(material);
                }, disableTrackout: true);

            return lot;
        }

        private async Task<Material> HandleReworkLifecycle(string type, Material material, string resource, double defectProbability, decimal speed, Events events)
        {
            var isDefective = Random.Shared.NextDouble() < (double)defectProbability;
            material = PostDataCollectionPainting(material, resource, isDefective);
            material = TrackOutMaterial(material, this._stateModel["SEMIE58"]);
            var isQuarantined = false;

            if (isDefective)
            {
                (material, isQuarantined) = await this.HandleDefectWithRework(type, speed, material, events);
                return material;
            }

            if (!isQuarantined)
            {
                var nextFlowPath = new GetDataForMultipleMoveNextWizardInput()
                {
                    Materials = [material]
                }.GetDataForMultipleMoveNextWizardSync().NextStepsResults.FirstOrDefault().FlowPath;

                material = Retrier(() => new ComplexMoveMaterialsToNextStepInput()
                {
                    Materials = new Dictionary<Cmf.Navigo.BusinessObjects.Material, string>()
                        {
                            {
                                GetMaterialByName(material),
                                nextFlowPath
                            }
                        }
                }.ComplexMoveMaterialsToNextStepSync()).Materials.First();

            }
            return material;
        }

        private Material PostDataCollectionPainting(Material material, string resourceName, bool isDefective = false)
        {
            lock (_trackLock)
            {
                material = new GetMaterialBasicInformationInput()
                {
                    Material = material,
                    LevelsToLoad = 2,
                }.GetMaterialBasicInformationSync().Material;

                material.CurrentDataCollectionInstance.DataCollection = new LoadDataCollectionParameterInformationInput()
                {
                    DataCollection = material.CurrentDataCollectionInstance.DataCollection,
                    DataCollectionInstance = material.CurrentDataCollectionInstance,
                    LevelsToLoad = 1,
                    LoadReadingNames = true,
                    LoadSampleNames = true,
                    Resource = material.LastProcessedResource

                }.LoadDataCollectionParameterInformationSync().DataCollection;

                var availableGauges = isDefective ?
                     this.datacollectionGauges.Where(gauge => gauge.Value == "Defect").ToDictionary() :
                     this.datacollectionGauges.Where(gauge => gauge.Value == "Nominal").ToDictionary();

                var gauge = new GetObjectByNameInput()
                {
                    Name = availableGauges.ElementAt(Random.Shared.Next(availableGauges.Keys.Count)).Key,
                    Type = typeof(Cmf.Navigo.BusinessObjects.Resource),
                    IgnoreLastServiceId = true
                }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Resource;

                var resource = GetResourceByName(resourceName);
                var loadResourceRelations = new LoadResourceRelationsInput()
                {
                    IsSource = true,
                    Resource = resource
                }.LoadResourceRelationsSync();

                var attachedInstruments = new ResourceInstrumentCollection();

                if (loadResourceRelations?
                    .Resource?
                    .RelationCollection?
                    .TryGetValue("ResourceInstrument", out Cmf.Foundation.BusinessObjects.EntityRelationCollection? relation) ?? false)
                {
                    relation?.Cast<ResourceInstrument>()?.ForEach(attachedInstruments.Add);
                }

                if (!attachedInstruments.Any(i => i.TargetEntity.Id == gauge.Id))
                {
                    Retrier(() => new ManageResourceInstrumentsInput()
                    {
                        InstrumentsToRemove = attachedInstruments,
                        InstrumentsToAdd = [
                            new ResourceInstrument() {
                                    TargetEntity = gauge,
                                    Order = 1,
                                }
                        ],
                        Resource = resource,
                        IgnoreLastServiceId = true
                    }.ManageResourceInstrumentsSync());
                }

                var dcps = new DataCollectionPointCollection();
                this.datacollection.ForEach((keyValue) =>
                {
                    dcps.Add(new DataCollectionPoint()
                    {
                        Instrument = gauge.Id.ToString(),
                        InstrumentName = gauge.Name,
                        ReadingNumber = 1,
                        SampleId = "Sample 1",
                        SourceEntity = material.CurrentDataCollectionInstance,
                        TargetEntity = material.CurrentDataCollectionInstance.DataCollection.DataCollectionParameters.
                            FirstOrDefault(p => p.TargetEntity.Name == keyValue.Key).TargetEntity,
                        Value = isDefective ?
                                    Math.Round(Random.Shared.NextDouble() * 20.0 + 60.0, 2, MidpointRounding.AwayFromZero) :
                                    Math.Round(keyValue.Value * (1.0 + (Random.Shared.NextDouble() * 0.10 - 0.05)), 2, MidpointRounding.AwayFromZero)
                    });
                });

                material = new PostDataCollectionPointsInput()
                {
                    DataCollectionInstance = material.CurrentDataCollectionInstance,
                    IgnoreLastServiceId = true,
                    DataCollectionPoints = dcps
                }.PostDataCollectionPointsSync().DataCollectionInstance.Material;
            }

            return material;
        }

        private async Task<(Material, bool)> HandleDefectWithRework(string typeOfDefect, decimal speed, Material material, Objects.Events events)
        {
            var defects = events.Defects[typeOfDefect].ElementAt(Random.Shared.Next(events.Defects[typeOfDefect].Count));

            this.defectMaterials.TryAdd(material.Name, defects.Key);

            var materialDefectCollection = new MaterialDefectCollection();
            foreach (var defectCharacteristic in defects.Value)
            {
                LogWithGuid($"Creating a defect {defectCharacteristic.Reason} for material {material.Name}");
                materialDefectCollection.Add(new MaterialDefect()
                {
                    CoordinateX = defectCharacteristic.CoordinateX,
                    CoordinateY = defectCharacteristic.CoordinateY,
                    OpenRemark = defectCharacteristic.Remark,
                    DefectSource = MaterialDefectSource.Picture,
                    DefectType = MaterialDefectDefectType.Location,
                    LocationType = MaterialDefectLocationType.Coordinates,
                    Picture = new Cmf.Foundation.BusinessObjects.CmfFile()
                    {
                        Filename = defectCharacteristic.FileName,
                        Checksum = defectCharacteristic.Checksum
                    },
                    Reason = new GetObjectByNameInput()
                    {
                        Name = defectCharacteristic.Reason,
                        Type = typeof(Cmf.Navigo.BusinessObjects.Reason)
                    }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Reason,
                    Shape = defectCharacteristic.Shape
                });
            }

            material = new RecordMaterialDefectsInput()
            {
                Material = GetMaterialByName(material),
                MaterialDefects = materialDefectCollection
            }.RecordMaterialDefectsSync().Material;

            LogWithGuid($"Created defects for material {material.Name}");

            var getDataForReworkWizard = new GetDataForReworkWizardInput()
            {
                Material = material,
            }.GetDataForReworkWizardSync();
            var reworkInfo = getDataForReworkWizard.ReworkPathCollection.FirstOrDefault();

            try
            {
                LogWithGuid($"Sending to Rework for material {material.Name}");
                material = Retrier(() => new ComplexReworkMaterialInput()
                {
                    Material = GetMaterialByName(material),
                    MaterialOffFlow = new MaterialOffFlow()
                    {
                        GotoFlow = reworkInfo.GotoFlow,
                        GotoFlowPath = reworkInfo.GotoFlowPath,
                        GotoStep = reworkInfo.GotoStep,

                        Material = GetMaterialByName(material),
                        OffFlowType = OffFlowType.Rework,

                        Reason = reworkInfo.ReworkReason,

                        ReturnFlow = material.Flow,
                        ReturnFlowPath = reworkInfo.ReturnFlowPath,
                        ReturnStep = reworkInfo.ReturnStep,

                        ReworkPath = reworkInfo,
                    },
                    IgnoreLastServiceId = true
                }.ComplexReworkMaterialSync()).Material;
                LogWithGuid($"Sent to Rework material {material.Name}");
            }
            catch (Exception ex)
            {
                LogWithGuid($"Reached Maximum Rework material {material.Name}");
                var owner = new GetEmployeeByUserAccountInput()
                {
                    UserAccount = "JOAOROQUE@CRITICALMANUFACTURING.COM"
                }.GetEmployeeByUserAccountSync().Employee;

                LogWithGuid($"Opening Protocol {material.Name}");
                var protocol = new OpenProtocolInstanceInput()
                {
                    MaterialsToAssociate = [material],
                    Facility = material.Facility,
                    Flow = material.Flow,
                    FlowPath = material.FlowPath,
                    IgnoreLastServiceId = true,
                    Initiator = owner,
                    Owner = owner,
                    Product = material.Product,
                    Resource = material.LastProcessedResource,
                    Protocol = new GetObjectByNameInput()
                    {
                        Name = "Repeated Reworks",
                        Type = typeof(Cmf.Navigo.BusinessObjects.Protocol),
                        IgnoreLastServiceId = true
                    }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Protocol,
                    Step = material.Step
                }.OpenProtocolInstanceSync();
                LogWithGuid($"Opened Protocol {material.Name}");

                return (material, true);
            }

            material = await MaterialTracking(material, "Rework Station 1", "RW Polish", speed, [100, 150], "SEMIE58", preTrackOutAction: (material, resource) =>
            {
                // Mark all as accepted
                materialDefectCollection = GetMaterialDefectsByMaterial(material);
                var materialDefectCollectionToUpdate = new MaterialDefectCollection();
                materialDefectCollection.ForEach(def =>
                {
                    if (def.SystemState == MaterialDefectSystemState.Open)
                    {
                        def.SystemState = MaterialDefectSystemState.Accepted;
                        materialDefectCollectionToUpdate.Add(def);
                    }
                });

                LogWithGuid($"Accepting defects for material {material.Name}");
                material = new ManageMaterialDefectsInput()
                {
                    Material = material,
                    MaterialDefects = materialDefectCollectionToUpdate,
                }.ManageMaterialDefectsSync().Material;
                LogWithGuid($"Accepted defects for material {material.Name}");

                return Task.FromResult(material);
            }, disableTrackin: true);

            // RW Inpection
            material = await MaterialTracking(material, "Rework Station 2", "RW Inspection", speed, [100, 150], "SEMIE10");

            if (typeOfDefect == "Color")
            {
                material = await PlateColoring(material, speed);
            }
            else
            {
                material = await Coating(material, speed);

                material = await PlatePainting(material, speed);
            }

            return await Task.FromResult((material, false));
        }

    }
}