using Cmf.Foundation.BusinessOrchestration.GenericServiceManagement.InputObjects;
using Cmf.Navigo.BusinessObjects;
using Cmf.Navigo.BusinessOrchestration.MaterialLogisticsManagement.InputObjects;
using Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects;
using Task = System.Threading.Tasks.Task;

namespace IndustrialEquipmentSimulator
{
    public partial class ScenarioRunner
    {
        /// <summary>
        /// Final Assembly
        /// - Flow
        ///     - Base ASM
        ///     - Heat Mod Comp Tub
        ///     - Install Od Coil Tubes
        ///     - Nitrogen Evac Charge
        ///     - Apply Foam
        ///     - Final Wiring
        ///     - Quality Insp
        ///     - Install Cover Fans And Roofs
        ///     - Clean Up Inspection
        ///     - Final Assembly wait for Packing
        ///     - RTU Packing
        ///     - Shipping with Indutech
        ///     - RTU Packing
        ///         - RTU Final Packing
        ///         - Shipping Final Customer
        /// </summary>
        /// <returns></returns>
        private async System.Threading.Tasks.Task MESRun_FinalAssemble_FinishedGood()
        {
            LogWithGuid($"Starting Finished Good Process");

            OrderPreparation("FinalAssembly", "Final Assembly:A:1/BASE ASM:1", out Product? product, out ProductionOrder? productionOrder, out Facility? facility, out MaterialCollection? lots,
                maxOrderQty: 1,
                productionOrderCharacteristicCollection: new ProductionOrderCharacteristicCollection()
                    {
                        new ProductionOrderCharacteristic()
                        {
                            Name = "Size",
                            Value = "10TON",
                            Order = 1
                        },
                        new ProductionOrderCharacteristic()
                        {
                            Name = "Color",
                            Value = "Color",
                            Order = 2
                        },
                    });


            List<Func<Material, decimal, Task<Material>>> metalPlateExecution =
            [
                BaseAsm,
                HeatModCompTub,
                InstallOdCoilTubes,
                NitrogenEvacCharge,
                ApplyFoam,
                FinalWiring,
                InstallCoverDoorsFansAndRoof,
                CleanUpAndInspection,
                FinalAssemblyWaitForPacking,
                RTUPacking,
                RTUFinalPacking,
            ];

            var tasks = new List<System.Threading.Tasks.Task>();
            foreach (var lot in lots)
            {
                tasks.Add(ProcessPipeline(lot, metalPlateExecution, this._speed));
            }

            await System.Threading.Tasks.Task.WhenAll(tasks);

            LogWithGuid($"Finishing Finished Good Process");

            CloseProductionOrder(productionOrder, lots.Sum(lot => lot.PrimaryQuantity ?? 0));

            Retrier(() => new ShipMaterialsInput()
            {
                Materials = GetMaterialsByName(lots),
                DestinationFacility = new GetObjectByNameInput()
                {
                    Name = "Final Customer",
                    Type = typeof(Facility)
                }.GetObjectByNameSync().Instance as Facility
            }.ShipMaterialsSync());

            LogWithGuid($"Shipped Finished Goods");
        }
        private async Task<Material> BaseAsm(Material lot, decimal speed = 1)
        {
            string resourceName = ResourcePicker("BaseAsm");

            int executionTime = Decimal.ToInt32(new Random().Next(30, 120) * 1000 / speed);

            lot = await MaterialTracking(lot, resourceName, "HeatModCompTub", speed, [30, 120], "InduTech State Model", postTrackInAction: async (material, resourceName) =>
            {
                await System.Threading.Tasks.Task.Delay(executionTime);
                return ManualAssembly(lot);
            });

            return lot;
        }

        private async Task<Material> HeatModCompTub(Material lot, decimal speed = 1)
        {
            string resourceName = ResourcePicker("HeatModCompTub");

            lot = await MaterialTracking(lot, resourceName, "HeatModCompTub", speed, [30, 120], "InduTech State Model");

            return lot;
        }

        private async Task<Material> InstallOdCoilTubes(Material lot, decimal speed = 1)
        {
            string resourceName = ResourcePicker("InstallOdCoilTubes");

            int executionTime = Decimal.ToInt32(new Random().Next(30, 120) * 1000 / speed);

            lot = await MaterialTracking(lot, resourceName, "InstallOdCoilTubes", speed, [30, 120], "InduTech State Model", postTrackInAction: async (material, resourceName) =>
            {
                await System.Threading.Tasks.Task.Delay(executionTime);
                return ManualAssembly(lot);
            });

            return lot;
        }

        private async Task<Material> NitrogenEvacCharge(Material lot, decimal speed = 1)
        {
            string resourceName = ResourcePicker("NitrogenEvacCharge");

            int executionTime = Decimal.ToInt32(new Random().Next(30, 120) * 1000 / speed);

            lot = await MaterialTracking(lot, resourceName, "NitrogenEvacCharge", speed, [30, 120], "InduTech State Model", postTrackInAction: async (material, resourceName) =>
            {
                await System.Threading.Tasks.Task.Delay(executionTime);
                return ManualAssembly(lot);
            });

            return lot;
        }

        private async Task<Material> ApplyFoam(Material lot, decimal speed = 1)
        {
            string resourceName = ResourcePicker("ApplyFoam");

            int executionTime = Decimal.ToInt32(new Random().Next(30, 120) * 1000 / speed);

            lot = await MaterialTracking(lot, resourceName, "ApplyFoam", speed, [30, 120], "InduTech State Model",
                postTrackInAction: async (material, resourceName) =>
            {
                await System.Threading.Tasks.Task.Delay(executionTime);
                return ManualAssembly(lot);
            });

            return lot;
        }

