using Cmf.Foundation.BusinessObjects;
using Cmf.Foundation.BusinessObjects.QueryObject;
using Cmf.Foundation.BusinessOrchestration;
using Cmf.Foundation.BusinessOrchestration.GenericServiceManagement.InputObjects;
using Cmf.Foundation.BusinessOrchestration.QueryManagement.InputObjects;
using Cmf.Foundation.BusinessOrchestration.QueryManagement.OutputObjects;
using Cmf.Foundation.Common;
using Cmf.Navigo.BusinessObjects;
using Cmf.Navigo.BusinessOrchestration.LaborManagement.InputObjects;
using Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects;
using Cmf.Navigo.BusinessOrchestration.MaterialManagement.OutputObjects;
using Cmf.Navigo.BusinessOrchestration.OrderManagement.InputObjects;
using Cmf.Navigo.BusinessOrchestration.ResourceManagement.InputObjects;
using SharpCompress;
using System.Collections.ObjectModel;
using System.Data;
using Material = Cmf.Navigo.BusinessObjects.Material;

namespace IndustrialEquipmentSimulator
{
    public partial class ScenarioRunner
    {
        private static void CloseProductionOrder(ProductionOrder? productionOrder, decimal materialSumQuantity, bool terminatePO = false)
        {
            var po = new GetObjectByIdInput()
            {
                Id = productionOrder.Id,
                Type = typeof(Cmf.Navigo.BusinessObjects.ProductionOrder)
            }.GetObjectByIdSync().Instance as Cmf.Navigo.BusinessObjects.ProductionOrder;

            if (materialSumQuantity == po.Quantity && po.CompletedQuantity == po.Quantity)
            {
                new CloseProductionOrdersInput()
                {
                    ProductionOrders = [po],
                    TerminateProductionOrders = terminatePO
                }.CloseProductionOrdersSync();

                Console.WriteLine($"Closed PO {productionOrder.Name}");
            }
            else
            {
                new CancelProductionOrdersInput()
                {
                    ProductionOrders = [po],
                    ServiceComments = $"Cancelled by Simulator due to quantity mismatch. Expected: {po.Quantity}, Actual: {materialSumQuantity}"
                }.CancelProductionOrdersSync();
                Console.WriteLine($"Cancelled by Simulator due to quantity mismatch PO {productionOrder.Name}");
            }
        }

        private async Task<Material> MaterialTracking(Material lot, string resourceName, string descriptor, decimal speed, int[] timeRange, string stateModel = "SEMIE10",
            Func<Material, string, Task<Material>> preTrackInAction = null, Func<Material, string, Task<Material>> postTrackInAction = null,
            Func<Material, string, Task<Material>> preTrackOutAction = null, Func<Material, string, Task<Material>> postTrackOutAction = null,
            bool disableTrackin = false, bool disableTrackout = false, double unscheduledDownProbability = 0.01, double engineeringProbability = 0.02)
        {
            if (await this.IsScrapDowntime(resourceName, lot.Name, this._stateModel[stateModel], unscheduledDownProbability, engineeringProbability, speed))
            {
                return null;
            }

            int executionTime = Decimal.ToInt32(new Random().Next(timeRange[0], timeRange?[1] ?? timeRange[0]) * 1000 / speed);

            if (!disableTrackin)
            {
                await System.Threading.Tasks.Task.Delay(executionTime / 4);

                if (preTrackInAction != null)
                {
                    lot = await preTrackInAction(lot, resourceName);
                }

                Console.WriteLine($"Tracking In {descriptor} {lot?.Name}");
                lot = DispatchAndTrackInMaterial(lot, resourceName, this._stateModel[stateModel]);
                Console.WriteLine($"Tracked In {descriptor} {lot?.Name}");

                if (postTrackInAction != null)
                {
                    lot = await postTrackInAction(lot, resourceName);
                }
            }

            if (!disableTrackout)
            {
                await System.Threading.Tasks.Task.Delay(executionTime);

                if (preTrackOutAction != null)
                {
                    lot = await preTrackOutAction(lot, resourceName);
                }

                Console.WriteLine($"Tracking Out {descriptor} {lot?.Name}");

                var nextFlowPath = new GetDataForMultipleTrackOutAndMoveNextWizardInput()
                {
                    Operation = GetDataForTrackOutAndMoveNextOperation.TrackOutAndMoveNext,
                    Materials = [lot]
                }.GetDataForMultipleTrackOutAndMoveNextWizardSync().NextStepsResults.FirstOrDefault().FlowPath;

                lot = TrackOutAndMoveNextMaterial(lot, nextFlowPath, this._stateModel[stateModel]);

                if (postTrackOutAction != null)
                {
                    lot = await postTrackOutAction(lot, resourceName);
                }
                Console.WriteLine($"Tracked Out {descriptor} {lot?.Name}");
            }

            return lot;
        }

        /// <summary>
        /// For now will assume everything is setup - will address raw material change in the future
        ///     Check consumables for quantity and adjust quantity if they are with 100
        /// </summary>
        /// <param name="lot"></param>
        /// <param name="speed"></param>
        /// <returns></returns>
        private void PrepareFeeders(string resourceName)
        {
            var resource = new LoadObjectRelationsInput()
            {
                LevelsToLoad = 1,
                Object = GetResourceByName(resourceName),
                RelationNames = ["SubResource"]
            }.LoadObjectRelationsSync().Object as Resource;

            var feeders = resource.RelationCollection["SubResource"].Cast<SubResource>().Select(x => x.TargetEntity).Where(x => x.Type == "Feeder").ToList();

            for (int i = 0; i < feeders.Count; i++)
            {
                feeders[i] = new LoadObjectRelationsInput()
                {
                    LevelsToLoad = 1,
                    Object = feeders[i],
                    RelationNames = ["MaterialResource"]
                }.LoadObjectRelationsSync().Object as Resource;

                if (!feeders[i].RelationCollection.Any(x => x.Key == "MaterialResource"))
                {
                    throw new Exception($"Please attach consumable to feeder '{feeders[i].Name}'");
                }

                var consumable = feeders[i].RelationCollection["MaterialResource"].Cast<MaterialResource>().FirstOrDefault().SourceEntity;

                if (consumable.PrimaryQuantity < 100)
                {
                    consumable = new ChangeMaterialQuantityInput()
                    {
                        MaterialQuantityChange = new MaterialQuantityChange()
                        {
                            Material = GetMaterialByName(consumable),
                            NewPrimaryQuantity = 10000
                        }
                    }.ChangeMaterialQuantitySync().Material;
                }
            }
        }

        private void ValidateOnlyMaterialsInProcessSameProduct(Material material, string resourceName)
        {
            lock (_trackLock)
            {
                Resource resource = GetResourceByName(resourceName);

                var executeOutput = new ExecuteQueryByNameInput()
                {
                    Name = "GetResourceMaterialsForResourceViewMaterialsAtResource",
                    QueryParameters = new QueryParameterCollection()
                    {
                        new QueryParameter()
                        {
                            Name = "Material_SystemState",
                            Value = new []{2},
                        },
                        new QueryParameter()
                        {
                            Name = "Name",
                            Value = null,
                        },
                        new QueryParameter()
                        {
                            Name = "ResourceId",
                            Value = resource.Id,
                        }
                    }
                }.ExecuteQueryByNameSync();

                DataSet resultDataSet = Utilities.ToDataSet(executeOutput.NgpDataSet);
                if (resultDataSet.Tables.Count > 0)
                {
                    var materials = new MaterialCollection();
                    foreach (DataRow materialRow in resultDataSet.Tables[0].Rows)
                    {
                        Material mat = GetMaterialByName(new Material() { Name = materialRow["Name"] as string });

                        if (mat.Product.Id != material.Product.Id)
                        {
                            materials.Add(GetMaterialByName(mat));
                        }
                    }

                    if (materials.Count > 0)
                    {
                        new AbortMaterialsProcessInput()
                        {
                            Materials = materials,
                            ServiceComments = "Aborted by Simulator"
                        }.AbortMaterialsProcessSync();
                    }
                }
            }
        }

