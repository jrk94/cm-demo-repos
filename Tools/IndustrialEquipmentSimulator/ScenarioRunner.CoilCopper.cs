using Cmf.Navigo.BusinessObjects;
using Cmf.Navigo.BusinessOrchestration.ContainerManagement.InputObjects;
using Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects;
using Material = Cmf.Navigo.BusinessObjects.Material;
using Task = System.Threading.Tasks.Task;

namespace IndustrialEquipmentSimulator
{
    public partial class ScenarioRunner
    {
        /// <summary>
        /// Coil Copper
        /// - Flow
        ///     - Coil Bend
        ///     - Copper Bend
        ///     - Indoor Braze
        ///     - Outdoor Braze
        ///     - Compressor Tube Braze
        ///     - Coil Treatment
        ///     - Kanban Final Assembly
        /// </summary>
        /// <returns></returns>
        private async System.Threading.Tasks.Task MESRun_CoilCopper_SemiFinishedGood()
        {
            foreach (var productName in this.availableProducts["CoilCopper"])
            {
                OrderPreparation("CoilCopper", "Fabrication_Coil - Copper:A:1/START COIL - COPPER:1", out Product? product, out ProductionOrder? productionOrder, out Facility? facility, out MaterialCollection? lots, productName: productName);

                List<Func<Material, decimal, Task<object>>> coilCopperExecution =
                [
                    CoilStart,
                    CoilBend,
                    CopperBend,
                    IndoorBraze,
                    OutdoorBraze,
                    CompressorTubBraze
                ];

                var tasks = new List<System.Threading.Tasks.Task<MaterialCollection>>();
                foreach (var lot in lots)
                {
                    tasks.Add(ProcessPipeline(lot, coilCopperExecution, this._speed));
                }

                MaterialCollection[] results = await System.Threading.Tasks.Task.WhenAll(tasks);

                #region Handle Batch Processing and Move to Kanban
                var (batches, incompleteBatches) = GroupMaterials(results, ResourcePicker("CoilTreatment"));

                if (incompleteBatches.Count > 0)
                {
                    foreach (var incompleteBatch in incompleteBatches)
                    {
                        var missingQty = 70 - incompleteBatch.BatchMaterials.Sum(mat => mat.Quantity);
                        incompleteBatch.BatchMaterials.First().Material = new ChangeMaterialQuantityInput()
                        {
                            MaterialQuantityChange = new MaterialQuantityChange()
                            {
                                Material = incompleteBatch.BatchMaterials.First().Material,
                                NewPrimaryQuantity = incompleteBatch.BatchMaterials.First().Quantity + missingQty
                            }
                        }.ChangeMaterialQuantitySync().Material;

                        incompleteBatch.BatchMaterials.First().Quantity = incompleteBatch.BatchMaterials.First().Quantity + missingQty;
                        incompleteBatch.Quantity = 70;

                        batches.Add(incompleteBatch);
                    }
                }

                IEnumerable<Material> materials = BatchLifecycle(batches);

                #region MoveNext Material to Final step 
                var getDataForMultipleMoveNextWizardInput = new GetDataForMultipleMoveNextWizardInput()
                {
                    Materials = [materials.First()]
                }.GetDataForMultipleMoveNextWizardSync();

                new ComplexMoveMaterialsToNextStepInput()
                {
                    Materials =
                        materials.ToDictionary(
                            m => m,
                            _ => getDataForMultipleMoveNextWizardInput
                                    .NextStepsResults
                                    .First()
                                    .FlowPath
                        )
                }.ComplexMoveMaterialsToNextStepSync();

                #endregion
                #endregion

                //CloseProductionOrder(productionOrder);
            }
        }

        private async Task<object> CoilStart(Material lot, decimal speed = 1)
        {
            var getDataForMultipleMoveNextWizardInput = new GetDataForMultipleMoveNextWizardInput()
            {
                Materials = [lot]
            }.GetDataForMultipleMoveNextWizardSync();

            lot = new ComplexMoveMaterialsToNextStepInput()
            {
                Materials = new Dictionary<Material, string>()
                {
                    { getDataForMultipleMoveNextWizardInput.Materials.First(), getDataForMultipleMoveNextWizardInput.NextStepsResults.First().FlowPath }
                }
            }.ComplexMoveMaterialsToNextStepSync().Materials.First();

            return lot;
        }