        private async Task<Material> FinalWiring(Material lot, decimal speed = 1)
        {
            string resourceName = ResourcePicker("FinalWiring");

            int executionTime = Decimal.ToInt32(new Random().Next(30, 120) * 1000 / speed);

            lot = await MaterialTracking(lot, resourceName, "FinalWiring", speed, [30, 120], "InduTech State Model",
                postTrackInAction: async (material, resource) =>
                {
                    await System.Threading.Tasks.Task.Delay(executionTime);
                    return ManualAssembly(lot);
                });

            return lot;
        }

        private async Task<Material> InstallCoverDoorsFansAndRoof(Material lot, decimal speed = 1)
        {
            string resourceName = ResourcePicker("InstallCoverDoorsFansAndRoof");

            int executionTime = Decimal.ToInt32(new Random().Next(30, 120) * 1000 / speed);

            lot = await MaterialTracking(lot, resourceName, "InstallCoverDoorsFansAndRoof", speed, [30, 120], "InduTech State Model",
                postTrackInAction: async (material, resource) =>
                {
                    await System.Threading.Tasks.Task.Delay(executionTime);
                    return ManualAssembly(lot);
                });

            return lot;
        }

        private async Task<Material> CleanUpAndInspection(Material lot, decimal speed = 1)
        {
            string resourceName = ResourcePicker("CleanUpAndInspection");

            lot = await MaterialTracking(lot, resourceName, "CleanUpAndInspection", speed, [30, 120], "InduTech State Model");

            return lot;
        }

        private async Task<Material> FinalAssemblyWaitForPacking(Material lot, decimal speed = 1)
        {
            int executionTime = Decimal.ToInt32(new Random().Next(30, 120) * 1000 / speed);

            await System.Threading.Tasks.Task.Delay(executionTime);

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

        private async Task<Material> RTUPacking(Material lot, decimal speed = 1)
        {
            string resourceName = ResourcePicker("RTUPacking");

            lot = await MaterialTracking(lot, resourceName, "RTUPacking", speed, [30, 120], "SEMIE10",
                preTrackInAction: (material, resource) =>
                {
                    this.PrepareFeeders(resourceName);
                    return Task.FromResult(material);
                },
                postTrackInAction: async (material, resourceName) =>
                {
                    for (int i = 0; i < material.PrimaryQuantity; i++)
                    {
                        int executionTime = Decimal.ToInt32(Random.Shared.Next(5, 30) * 1000 / speed);

                        await System.Threading.Tasks.Task.Delay(executionTime);

                        material = Retrier(() => new PackMaterialInput()
                        {
                            Parameters = new PackMaterialParameters()
                            {
                                Material = GetMaterialByName(material),
                            }
                        }.PackMaterialSync()).Material;
                    }
                    return material;
                });

            return lot;
        }

        private async Task<Material> RTUFinalPacking(Material lot, decimal speed = 1)
        {
            string resourceName = ResourcePicker("RTUFinalPacking");

            #region Receive
            var flowPath = new GetNextStepsForMaterialsInFacilityInput()
            {
                Facility = new GetObjectByNameInput()
                {
                    Name = "Warehouse InduTech",
                    Type = typeof(Cmf.Navigo.BusinessObjects.Facility)
                }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Facility,
                Materials = [lot]
            }.GetNextStepsForMaterialsInFacilitySync().NextStepsResultsByMaterial.FirstOrDefault().Value.FirstOrDefault().FlowPath;

            lot = new RemoteAndLocalReceiveMaterialsInput()
            {
                Materials = new Dictionary<Material, ReceiveMaterialParameters>() {
                    { lot,
                        new ReceiveMaterialParameters() {
                            FlowPath = flowPath
                        }
                    }
                }
            }.RemoteAndLocalReceiveMaterialsSync().Materials.FirstOrDefault();
            #endregion

            lot = await MaterialTracking(lot, resourceName, "RTUFinalPacking", speed, [30, 120], "SEMIE10",
                postTrackInAction: async (material, resourceName) =>
                {
                    var packingInfo = new GetPackingInformationInput()
                    {
                        IsToLoadMultiLevelPackages = true,
                        IsToResolvePackageLevelsForMaterial = true,
                        Material = material
                    }.GetPackingInformationSync();

                    var productPacking = packingInfo.MultiLevelPackingInformations.FirstOrDefault().PackageProduct;
                    var productMaximumQty = packingInfo.MultiLevelPackingInformations.FirstOrDefault().MaximumQuantity;

                    var materialPackages = GetMaterialPackages(material.Id);

                    var chunks = materialPackages.Chunk((int)productMaximumQty).ToList();

                    var packageParameters = new CreatePackageParametersCollection();
                    chunks.ForEach(chunk => packageParameters.Add(new CreatePackageParameters()
                    {
                        Mode = PackingContentType.Packages,
                        Product = productPacking,
                    }));

                    int executionTime = Decimal.ToInt32(Random.Shared.Next(30, 120) * 1000 / speed);

                    var packages = new CreatePackagesInput()
                    {
                        CreatePackagesParametersCollection = packageParameters
                    }.CreatePackagesSync().Packages;

                    for (int i = 0; i < chunks.Count; i++)
                    {
                        Package[]? chunk = chunks[i];

                        _ = new AddPackagesToPackageInput()
                        {
                            ChildPackages = [.. chunk],
                            Material = material,
                            ParentPackage = packages[i],
                            IgnoreLastServiceId = true
                        }.AddPackagesToPackageSync();
                    }

                    new ClosePackagesInput()
                    {
                        Material = material,
                        PackagesToClose = packages
                    }.ClosePackagesSync();

                    return material;
                });

            return lot;
        }
    }
}