        private void ValidateDurables(Material material, string resourceName)
        {
            lock (_trackLock)
            {
                Resource resource = GetResourceByName(resourceName);
                var getDataToManageDurables = new GetDataToManageDurablesInput()
                {
                    Material = material,
                    Resource = resource
                }.GetDataToManageDurablesSync();

                var currentDurables = getDataToManageDurables.Durables;
                var durableToDetachCollection = new MaterialCollection();
                var durablesToKeepUsing = new MaterialCollection();
                var durableToAttachCollection = new ResourceDurableCollection();

                // iterate through the bom products
                // if there is already a durable do nothing
                foreach (var bomProduct in getDataToManageDurables.DurablesBOM.FirstOrDefault().BomProducts)
                {
                    var alreadHasDurable = false;
                    foreach (var durable in currentDurables)
                    {
                        if (bomProduct.TargetEntity.Name == durable.Product.Name)
                        {
                            alreadHasDurable = true;
                            durablesToKeepUsing.Add(durable);
                        }
                    }
                    if (!alreadHasDurable)
                    {
                        var durableCandidates = GetMaterialForProduct(bomProduct.TargetEntity.Id);
                        durableToAttachCollection.Add(new ResourceDurable()
                        {
                            Position = durableToAttachCollection.Count + 1,
                            TargetEntity = durableCandidates[Random.Shared.Next(durableCandidates.Count)],
                        });
                    }
                }

                durableToDetachCollection.AddRange(currentDurables.Except(durablesToKeepUsing));

                if (durableToDetachCollection.Count > 0 || durableToAttachCollection.Count > 0)
                {

                    new ManageResourceMaterialDurablesInput()
                    {
                        Material = material,
                        Resource = resource,
                        ManageDurables = new ManageResourceDurablesInput()
                        {
                            DurableToDetachCollection = durableToDetachCollection.Count > 0 ? durableToDetachCollection : null,
                            DurableToAttachCollection = durableToAttachCollection.Count > 0 ? durableToAttachCollection : null,
                        }
                    }.ManageResourceMaterialDurablesSync();
                }
            }
        }

        private static List<Material> GetMaterialForProduct(long productId)
        {
            QueryObject query = new QueryObject();
            query.Description = "";
            query.EntityTypeName = "Material";
            query.Name = "GetMaterialForProduct";
            query.Query = new Query();
            query.Query.Distinct = false;
            query.Query.Filters = new FilterCollection() {
                    new Filter()
                    {
                        Name = "Id",
                        ObjectName = "Product",
                        ObjectAlias = "Material_Product_2",
                        Operator = Cmf.Foundation.Common.FieldOperator.IsEqualTo,
                        Value = productId,
                        LogicalOperator = Cmf.Foundation.Common.LogicalOperator.AND,
                        FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.Normal,
                    },
                    new Filter()
                    {
                        Name = "UniversalState",
                        ObjectName = "Material",
                        ObjectAlias = "Material_1",
                        Operator = Cmf.Foundation.Common.FieldOperator.IsEqualTo,
                        Value = Cmf.Foundation.Common.Base.UniversalState.Active,
                        LogicalOperator = Cmf.Foundation.Common.LogicalOperator.Nothing,
                        FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.Normal,
                    },
                    new Filter()
                    {
                        Name = "SystemState",
                        ObjectName = "Material",
                        ObjectAlias = "Material_1",
                        Operator = Cmf.Foundation.Common.FieldOperator.IsEqualTo,
                        Value = MaterialSystemState.Queued,
                        LogicalOperator = Cmf.Foundation.Common.LogicalOperator.Nothing,
                        FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.Normal,
                    }
                };
            query.Query.Fields = new FieldCollection() {
                new Field()
                {
                    Alias = "Id",
                    ObjectName = "Material",
                    ObjectAlias = "Material_1",
                    IsUserAttribute = false,
                    Name = "Id",
                    Position = 0,
                    Sort = Cmf.Foundation.Common.FieldSort.NoSort
                },
                new Field()
                {
                    Alias = "Name",
                    ObjectName = "Material",
                    ObjectAlias = "Material_1",
                    IsUserAttribute = false,
                    Name = "Name",
                    Position = 1,
                    Sort = Cmf.Foundation.Common.FieldSort.NoSort
                }
            };
            query.Query.Relations = new RelationCollection() {
                new Relation()
                {
                    Alias = "",
                    IsRelation = false,
                    Name = "",
                    SourceEntity = "Material",
                    SourceEntityAlias = "Material_1",
                    SourceJoinType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.JoinType.InnerJoin,
                    SourceProperty = "ProductId",
                    TargetEntity = "Product",
                    TargetEntityAlias = "Material_Product_2",
                    TargetJoinType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.JoinType.InnerJoin,
                    TargetProperty = "DefinitionId"
                }
            };

            ExecuteQueryOutput executeOutput = new ExecuteQueryInput
            {
                QueryObject = query
            }.ExecuteQuerySync();

            DataSet resultDataSet = Utilities.ToDataSet(executeOutput.NgpDataSet);
            if (resultDataSet.Tables.Count > 0)
            {
                var materials = new List<Material>();

                foreach (DataRow row in resultDataSet.Tables[0].Rows)
                {
                    materials.Add(new GetObjectByNameInput()
                    {
                        Name = row["Name"] as string,
                        Type = typeof(Cmf.Navigo.BusinessObjects.Material)
                    }.GetObjectByNameSync().Instance as Material);
                }
                return materials;
            }
            return null;
        }

        private static void CheckInOperator(string resourceName, string userAccount, out Resource? resource, out Employee emp)
        {
            lock (_trackLock)
            {
                resource = GetResourceByName(resourceName);
                emp = new GetEmployeeByUserAccountInput()
                {
                    UserAccount = userAccount
                }.GetEmployeeByUserAccountSync().Employee;
                string empName = emp.Name;

                try
                {
                    #region CheckIn Employee

                    resource = new GetCheckedInEmployeesForResourcesInput()
                    {
                        Resources = [resource]
                    }.GetCheckedInEmployeesForResourcesSync().Resources.FirstOrDefault();

                    if (resource.RelationCollection.Count > 0 && resource.RelationCollection["ResourceEmployee"].Count > 0)
                    {
                        var employeeCollection = new EmployeeCollection();
                        var resourceEmployees = resource.RelationCollection["ResourceEmployee"].Cast<ResourceEmployee>();
                        var employeesChekedIn = resource.RelationCollection["ResourceEmployee"].Cast<ResourceEmployee>().Select(x => x.TargetEntity).ToList();

                        var mostRecentEmployee = resourceEmployees.OrderByDescending(re => re.CreatedOn).FirstOrDefault();

                        if (mostRecentEmployee != null)
                        {
                            var now = DateTime.UtcNow;
                            if ((now - mostRecentEmployee.CreatedOn).TotalMinutes <= 10)
                            {
                                Console.WriteLine($"Most recently checked in: {mostRecentEmployee.TargetEntity.Name} at {mostRecentEmployee.CreatedOn}, Let's give him more time  at {resourceName}");
                                emp = mostRecentEmployee.TargetEntity;
                            }
                        }
                        empName = emp.Name;

                        employeeCollection.AddRange(employeesChekedIn.Where(empCI => empCI.Name != empName));
                        if (employeeCollection.Count > 0)
                        {
                            try
                            {
                                Console.WriteLine($"Checking out {string.Join(", ", employeeCollection.Select(x => x.Name))} at {resourceName}");
                                _ = new ManageResourceEmployeesInput()
                                {
                                    ResourceEmployeesToCheckOut = new Dictionary<Resource, EmployeeCollection>()
                                   {
                                       { resource, employeeCollection }
                                   }
                                }.ManageResourceEmployeesSync().Employees;
                                Console.WriteLine($"Checked out {string.Join(", ", employeeCollection.Select(x => x.Name))} at {resourceName}");

                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"Was already checkedout {employeeCollection.Select(x => x.Name)} at {resourceName} - {ex.Message}");
                            }
                        }
                        if (employeesChekedIn.Any(item => item.Name == empName))
                        {
                            return;
                        }
                    }

                    Console.WriteLine($"Checking in {userAccount} at {resourceName}");
                    emp = new ManageResourceEmployeesInput()
                    {
                        ResourceEmployeesToCheckIn = new Dictionary<Employee, CheckInEmployeeParameters>()
                        {
                            { emp, new CheckInEmployeeParameters(){
                                ResourcesCertification = new Dictionary<Resource, Certification>()
                                {
                                    { GetResourceByName(resourceName), null}
                                }
                            } }
                        }
                    }.ManageResourceEmployeesSync().Employees.First();
                    Console.WriteLine($"Checked in {userAccount} at {resourceName}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Something went wrong with the checkin at {resourceName} - {ex.Message}");
                }
            }