        private async Task<object> CoilBend(Material lot, decimal speed = 1)
        {
            if (this.availableProducts["Coil"].First() == GetProductById(lot.Product.Id).Name)
            {
                string resourceName = ResourcePicker("CoilBend");

                int executionTime = Decimal.ToInt32(new Random().Next(15, 40) * 1000 / speed);

                lot = await MaterialTracking(lot, resourceName, "CoilBend", speed, [100, 180], "SEMIE10",
                    preTrackInAction: (material, resource) =>
                    {
                        this.ValidateOnlyMaterialsInProcessSameProduct(material, resource);
                        return Task.FromResult(material);
                    },
                    postTrackInAction: async (material, resourceName) =>
                    {
                        await System.Threading.Tasks.Task.Delay(executionTime);
                        return ManualAssembly(lot);
                    });
            }

            return lot;
        }

        private async Task<object> CopperBend(Material lot, decimal speed = 1)
        {
            if (this.availableProducts["Copper"].First() == GetProductById(lot.Product.Id).Name)
            {
                string resourceName = ResourcePicker("CopperBend");

                int executionTime = Decimal.ToInt32(new Random().Next(15, 40) * 1000 / speed);

                lot = await MaterialTracking(lot, resourceName, "CopperBend", speed, [100, 180], "SEMIE10",
                    preTrackInAction: (material, resource) =>
                    {
                        this.ValidateOnlyMaterialsInProcessSameProduct(material, resource);
                        return Task.FromResult(material);
                    },
                    postTrackInAction: async (material, resourceName) =>
                    {
                        await System.Threading.Tasks.Task.Delay(executionTime);
                        return ManualAssembly(lot);
                    });
            }

            return lot;
        }

        private async Task<object> IndoorBraze(Material lot, decimal speed = 1)
        {
            string resourceName = ResourcePicker("IndoorBraze");

            int executionTime = Decimal.ToInt32(new Random().Next(15, 40) * 1000 / speed);

            lot = await MaterialTracking(lot, resourceName, "IndoorBraze", speed, [170, 200], "SEMIE10",
                    preTrackInAction: (material, resource) =>
                    {
                        this.ValidateOnlyMaterialsInProcessSameProduct(material, resource);
                        return Task.FromResult(material);
                    },
                    postTrackInAction: async (material, resourceName) =>
                    {
                        await System.Threading.Tasks.Task.Delay(executionTime);
                        return ManualAssembly(lot);
                    });

            return lot;
        }

        private async Task<object> OutdoorBraze(Material lot, decimal speed = 1)
        {
            string resourceName = ResourcePicker("OutdoorBraze");

            int executionTime = Decimal.ToInt32(new Random().Next(15, 40) * 1000 / speed);

            lot = await MaterialTracking(lot, resourceName, "OutdoorBraze", speed, [190, 280], "SEMIE10",
                    preTrackInAction: (material, resource) =>
                    {
                        this.ValidateOnlyMaterialsInProcessSameProduct(material, resource);
                        return Task.FromResult(material);
                    },
                    postTrackInAction: async (material, resourceName) =>
                    {
                        await System.Threading.Tasks.Task.Delay(executionTime);
                        return ManualAssembly(lot);
                    });

            return lot;
        }

