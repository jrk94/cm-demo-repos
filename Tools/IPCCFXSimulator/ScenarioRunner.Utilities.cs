using Cmf.Foundation.BusinessObjects;
using Cmf.Foundation.BusinessObjects.QueryObject;
using Cmf.Foundation.BusinessOrchestration;
using Cmf.Foundation.BusinessOrchestration.GenericServiceManagement.InputObjects;
using Cmf.Foundation.BusinessOrchestration.QueryManagement.InputObjects;
using Cmf.Foundation.BusinessOrchestration.QueryManagement.OutputObjects;
using Cmf.Navigo.BusinessObjects;
using Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects;
using System.Data;

namespace IPCCFXSimulator
{
    public partial class ScenarioRunner
    {
        private static Material DispatchAndTrackInMaterial(Material? material, string resourceName, StateModel stateModel)
        {
            lock (_trackLock)
            {
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
                    StateModelTransition = stateModel.StateTransitions.Find(sm => sm.Name == "Standby to Productive"),
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

        private static Material TrackOutAndMoveNextMaterial(Material? material, string nextFlowPath, StateModel stateModel)
        {
            lock (_trackLock)
            {
                material = Retrier(() => new ComplexTrackOutAndMoveMaterialsToNextStepInput()
                {
                    Materials = new Dictionary<Material, ComplexTrackOutAndMoveNextParameters>()
                    {
                        { GetMaterialByName(material), new ComplexTrackOutAndMoveNextParameters(){ FlowPath = nextFlowPath } }
                    },
                    StateModel = stateModel,
                    StateModelTransition = stateModel.StateTransitions.Find(sm => sm.Name == "Productive to Standby"),
                    IgnoreLastServiceId = true
                }.ComplexTrackOutAndMoveMaterialsToNextStepSync()).Materials.First().Key;
                return material;
            }
        }

        private static Material TrackOutMaterial(Material? material, StateModel stateModel)
        {
            lock (_trackLock)
            {
                material = Retrier(() => new ComplexTrackOutMaterialsInput()
                {
                    Material = new Dictionary<Material, ComplexTrackOutParameters>()
                    {
                        { GetMaterialByName(material), new ComplexTrackOutParameters() }
                    },
                    StateModel = stateModel,
                    StateModelTransition = stateModel.StateTransitions.Find(sm => sm.Name == "Productive to Standby"),
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
                    ex.Message.Contains("deadlocked on lock resources"))
                {
                    System.Threading.Thread.Sleep(5000);
                    return Retrier(serviceToCall, retryCount + 1);
                }
                else
                {
                    throw ex;
                }
            }
        }

        private static Cmf.Navigo.BusinessObjects.Resource? GetResourceByName(string resourceName)
        {
            return new GetObjectByNameInput()
            {
                Name = resourceName,
                Type = typeof(Cmf.Navigo.BusinessObjects.Resource),
                IgnoreLastServiceId = true
            }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Resource;
        }

        private static Material? GetMaterialByName(Material? panel)
        {
            panel = new GetObjectByNameInput()
            {
                Name = panel.Name,
                Type = typeof(Cmf.Navigo.BusinessObjects.Material),
                IgnoreLastServiceId = true
            }.GetObjectByNameSync().Instance as Cmf.Navigo.BusinessObjects.Material;
            return panel;
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
    }
}