            #endregion
        }

        private static void CheckOutOperatorIfNoMaterialsInProcess(string resourceName, string userAccount, out Resource? resource, out Employee emp)
        {
            lock (_trackLock)
            {
                emp = new GetEmployeeByUserAccountInput()
                {
                    UserAccount = userAccount
                }.GetEmployeeByUserAccountSync().Employee;

                #region CheckOut Employee if last Material
                resource = GetResourceByName(resourceName);

                if (resource.MaterialsInProcessCount > 0) { Console.WriteLine($"There are still materials in process at {resourceName}, cannot check out {userAccount}"); return; }

                try
                {
                    Console.WriteLine($"Checking out {userAccount} at {resourceName}");
                    _ = new ManageResourceEmployeesInput()
                    {
                        ResourceEmployeesToCheckOut = new Dictionary<Resource, EmployeeCollection>()
                           {
                               { resource, [emp] }
                           }
                    }.ManageResourceEmployeesSync().Employees;
                    Console.WriteLine($"Checked out {userAccount} at {resourceName}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Was already checked out {userAccount} at {resourceName} - {ex.Message}");
                }

                #endregion
            }
        }

        private static IEnumerable<Material> BatchLifecycle(BatchCollection batches)
        {
            var createBatches = new Collection<object>();
            foreach (var item in batches)
            {
                createBatches.Add(new CreateBatchInput()
                {
                    Batch = item
                });
            }

            #region Create Batch

            Console.WriteLine($"Creating Batches");
            var createdBatches = new BatchExecuteInput()
            {
                Inputs = createBatches
            }.BatchExecuteSync().Outputs.Cast<CreateBatchOutput>().Select(o => o.Batch);

            Console.WriteLine($"Created Batches");

            var batchCollection = new BatchCollection();
            createdBatches.ForEach(batchCollection.Add);
            #endregion

            #region Release Batch
            Console.WriteLine($"Releasing Batches");
            batchCollection = new ReleaseBatchesInput()
            {
                Batches = batchCollection
            }.ReleaseBatchesSync().Batches;
            Console.WriteLine($"Released Batches");
            #endregion

            #region TrackIn Batch
            Console.WriteLine($"Tracking In Batches");
            var batchObjectCollection = new Collection<object>();
            batchCollection.ForEach(b =>
            {
                batchObjectCollection.Add(new TrackInBatchInput()
                {
                    Batch = b
                });
            });

            var batchTrackout = new BatchExecuteInput()
            {
                Inputs = batchObjectCollection
            }.BatchExecuteSync().Outputs.Cast<TrackInBatchOutput>().Select(x => x.Batch);
            Console.WriteLine($"Tracked In Batches");
            #endregion

            #region TrackOut Batch
            Console.WriteLine($"Tracking Out Batches");

            batchObjectCollection = [];
            batchTrackout.ForEach(b =>
            {
                batchObjectCollection.Add(new TrackOutBatchInput()
                {
                    Batch = b
                });
            });

            var materials = Retrier(() => new BatchExecuteInput()
            {
                Inputs = batchObjectCollection
            }.BatchExecuteSync()).Outputs.Cast<TrackOutBatchOutput>().SelectMany(o => o.Materials.Keys);

            Console.WriteLine($"Tracked Out Batches");
            return materials;
            #endregion
        }

        private string ResourcePicker(string stepName)
        {
            var resources = availableResources[stepName];
            var chosenResourceIndex = Random.Shared.Next(resources.Count);
            var resourceName = resources[chosenResourceIndex];
            return resourceName;
        }

        private static List<int> SplitRandomly(int total, int min = 1, int max = 20)
        {
            var random = Random.Shared;
            var result = new List<int>();
            var remaining = total;

            while (remaining > 0)
            {
                var next = random.Next(min, max + 1);

                if (next > remaining)
                    next = remaining;

                result.Add(next);
                remaining -= next;
            }

            return result;
        }

        private async System.Threading.Tasks.Task<MaterialCollection> ProcessPipeline(
            Material initial,
            IReadOnlyList<Func<Material, decimal, Task<object>>> pipeline,
            decimal speed = 1)
        {
            MaterialCollection materials = [initial];

            foreach (var step in pipeline)
            {
                var next = new MaterialCollection();

                foreach (var m in materials)
                {
                    if (m == null)
                    {
                        return null;
                    }
                    var result = await step(m, speed);

                    if (result == null)
                    {
                        return null;
                    }
                    switch (result)
                    {
                        case Material single:
                            next.Add(single);
                            break;

                        case IEnumerable<Material> many:
                            next.AddRange(many);
                            break;

                        default:
                            throw new InvalidOperationException(
                                $"Unsupported pipeline step result: {result?.GetType().Name}");
                    }
                }

                materials = next;
            }

            return materials;
        }

        private async System.Threading.Tasks.Task ProcessPipeline(Material lot, List<Func<Material, decimal, Task<Material>>> pipeline, decimal speed = 1)
        {
            foreach (var step in pipeline)
            {
                if (lot != null)
                {
                    lot = await step(lot, speed);
                }
            }
            Console.WriteLine($"Item {lot?.Name} finished processing.");
        }