        /// <summary>
        /// This Step allows for trackout with splits
        /// </summary>
        /// <param name="lot"></param>
        /// <param name="speed"></param>
        /// <returns></returns>
        private async Task<object> CompressorTubBraze(Material lot, decimal speed = 1)
        {
            var descriptor = "CompressorTubBraze";
            string resourceName = ResourcePicker("CompressorTubBraze");

            int executionTime = Decimal.ToInt32(new Random().Next(100, 180) * 1000 / speed);

            await System.Threading.Tasks.Task.Delay(executionTime / 4);

            LogWithGuid($"Tracking In {descriptor} {lot?.Name}");
            lot = DispatchAndTrackInMaterial(lot, resourceName, this._stateModel["SEMIE10"]);
            LogWithGuid($"Tracked In {descriptor} {lot?.Name}");

            await System.Threading.Tasks.Task.Delay(executionTime);

            LogWithGuid($"Tracking Out {descriptor} {lot?.Name}");
            var nextFlowPath = new GetDataForMultipleTrackOutAndMoveNextWizardInput()
            {
                Operation = GetDataForTrackOutAndMoveNextOperation.TrackOutAndMoveNext,
                Materials = [lot]
            }.GetDataForMultipleTrackOutAndMoveNextWizardSync().NextStepsResults.FirstOrDefault().FlowPath;

            var splitLotsQty = SplitRandomly((int)lot.PrimaryQuantity, 1, (int)lot.PrimaryQuantity);

            var newSplittedMaterials = new MaterialCollection();
            foreach (var lotsQty in splitLotsQty)
            {
                var stateModelTransition = this._stateModel["SEMIE10"].StateTransitions.Find(sm => sm.Name == "Productive to Standby");
                if (GetResourceById(lot.LastProcessStepResource.Id).MaterialsInProcessCount != 0)
                {
                    stateModelTransition = null;
                }

                var material = Retrier(() => new ComplexTrackOutAndMoveMaterialsToNextStepInput()
                {
                    Materials = new Dictionary<Material, ComplexTrackOutAndMoveNextParameters>()
                    {
                        { GetMaterialByName(lot), new ComplexTrackOutAndMoveNextParameters(){
                            FlowPath = nextFlowPath,
                            SplitAndTrackOutParameters = new SplitInputParameters()
                            {
                                PrimaryQuantity = lotsQty,
                            },
                            TerminateOnZeroQuantity = true
                        } }
                    },
                    StateModel = this._stateModel["SEMIE10"],
                    StateModelTransition = stateModelTransition,
                    IgnoreLastServiceId = true
                }.ComplexTrackOutAndMoveMaterialsToNextStepSync()).Materials.First().Key;

                var containerType = this.availableProducts["Copper"].First() == GetProductById(lot.Product.Id).Name ? "Copper Container" : "Alu Container";
                var container = new CreateContainerInput()
                {
                    Container = new Container()
                    {
                        CapacityValidationMode = CapacityValidationMode.None,
                        Facility = material.Facility,
                        IsAutoGeneratePositionEnabled = true,
                        PositionUnitType = ContainerPositionUnitType.Material,
                        TotalPositions = 1,
                        Type = containerType,
                        Name = containerType + Guid.NewGuid().ToString()
                    }
                }.CreateContainerSync().Container;

                container = new UpdateContainerMaterialPositionsInput()
                {
                    Container = container,
                    MaterialContainerRelationsToAdd = [new MaterialContainer()
                    {
                        SourceEntity = GetMaterialByName(material)
                    }]
                }.UpdateContainerMaterialPositionsSync().Container;

                newSplittedMaterials.Add(material);
            }

            LogWithGuid($"Tracked Out {descriptor} {lot?.Name}");
            return newSplittedMaterials;
        }

        private static (
                BatchCollection CompleteBatches,
                BatchCollection IncompleteBatches
            ) GroupMaterials(
                IReadOnlyList<MaterialCollection> collections,
                string resourceName,
                int min = 70,
                int max = 100)
        {
            // Flatten materials
            var materials = new List<Material>();
            foreach (var c in collections)
                materials.AddRange(c);

            // Sort descending by quantity
            materials.Sort((a, b) =>
                Comparer<int>.Default.Compare(
                    (int)b.PrimaryQuantity,
                    (int)a.PrimaryQuantity));

            var complete = new List<List<Material>>();
            var incomplete = new List<List<Material>>();

            // First-Fit Decreasing (material-level)
            foreach (var material in materials)
            {
                bool placed = false;

                foreach (var batchMaterials in complete)
                {
                    int total = 0;
                    foreach (var m in batchMaterials)
                        total += (int)m.PrimaryQuantity;

                    if (total + material.PrimaryQuantity <= max)
                    {
                        batchMaterials.Add(material);
                        placed = true;
                        break;
                    }
                }

                if (!placed)
                {
                    if (material.PrimaryQuantity <= max)
                    {
                        complete.Add(new List<Material> { material });
                    }
                    else
                    {
                        incomplete.Add(new List<Material> { material });
                    }
                }
            }

            // Move underfilled to incomplete
            for (int i = complete.Count - 1; i >= 0; i--)
            {
                int total = 0;
                foreach (var m in complete[i])
                    total += (int)m.PrimaryQuantity;

                if (total < min)
                {
                    incomplete.Add(complete[i]);
                    complete.RemoveAt(i);
                }
            }

            // Build domain Batches
            var resource = GetResourceByName(resourceName);

            BatchCollection BuildBatches(List<List<Material>> groups)
            {
                var collection = new BatchCollection();

                for (int i = 0; i < groups.Count; i++)
                {
                    var batchMaterials = new BatchMaterialCollection();

                    for (int y = 0; y < groups[i].Count; y++)
                    {
                        bool isMainMaterial = y == 0;
                        Material? material = groups[i][y];
                        batchMaterials.Add(new BatchMaterial
                        {
                            Material = material,
                            Step = material.Step,
                            Quantity = (decimal)material.PrimaryQuantity,
                            IsMainMaterial = isMainMaterial
                        });
                    }

                    collection.Add(new Batch
                    {
                        BatchMaterials = batchMaterials,
                        Resource = resource,
                        Step = batchMaterials.First().Step
                    });
                }

                return collection;
            }

            return (
                BuildBatches(complete),
                BuildBatches(incomplete)
            );
        }
    }
}