        private static Material ManualAssembly(Material lot, bool adjustQuantityForRawMaterials = true)
        {
            lock (_trackLock)
            {
                lot = new GetMaterialBasicInformationInput()
                {
                    Material = lot,
                    LevelsToLoad = 2,
                }.GetMaterialBasicInformationSync().Material;

                var getMaterialBomMaterialsForAssemble = new GetMaterialBomMaterialsForAssembleInput()
                {
                    Material = lot,
                    RelationNames = ["BOMProduct"],
                    Bom = lot.CurrentBOMInstance.BOM,
                    BOMInstance = lot.CurrentBOMInstance,
                    RelationsLevelsToLoad = 1
                }.GetMaterialBomMaterialsForAssembleSync();

                var items = new List<(long BOMProductId, long MaterialId, string MaterialName, decimal PrimaryQuantity)>();
                DataSet resultDataSet = Utilities.ToDataSet(getMaterialBomMaterialsForAssemble.SourceMaterials);
                if (resultDataSet.Tables.Count > 0)
                {
                    foreach (DataRow row in resultDataSet.Tables[0].Rows)
                    {
                        items.Add((
                            BOMProductId: row.Field<long>("BOMProductId"),
                            MaterialId: row.Field<long>("MaterialId"),
                            MaterialName: row.Field<string>("MaterialName"),
                            PrimaryQuantity: row.Field<decimal>("PrimaryQuantity")
                        ));
                    }
                }

                var bomInstanceInformation = new GetBOMInstanceInformationInput()
                {
                    BOMInstance = lot.CurrentBOMInstance,
                }.GetBOMInstanceInformationSync();

                var assembleMaterialCollection = new AssembleMaterialCollection();
                var bomProductInAssembleCollection = new BOMProductInAssembleCollection();
                foreach (var bomInstanceItem in bomInstanceInformation.BOMInstanceItems)
                {
                    Material consumable = null;
                    if (!bomInstanceItem.IsReference ?? false)
                    {
                        consumable = new GetMaterialBasicInformationInput()
                        {
                            Material = new Material()
                            {
                                Id = items.FirstOrDefault(item =>
                                item.BOMProductId == bomInstanceItem.BOMProduct.Id).MaterialId,
                                Name = items.FirstOrDefault(item =>
                                item.BOMProductId == bomInstanceItem.BOMProduct.Id).MaterialName
                            },
                            IsLoadRelationsToContainer = true,
                        }.GetMaterialBasicInformationSync().Material;

                        if (adjustQuantityForRawMaterials && consumable.PrimaryQuantity < 100)
                        {
                            int newQty = 10000;
                            if (consumable?.MaterialContainer?.Count > 0)
                            {
                                var container = new GetObjectByIdInput()
                                {
                                    Id = consumable?.MaterialContainer?.FirstOrDefault()?.TargetEntity?.Id ?? 0,
                                    Type = typeof(Cmf.Navigo.BusinessObjects.Container),

                                }.GetObjectByIdSync().Instance as Container;

                                newQty = (int?)container?.CapacityPerPosition ?? 10;
                            }

                            consumable = new ChangeMaterialQuantityInput()
                            {
                                MaterialQuantityChange = new MaterialQuantityChange()
                                {
                                    Material = consumable,
                                    NewPrimaryQuantity = newQty
                                }
                            }.ChangeMaterialQuantitySync().Material;
                        }

                        assembleMaterialCollection.Add(new AssembleMaterial()
                        {
                            BOMInstanceItem = bomInstanceItem,
                            BOMProduct = bomInstanceItem.BOMProduct,
                            SourceProduct = bomInstanceItem.Product,
                            Material = GetMaterialByName(consumable),
                            Quantity = (decimal)bomInstanceItem.RequiredQuantity
                        });
                    }

                    bomProductInAssembleCollection.Add(new BOMProductInAssemble()
                    {
                        BOMInstanceItem = bomInstanceItem,
                        BOMProduct = bomInstanceItem.BOMProduct,
                        InformationValue = bomInstanceItem.IsReference ?? false ? Guid.NewGuid().ToString() : null
                    });
                }

                lot = Retrier(() => new AssembleMaterialInput()
                {
                    BOMProductsInAssemble = bomProductInAssembleCollection,
                    AssembleQuantity = (decimal)lot.PrimaryQuantity,
                    Material = GetMaterialByName(lot),
                    SourceMaterials = assembleMaterialCollection
                }.AssembleMaterialSync()).Material;

                return lot;
            }
        }

        private async Task<bool> IsScrapDowntime(string resourceName, string materialName, StateModel stateModel, double unscheduledDownProbability, double engineeringDownProbability, decimal speed)
        {
            var resource = GetResourceByName(resourceName);

            try
            {
                var isUnscheduledDown = Random.Shared.NextDouble() < (double)unscheduledDownProbability;
                var isEngineering = Random.Shared.NextDouble() < (double)unscheduledDownProbability;

                int maxAttempts = 100;
                int baseWaitTime = 1000; // milliseconds
                int attempt = 0;
                while (
                    resource.CurrentMainState.CurrentState.Name != "Standby" &&
                    resource.CurrentMainState.CurrentState.Name != "Productive" &&
                    attempt < maxAttempts)
                {
                    int executionTime = Decimal.ToInt32(new Random().Next(60, 200) * baseWaitTime * (attempt + 1) / speed);
                    Console.WriteLine($"Run {materialName} Resource {resourceName} is in {resource.CurrentMainState.CurrentState.Name} so will wait {executionTime} currently on attempt {attempt / maxAttempts}");
                    await System.Threading.Tasks.Task.Delay(executionTime);
                    resource = GetResourceByName(resourceName);
                    attempt++;
                }
                if (
                    resource.CurrentMainState.CurrentState.Name != "Standby" &&
                    resource.CurrentMainState.CurrentState.Name != "Productive")
                {
                    throw new Exception($"Resource {resourceName} did not reach 'Standby' or 'Productive' state after 10 attempts.");
                }

                if (isUnscheduledDown)
                {
                    Console.WriteLine($"Run {materialName} Resource {resourceName} will be changed to UnscheduledDown");
                    var stateModelTransition = stateModel.StateTransitions.Find(sm => sm.Name == $"{resource.CurrentMainState.CurrentState.Name.Replace(" ", "")} to UnscheduledDown");

                    resource = new ComplexLogResourceEventInput()
                    {
                        Resource = GetResourceByName(resourceName),
                        Reason = "UDT",
                        StateModel = stateModel,
                        StateModelTransition = stateModelTransition,
                        IgnoreLastServiceId = true
                    }.ComplexLogResourceEventSync().Resource;

                    if (resource.MaterialsInProcessCount > 0)
                    {
                        var materialsInResource = GetMaterialsInResource(resourceName);
                        var materialLossAndBonusCollection = new Collection<object>();

                        foreach (var material in materialsInResource)
                        {
                            Console.WriteLine($"Run {materialName} Resource {resourceName} will be scrap material {material.Name}");
                            var lossReason = ScenarioRunner.lossReasons[Random.Shared.Next(ScenarioRunner.lossReasons.Length)];
                            materialLossAndBonusCollection.Add(new RecordMaterialLossAndBonusInput()
                            {
                                IgnoreLastServiceId = true,
                                LossReasons =
                                [
                                    new LossBonusAffectedQuantity()
                                {
                                    Reason = new GetObjectByNameInput()
                                    {
                                        Name = lossReason,
                                        Type = typeof(Cmf.Navigo.BusinessObjects.Reason)
                                    }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Reason,
                                    ReasonPrimaryQuantity = material.PrimaryQuantity,
                                }
                                ],
                                BonusReasons = [],
                                Material = material,
                                TerminateOnZeroQuantity = true
                            });
                        }

                        var createdBatches = new BatchExecuteInput()
                        {
                            Inputs = materialLossAndBonusCollection
                        }.BatchExecuteSync().Outputs.Cast<CreateBatchOutput>().Select(o => o.Batch);
                    }

                    // Time in Unscheduled down
                    int executionTime = Decimal.ToInt32(new Random().Next(60, 600) * 1000 / speed);
                    Console.WriteLine($"Run {materialName} Resource {resourceName} will be in UnscheduledDown for {executionTime}");
                    await System.Threading.Tasks.Task.Delay(executionTime);

                    if (resource.CurrentMainState.CurrentState.Name != "Standby")
                    {
                        resource = ChangeToStandby(resourceName, materialName, stateModel);
                    }

                    return true;
                }
                else if (isEngineering)
                {
                    var stateModelTransition = stateModel.StateTransitions.Find(sm => sm.Name == $"{resource.CurrentMainState.CurrentState.Name.Replace(" ", "")} to Standby");
                    if (resource.CurrentMainState.CurrentState.Name != "Standby")
                    {
                        resource = ChangeToStandby(resourceName, materialName, stateModel);
                    }

                    Console.WriteLine($"Run {materialName} Resource {resourceName} will be changed to Engineering");
                    stateModelTransition = stateModel.StateTransitions.Find(sm => sm.Name == $"{resource.CurrentMainState.CurrentState.Name.Replace(" ", "")} to Engineering");

                    resource = new ComplexLogResourceEventInput()
                    {
                        Resource = resource,
                        Reason = "ENG",
                        StateModel = stateModel,
                        StateModelTransition = stateModelTransition,
                        IgnoreLastServiceId = true
                    }.ComplexLogResourceEventSync().Resource;

                    // Time in Unscheduled down
                    int executionTime = Decimal.ToInt32(new Random().Next(30, 100) * 1000 / speed);
                    Console.WriteLine($"Run {materialName} Resource {resourceName} will be in Engineering for {executionTime}");
                    await System.Threading.Tasks.Task.Delay(executionTime);

                    resource = GetResourceByName(resourceName);

                    if (resource.CurrentMainState.CurrentState.Name != "Standby")
                    {
                        resource = ChangeToStandby(resourceName, materialName, stateModel);
                    }
                }
                return false;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Run {materialName} Resource {resourceName} something went wrong {ex.Message}");
                if (resource.CurrentMainState.CurrentState.Name != "Standby")
                {
                    resource = ChangeToStandby(resourceName, materialName, stateModel);
                }
                return false;
            }
        }

        private static Resource ChangeToStandby(string resourceName, string materialName, StateModel stateModel)
        {
            var resource = GetResourceByName(resourceName);
            StateModelTransition? stateModelTransition = stateModel.StateTransitions.Find(sm => sm.Name == $"{resource.CurrentMainState.CurrentState.Name.Replace(" ", "")} to Standby");
            Console.WriteLine($"Run {materialName} Resource {resourceName} will be changed to Standby");
            try
            {
                resource = new ComplexLogResourceEventInput()
                {
                    Resource = resource,
                    Reason = "SBY",
                    StateModel = stateModel,
                    StateModelTransition = stateModelTransition,
                    IgnoreLastServiceId = true
                }.ComplexLogResourceEventSync().Resource;
            }
            catch
            {
                resource = new ComplexLogResourceEventInput()
                {
                    Resource = resource,
                    Reason = "No WIP",
                    StateModel = stateModel,
                    StateModelTransition = stateModelTransition,
                    IgnoreLastServiceId = true
                }.ComplexLogResourceEventSync().Resource;
            }

            return resource;
        }

        private static Material DispatchAndTrackInMaterial(Material? material, string resourceName, StateModel stateModel)
        {
            lock (_trackLock)
            {
                var resource = GetResourceByName(resourceName);
                var stateModelTransition = stateModel.StateTransitions.Find(sm => sm.Name == "Standby to Productive");
                if (resource.CurrentMainState.CurrentState.Name != "Standby")
                {
                    stateModelTransition = null;
                }

                return Retrier(() => new ComplexDispatchAndTrackInMaterialsInput()
                {
                    MaterialCollection = new Dictionary<Material, DispatchMaterialParameters>()
                    {
                        {
                            GetMaterialByName(material), new DispatchMaterialParameters()
                            {
                                Resource = GetResourceByName(resourceName),
                            }
                        }
                    },
                    StateModel = stateModel,
                    StateModelTransition = stateModelTransition,
                    IgnoreLastServiceId = true
                }.ComplexDispatchAndTrackInMaterialsSync()).Materials.First();
            }
        }

        private static Material TrackInMaterial(Material? material, string resourceName, StateModel stateModel)
        {
            lock (_trackLock)
            {
                return Retrier(() => new ComplexTrackInMaterialsInput()
                {
                    Materials =
                     [
                         GetMaterialByName(material)
                     ],
                    Resource = GetResourceByName(resourceName),
                    StateModel = stateModel,
                    StateModelTransition = stateModel.StateTransitions.Find(sm => sm.Name == "Standby to Productive"),
                    IgnoreLastServiceId = true
                }.ComplexTrackInMaterialsSync()).Materials.First();
            }
        }

        private static Material TrackOutAndMoveNextMaterial(Material? material, string nextFlowPath, StateModel stateModel, string resourceName = "")
        {
            lock (_trackLock)
            {
                var stateModelTransition = stateModel.StateTransitions.Find(sm => sm.Name == "Productive to Standby");
                if (GetResourceById(material.LastProcessStepResource.Id).MaterialsInProcessCount != 0)
                {
                    stateModelTransition = null;
                }

                material = Retrier(() => new ComplexTrackOutAndMoveMaterialsToNextStepInput()
                {
                    Materials = new Dictionary<Material, ComplexTrackOutAndMoveNextParameters>()
                    {
                        { GetMaterialByName(material), new ComplexTrackOutAndMoveNextParameters(){ FlowPath = nextFlowPath } }
                    },
                    StateModel = stateModel,
                    StateModelTransition = stateModelTransition,
                    IgnoreLastServiceId = true
                }.ComplexTrackOutAndMoveMaterialsToNextStepSync()).Materials.First().Key;
                return material;
            }
        }

        private static Material TrackOutMaterial(Material? material, StateModel stateModel)
        {
            lock (_trackLock)
            {
                var stateModelTransition = stateModel.StateTransitions.Find(sm => sm.Name == "Productive to Standby");
                if (GetResourceById(material.LastProcessStepResource.Id).MaterialsInProcessCount != 0)
                {
                    stateModelTransition = null;
                }

                material = Retrier(() => new ComplexTrackOutMaterialsInput()
                {
                    Material = new Dictionary<Material, ComplexTrackOutParameters>()
                    {
                        { GetMaterialByName(material), new ComplexTrackOutParameters() }
                    },
                    StateModel = stateModel,
                    StateModelTransition = stateModelTransition,
                    IgnoreLastServiceId = true
                }.ComplexTrackOutMaterialsSync()).Materials.First().Key;
                return material;
            }
        }

        private static T Retrier<T>(Func<T> serviceToCall, int retryCount = 0) where T : BaseOutput
        {
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
                if (ex.Message.Contains("has changed since last viewed") ||
                    ex.Message.Contains("has been changed by another user.") ||
                    ex.Message.Contains("deadlocked on lock resources"))
                {
                    System.Threading.Thread.Sleep(5000);
                    return Retrier(serviceToCall, retryCount + 1);
                }
                else if (ex.Message.Contains("time constraint") || ex.Message.Contains("TimeConstraint"))
                {
                    System.Threading.Thread.Sleep(30000);
                    return Retrier(serviceToCall, retryCount);
                }
                else
                {
                    throw ex;
                }
            }
        }

        private static Cmf.Navigo.BusinessObjects.Product? GetProductByName(string productName)
        {
            return new GetObjectByNameInput()
            {
                Name = productName,
                Type = typeof(Cmf.Navigo.BusinessObjects.Product),
                IgnoreLastServiceId = true
            }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Product;
        }

        private static Cmf.Navigo.BusinessObjects.Product? GetProductById(long productId)
        {
            return new GetObjectByIdInput()
            {
                LevelsToLoad = 1,
                Id = productId,
                Type = typeof(Cmf.Navigo.BusinessObjects.Product),
                IgnoreLastServiceId = true
            }.GetObjectByIdSync().Instance as Cmf.Navigo.BusinessObjects.Product;
        }

        private static Cmf.Navigo.BusinessObjects.Resource? GetResourceById(long resourceId)
        {
            return new GetObjectByIdInput()
            {
                Id = resourceId,
                Type = typeof(Cmf.Navigo.BusinessObjects.Resource),
                IgnoreLastServiceId = true
            }.GetObjectByIdSync().Instance as Cmf.Navigo.BusinessObjects.Resource;
        }

        private static Cmf.Navigo.BusinessObjects.Resource? GetResourceByName(string resourceName, string[] referencesToLoad = null, int levelsToLoad = 1)
        {
            return new GetObjectByNameInput()
            {
                Name = resourceName,
                LevelsToLoad = levelsToLoad,
                ReferencesToLoad = referencesToLoad,
                Type = typeof(Cmf.Navigo.BusinessObjects.Resource),
                IgnoreLastServiceId = true
            }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Resource;
        }

        private static Material? GetMaterialByName(Material? material, string[] referencesToLoad = null)
        {
            material = new GetObjectByNameInput()
            {
                Name = material.Name,
                Type = typeof(Cmf.Navigo.BusinessObjects.Material),
                IgnoreLastServiceId = true
            }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Material;
            return material;
        }

        public static MaterialCollection GetMaterialsByName(IEnumerable<Material> entities, int levelsToLoad = 1)
        {
            Filter nameFilter = new Filter()
            {
                Name = "Name",
                Operator = FieldOperator.In,
                Value = entities.Select(e => e.Name)
            };

            var collection = new MaterialCollection();
            new GetObjectsByFilterInput()
            {
                Type = new Material(),
                LevelsToLoad = levelsToLoad,
                Filter = new FilterCollection() { nameFilter }
            }.GetObjectsByFilterSync().Instance.Cast<Material>().ForEach(collection.Add);
            return collection;
        }

        public static Y GetRelationsObjectsByName<T, Y>(IEnumerable<T> entities, int levelsToLoad = 2)
            where T : EntityRelation
            where Y : IList<T>, new()
        {
            Filter nameFilter = new Filter()
            {
                Name = "Name",
                Operator = FieldOperator.In,
                Value = entities.Select(e => e.Name)
            };

            var collection = new Y();
            new GetObjectsByFilterInput()
            {
                Type = Activator.CreateInstance<T>(),
                LevelsToLoad = levelsToLoad,
                Filter = new FilterCollection() { nameFilter }
            }.GetObjectsByFilterSync().Instance.Cast<T>().ForEach(collection.Add);
            return collection;
        }

        public static Y GetObjectsByName<T, Y>(IEnumerable<T> entities, int levelsToLoad = 1)
            where T : Entity
            where Y : IList<T>, new()
        {
            Filter nameFilter = new Filter()
            {
                Name = "Name",
                Operator = FieldOperator.In,
                Value = entities.Select(e => e.Name)
            };

            var collection = new Y();
            new GetObjectsByFilterInput()
            {
                Type = Activator.CreateInstance<T>(),
                LevelsToLoad = levelsToLoad,
                Filter = new FilterCollection() { nameFilter }
            }.GetObjectsByFilterSync().Instance.Cast<T>().ForEach(collection.Add);
            return collection;
        }

        private static MaterialDefectCollection GetMaterialDefectsByMaterial(Material material, bool load = true)
        {
            MaterialDefectCollection materialDefectCollection = [];

            QueryObject query = new()
            {
                Description = "",
                EntityTypeName = "MaterialDefect",
                Name = "MaterialDefectMaterial",
                Query = new Query()
            };
            query.Query.Distinct = false;
            query.Query.Filters = new FilterCollection() {
                new Filter()
                {
                    Name = "Name",
                    ObjectName = "Material",
                    ObjectAlias = "MaterialDefect_Material_2",
                    Operator = Cmf.Foundation.Common.FieldOperator.IsEqualTo,
                    Value = material.Name,
                    LogicalOperator = Cmf.Foundation.Common.LogicalOperator.Nothing,
                    FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.Normal,
                }
            };
            query.Query.Fields = new FieldCollection() {
                new Field()
                {
                    Alias = "Id",
                    ObjectName = "MaterialDefect",
                    ObjectAlias = "MaterialDefect_1",
                    IsUserAttribute = false,
                    Name = "Id",
                    Position = 0,
                    Sort = Cmf.Foundation.Common.FieldSort.NoSort
                },
                new Field()
                {
                    Alias = "Name",
                    ObjectName = "MaterialDefect",
                    ObjectAlias = "MaterialDefect_1",
                    IsUserAttribute = false,
                    Name = "Name",
                    Position = 1,
                    Sort = Cmf.Foundation.Common.FieldSort.NoSort
                }
            };
            query.Query.Relations = new RelationCollection() {
                new Relation()
                {
                    Alias = "",
                    IsRelation = false,
                    Name = "",
                    SourceEntity = "MaterialDefect",
                    SourceEntityAlias = "MaterialDefect_1",
                    SourceJoinType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.JoinType.InnerJoin,
                    SourceProperty = "MaterialId",
                    TargetEntity = "Material",
                    TargetEntityAlias = "MaterialDefect_Material_2",
                    TargetJoinType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.JoinType.InnerJoin,
                    TargetProperty = "Id"
                }
            };

            var executeInput = new ExecuteQueryInput();
            executeInput.QueryObject = query;
            ExecuteQueryOutput executeOutput = executeInput.ExecuteQuerySync();

            DataSet resultDataSet = Utilities.ToDataSet(executeOutput.NgpDataSet);
            if (resultDataSet.Tables.Count > 0)
            {
                foreach (DataRow materialRow in resultDataSet.Tables[0].Rows)
                {
                    if (load)
                    {
                        materialDefectCollection.Add(new GetObjectByNameInput()
                        {
                            Name = materialRow["Name"] as string,
                            Type = typeof(Cmf.Navigo.BusinessObjects.MaterialDefect)
                        }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.MaterialDefect);
                    }
                    else
                    {
                        materialDefectCollection.Add(new MaterialDefect() { Name = materialRow["Name"] as string, Id = materialRow.Field<long>("Id") });
                    }
                }
            }

            return materialDefectCollection;
        }

        private static void TerminateBoardMaterialsCreatedByMLSimulator()
        {
            QueryObject query = new QueryObject();
            query.Description = "";
            query.EntityTypeName = "Material";
            query.Name = "MaterialsCreatedByMLSimulator";
            query.Query = new Query();
            query.Query.Distinct = false;
            query.Query.Filters = new FilterCollection() {
                new Filter()
                {
                    Name = "UniversalState",
                    ObjectName = "Material",
                    ObjectAlias = "Material_1",
                    Operator = Cmf.Foundation.Common.FieldOperator.IsNotEqualTo,
                    Value = Cmf.Foundation.Common.Base.UniversalState.Terminated,
                    LogicalOperator = Cmf.Foundation.Common.LogicalOperator.AND,
                    FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.Normal,
                },
                new Filter()
                {
                    Name = "Name",
                    ObjectName = "Material",
                    ObjectAlias = "Material_1",
                    Operator = Cmf.Foundation.Common.FieldOperator.Contains,
                    Value = "BRD.",
                    LogicalOperator = Cmf.Foundation.Common.LogicalOperator.Nothing,
                    FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.Normal,
                }
            };
            query.Query.Fields = new FieldCollection() {
                new Field()
                {
                    Alias = "Id",
                    ObjectName = "Material",
                    ObjectAlias = "Material_1",
                    IsUserAttribute = false,
                    Name = "Id",
                    Position = 0,
                    Sort = Cmf.Foundation.Common.FieldSort.NoSort
                },
                new Field()
                {
                    Alias = "Name",
                    ObjectName = "Material",
                    ObjectAlias = "Material_1",
                    IsUserAttribute = false,
                    Name = "Name",
                    Position = 1,
                    Sort = Cmf.Foundation.Common.FieldSort.NoSort
                }
            };
            query.Query.Relations = new RelationCollection();


            ExecuteQueryOutput executeOutput = new ExecuteQueryInput
            {
                QueryObject = query
            }.ExecuteQuerySync();

            DataSet resultDataSet = Utilities.ToDataSet(executeOutput.NgpDataSet);
            if (resultDataSet.Tables.Count > 0)
            {
                var lossreason = new GetObjectByNameInput()
                {
                    Name = "Terminate",
                    Type = typeof(Cmf.Navigo.BusinessObjects.Reason)
                }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Reason;

                var materials = new MaterialCollection();
                foreach (DataRow materialRow in resultDataSet.Tables[0].Rows)
                {
                    Material mat = new() { Name = materialRow["Name"] as string };
                    materials.Add(GetMaterialByName(mat));

                    if (materials.Count == 100)
                    {
                        try
                        {
                            new Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.TerminateMaterialsInput()
                            {
                                Materials = materials,
                                LossReason = lossreason
                            }.TerminateMaterialsSync();
                        }
                        catch (Exception ex)
                        {
                        }
                        materials.Clear();
                    }
                }

                if (materials.Count > 0)
                {
                    try
                    {
                        new Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.TerminateMaterialsInput()
                        {
                            Materials = materials,
                            LossReason = lossreason
                        }.TerminateMaterialsSync();
                    }
                    catch (Exception ex)
                    {
                    }
                }
            }
        }

        private static void TerminatePanelMaterialsCreatedByMLSimulator()
        {
            QueryObject query = new QueryObject();
            query.Description = "";
            query.EntityTypeName = "Material";
            query.Name = "MaterialsCreatedByMLSimulator";
            query.Query = new Query();
            query.Query.Distinct = false;
            query.Query.Filters = new FilterCollection() {
                new Filter()
                {
                    Name = "UniversalState",
                    ObjectName = "Material",
                    ObjectAlias = "Material_1",
                    Operator = Cmf.Foundation.Common.FieldOperator.IsNotEqualTo,
                    Value = Cmf.Foundation.Common.Base.UniversalState.Terminated,
                    LogicalOperator = Cmf.Foundation.Common.LogicalOperator.AND,
                    FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.Normal,
                },
                new Filter()
                {
                    Name = "Name",
                    ObjectName = "Material",
                    ObjectAlias = "Material_1",
                    Operator = Cmf.Foundation.Common.FieldOperator.Contains,
                    Value = "PNL.",
                    LogicalOperator = Cmf.Foundation.Common.LogicalOperator.Nothing,
                    FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.Normal,
                }
            };
            query.Query.Fields = new FieldCollection() {
                new Field()
                {
                    Alias = "Id",
                    ObjectName = "Material",
                    ObjectAlias = "Material_1",
                    IsUserAttribute = false,
                    Name = "Id",
                    Position = 0,
                    Sort = Cmf.Foundation.Common.FieldSort.NoSort
                },
                new Field()
                {
                    Alias = "Name",
                    ObjectName = "Material",
                    ObjectAlias = "Material_1",
                    IsUserAttribute = false,
                    Name = "Name",
                    Position = 1,
                    Sort = Cmf.Foundation.Common.FieldSort.NoSort
                }
            };
            query.Query.Relations = new RelationCollection();


            ExecuteQueryOutput executeOutput = new ExecuteQueryInput
            {
                QueryObject = query
            }.ExecuteQuerySync();

            DataSet resultDataSet = Utilities.ToDataSet(executeOutput.NgpDataSet);
            if (resultDataSet.Tables.Count > 0)
            {
                var lossreason = new GetObjectByNameInput()
                {
                    Name = "Terminate",
                    Type = typeof(Cmf.Navigo.BusinessObjects.Reason)
                }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Reason;

                var materials = new MaterialCollection();
                foreach (DataRow materialRow in resultDataSet.Tables[0].Rows)
                {
                    Material mat = new() { Name = materialRow["Name"] as string };
                    materials.Add(GetMaterialByName(mat));

                    if (materials.Count == 100)
                    {
                        try
                        {
                            new Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.TerminateMaterialsInput()
                            {
                                Materials = materials,
                                LossReason = lossreason
                            }.TerminateMaterialsSync();
                        }
                        catch (Exception ex)
                        {
                        }
                        materials.Clear();
                    }
                }

                if (materials.Count > 0)
                {
                    try
                    {
                        new Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.TerminateMaterialsInput()
                        {
                            Materials = materials,
                            LossReason = lossreason
                        }.TerminateMaterialsSync();
                    }
                    catch (Exception ex)
                    {
                    }
                }
            }
        }

        private static void TerminateLotMaterialsCreatedByMLSimulator()
        {
            QueryObject query = new QueryObject();
            query.Description = "";
            query.EntityTypeName = "Material";
            query.Name = "MaterialsCreatedByMLSimulator";
            query.Query = new Query();
            query.Query.Distinct = false;
            query.Query.Filters = new FilterCollection() {
                new Filter()
                {
                    Name = "UniversalState",
                    ObjectName = "Material",
                    ObjectAlias = "Material_1",
                    Operator = Cmf.Foundation.Common.FieldOperator.IsNotEqualTo,
                    Value = Cmf.Foundation.Common.Base.UniversalState.Terminated,
                    LogicalOperator = Cmf.Foundation.Common.LogicalOperator.AND,
                    FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.Normal,
                },
                new Filter()
                {
                    Name = "Name",
                    ObjectName = "Material",
                    ObjectAlias = "Material_1",
                    Operator = Cmf.Foundation.Common.FieldOperator.Contains,
                    Value = "Lot-",
                    LogicalOperator = Cmf.Foundation.Common.LogicalOperator.Nothing,
                    FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.Normal,
                }
            };
            query.Query.Fields = new FieldCollection() {
                new Field()
                {
                    Alias = "Id",
                    ObjectName = "Material",
                    ObjectAlias = "Material_1",
                    IsUserAttribute = false,
                    Name = "Id",
                    Position = 0,
                    Sort = Cmf.Foundation.Common.FieldSort.NoSort
                },
                new Field()
                {
                    Alias = "Name",
                    ObjectName = "Material",
                    ObjectAlias = "Material_1",
                    IsUserAttribute = false,
                    Name = "Name",
                    Position = 1,
                    Sort = Cmf.Foundation.Common.FieldSort.NoSort
                }
            };
            query.Query.Relations = new RelationCollection();


            ExecuteQueryOutput executeOutput = new ExecuteQueryInput
            {
                QueryObject = query
            }.ExecuteQuerySync();

            DataSet resultDataSet = Utilities.ToDataSet(executeOutput.NgpDataSet);
            if (resultDataSet.Tables.Count > 0)
            {
                var lossreason = new GetObjectByNameInput()
                {
                    Name = "Terminate",
                    Type = typeof(Cmf.Navigo.BusinessObjects.Reason)
                }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Reason;

                var materials = new MaterialCollection();
                foreach (DataRow materialRow in resultDataSet.Tables[0].Rows)
                {
                    Material mat = new() { Name = materialRow["Name"] as string };
                    materials.Add(GetMaterialByName(mat));

                    if (materials.Count == 100)
                    {
                        try
                        {
                            new Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.TerminateMaterialsInput()
                            {
                                Materials = materials,
                                LossReason = lossreason
                            }.TerminateMaterialsSync();
                        }
                        catch (Exception ex)
                        {
                        }
                        materials.Clear();
                    }
                }

                if (materials.Count > 0)
                {
                    try
                    {
                        new Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.TerminateMaterialsInput()
                        {
                            Materials = materials,
                            LossReason = lossreason
                        }.TerminateMaterialsSync();
                    }
                    catch (Exception ex)
                    {
                    }
                }
            }
        }

        private static void TerminatePOsCreatedByMLSimulator()
        {
            QueryObject query = new QueryObject();
            query.Description = "";
            query.EntityTypeName = "ProductionOrder";
            query.Name = "ProductionOrderCreatedByMLSimulator";
            query.Query = new Query();
            query.Query.Distinct = false;
            query.Query.Filters = new FilterCollection() {
    new Filter()
    {
        Name = "Name",
        ObjectName = "ProductionOrder",
        ObjectAlias = "ProductionOrder_1",
        Operator = Cmf.Foundation.Common.FieldOperator.Contains,
        Value = "Demo-PO-",
        LogicalOperator = Cmf.Foundation.Common.LogicalOperator.AND,
        FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.Normal,
    },
    new Filter()
    {
        Name = "UniversalState",
        ObjectName = "ProductionOrder",
        ObjectAlias = "ProductionOrder_1",
        Operator = Cmf.Foundation.Common.FieldOperator.IsNotEqualTo,
        Value = Cmf.Foundation.Common.Base.UniversalState.Terminated,
        LogicalOperator = Cmf.Foundation.Common.LogicalOperator.Nothing,
        FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.Normal,
    }
};
            query.Query.Fields = new FieldCollection() {
    new Field()
    {
        Alias = "Id",
        ObjectName = "ProductionOrder",
        ObjectAlias = "ProductionOrder_1",
        IsUserAttribute = false,
        Name = "Id",
        Position = 0,
        Sort = Cmf.Foundation.Common.FieldSort.NoSort
    },
    new Field()
    {
        Alias = "Name",
        ObjectName = "ProductionOrder",
        ObjectAlias = "ProductionOrder_1",
        IsUserAttribute = false,
        Name = "Name",
        Position = 1,
        Sort = Cmf.Foundation.Common.FieldSort.NoSort
    }
};
            query.Query.Relations = new RelationCollection();

            ExecuteQueryOutput executeOutput = new ExecuteQueryInput
            {
                QueryObject = query
            }.ExecuteQuerySync();

            DataSet resultDataSet = Utilities.ToDataSet(executeOutput.NgpDataSet);
            if (resultDataSet.Tables.Count > 0)
            {
                var lossreason = new GetObjectByNameInput()
                {
                    Name = "Terminate",
                    Type = typeof(Cmf.Navigo.BusinessObjects.Reason)
                }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Reason;

                foreach (DataRow poRow in resultDataSet.Tables[0].Rows)
                {
                    try
                    {
                        var productionOrder = new GetObjectByNameInput()
                        {
                            Name = poRow["Name"] as string,
                            Type = typeof(Cmf.Navigo.BusinessObjects.ProductionOrder)
                        }.GetObjectByNameSync().Instance as ProductionOrder;

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

        private static List<Package> GetMaterialPackages(long materialId)
        {
            QueryObject query = new QueryObject();
            query.Description = "";
            query.EntityTypeName = "Package";
            query.Name = "GetMaterialPackages";
            query.Query = new Query();
            query.Query.Distinct = false;
            query.Query.Filters = new FilterCollection() {
                new Filter()
                {
                    Name = "Id",
                    ObjectName = "Material",
                    ObjectAlias = "Package_Material_2",
                    Operator = Cmf.Foundation.Common.FieldOperator.IsEqualTo,
                    Value = materialId,
                    LogicalOperator = Cmf.Foundation.Common.LogicalOperator.Nothing,
                    FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.Normal,
                }
            };
            query.Query.Fields = new FieldCollection() {
                new Field()
                {
                    Alias = "Id",
                    ObjectName = "Package",
                    ObjectAlias = "Package_1",
                    IsUserAttribute = false,
                    Name = "Id",
                    Position = 0,
                    Sort = Cmf.Foundation.Common.FieldSort.NoSort
                },
                new Field()
                {
                    Alias = "Name",
                    ObjectName = "Package",
                    ObjectAlias = "Package_1",
                    IsUserAttribute = false,
                    Name = "Name",
                    Position = 1,
                    Sort = Cmf.Foundation.Common.FieldSort.NoSort
                }
            };
            query.Query.Relations = new RelationCollection() {
                new Relation()
                {
                    Alias = "",
                    IsRelation = false,
                    Name = "",
                    SourceEntity = "Package",
                    SourceEntityAlias = "Package_1",
                    SourceJoinType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.JoinType.InnerJoin,
                    SourceProperty = "MaterialId",
                    TargetEntity = "Material",
                    TargetEntityAlias = "Package_Material_2",
                    TargetJoinType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.JoinType.InnerJoin,
                    TargetProperty = "Id"
                }
            };

            ExecuteQueryOutput executeOutput = new ExecuteQueryInput
            {
                QueryObject = query
            }.ExecuteQuerySync();

            DataSet resultDataSet = Utilities.ToDataSet(executeOutput.NgpDataSet);
            if (resultDataSet.Tables.Count > 0)
            {
                var packagesCollection = new List<Package>();

                foreach (DataRow row in resultDataSet.Tables[0].Rows)
                {
                    packagesCollection.Add(new GetObjectByNameInput()
                    {
                        Name = row["Name"] as string,
                        Type = typeof(Cmf.Navigo.BusinessObjects.Package)
                    }.GetObjectByNameSync().Instance as Package);
                }

                return packagesCollection;
            }
            return null;
        }

        private static MaterialCollection GetMaterialsInResource(string resource)
        {
            QueryObject query = new QueryObject();
            query.Description = "";
            query.EntityTypeName = "Resource";
            query.Name = "MaterialsInResource";
            query.Query = new Query();
            query.Query.Distinct = false;
            query.Query.Filters = new FilterCollection() {
                new Filter()
                {
                    ObjectName = "Material",
                    ObjectAlias = "Resource_MaterialResource_SourceEntity_3",
                    Value = null,
                    LogicalOperator = Cmf.Foundation.Common.LogicalOperator.AND,
                    FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.AlwaysTrue,
                },
                new Filter()
                {
                    Name = "SystemState",
                    ObjectName = "Material",
                    ObjectAlias = "Resource_MaterialResource_SourceEntity_3",
                    Operator = Cmf.Foundation.Common.FieldOperator.IsEqualTo,
                    Value = Cmf.Navigo.BusinessObjects.MaterialSystemState.InProcess,
                    LogicalOperator = Cmf.Foundation.Common.LogicalOperator.AND,
                    FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.Normal,
                },
                new Filter()
                {
                    Name = "Name",
                    ObjectName = "Resource",
                    ObjectAlias = "Resource_1",
                    Operator = Cmf.Foundation.Common.FieldOperator.Contains,
                    Value = "PUNCH#01",
                    LogicalOperator = Cmf.Foundation.Common.LogicalOperator.Nothing,
                    FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.Normal,
                }
            };
            query.Query.Fields = new FieldCollection() {
                new Field()
                {
                    Alias = "Id",
                    ObjectName = "Resource",
                    ObjectAlias = "Resource_1",
                    IsUserAttribute = false,
                    Name = "Id",
                    Position = 0,
                    Sort = Cmf.Foundation.Common.FieldSort.NoSort
                },
                new Field()
                {
                    Alias = "Name",
                    ObjectName = "Resource",
                    ObjectAlias = "Resource_1",
                    IsUserAttribute = false,
                    Name = "Name",
                    Position = 1,
                    Sort = Cmf.Foundation.Common.FieldSort.NoSort
                },
                new Field()
                {
                    Alias = "MaterialResourceSourceEntityName",
                    ObjectName = "Material",
                    ObjectAlias = "Resource_MaterialResource_SourceEntity_3",
                    IsUserAttribute = false,
                    Name = "Name",
                    Position = 2,
                    Sort = Cmf.Foundation.Common.FieldSort.NoSort
                }
            };
            query.Query.Relations = new RelationCollection() {
                new Relation()
                {
                    Alias = "Resource_MaterialResource_2",
                    IsRelation = true,
                    Name = "MaterialResource",
                    SourceEntity = "Material",
                    SourceEntityAlias = "Resource_MaterialResource_SourceEntity_3",
                    SourceJoinType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.JoinType.InnerJoin,
                    SourceProperty = "Id",
                    TargetEntity = "Resource",
                    TargetEntityAlias = "Resource_1",
                    TargetJoinType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.JoinType.InnerJoin,
                    TargetProperty = "Id"
                }
            };

            ExecuteQueryOutput executeOutput = new ExecuteQueryInput
            {
                QueryObject = query
            }.ExecuteQuerySync();

            DataSet resultDataSet = Utilities.ToDataSet(executeOutput.NgpDataSet);
            if (resultDataSet.Tables.Count > 0)
            {
                var materialCollection = new List<Material>();

                foreach (DataRow row in resultDataSet.Tables[0].Rows)
                {
                    materialCollection.Add(new Material() { Name = row["MaterialResourceSourceEntityName"] as string });
                }

                return GetMaterialsByName(materialCollection);
            }
            return null;
        }

        private static void LogWithGuid(string message)
        {
            var shortGuid = Guid.NewGuid().ToString("N")[..8];
            var timestamp = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss.fff");
            Console.WriteLine($"[{shortGuid}] [{timestamp}] {message}");
        }
    }
}