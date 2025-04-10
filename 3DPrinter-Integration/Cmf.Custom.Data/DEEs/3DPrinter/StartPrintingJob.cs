using System.Collections.Generic;

namespace Cmf.Custom.Demo.Actions.Demo
{
    internal class StartPrintingJobDee : DeeDevBase
    {
        public override Dictionary<string, object> DeeActionCode(Dictionary<string, object> Input)
        {
            //---Start DEE Code--- 

            //---End DEE Code---

            return Input;
        }

        public override bool DeeTestCondition(Dictionary<string, object> Input)
        {
            //---Start DEE Condition Code---

            #region Info

            /// <summary>
            /// Summary text
            ///     Start Printing Job - Will validate the Recipe, Start Printing Job and send BOM information
            ///	Assumptions:
            /// Action Groups:
            ///     MaterialManagement.MaterialManagement.TrackInMaterials.Pre
            ///     MaterialManagement.MaterialManagement.TrackInMaterials.Post
            /// Depends On:
            /// Is Dependency For:
            /// Exceptions:
            /// </summary>

            #endregion Info

            // System
            UseReference("", "System.Data");
            UseReference("Newtonsoft.Json.dll", "Newtonsoft.Json.Linq");
            UseReference("%MicrosoftNetPath%Microsoft.CSharp.dll", "");

            // Foundation
            UseReference("Cmf.Foundation.BusinessObjects.dll", "Cmf.Foundation.BusinessObjects");
            UseReference("Cmf.Foundation.BusinessOrchestration.dll", "");
            UseReference("", "Cmf.Foundation.Common.Exceptions");
            UseReference("", "Cmf.Foundation.Common");

            // Navigo
            UseReference("Cmf.Navigo.BusinessObjects.dll", "Cmf.Navigo.BusinessObjects");
            UseReference("Cmf.Navigo.BusinessObjects.dll", "Cmf.Navigo.BusinessOrchestration.Abstractions");
            UseReference("Cmf.Navigo.BusinessOrchestration.dll", "Cmf.Navigo.BusinessOrchestration.ResourceManagement.InputObjects");

            // Intercept Transaction input
            var serviceProvider = (IServiceProvider)Input["ServiceProvider"];
            var trackInMaterialsInput = Input["TrackInMaterialsInput"] as Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.TrackInMaterialsInput;

            var resource = trackInMaterialsInput.Resource;
            var instance = resource.GetAutomationControllerInstance(); // Retrieve automation instance

            // Our Code will only apply to
            //  - resources of Resource Type "3d Printer"
            //  - that have an automation instance
            if (resource.ResourceType == "3d Printer" && instance != null)
            {

                // Code to be executed on before the Track-In
                if (Input["ActionGroupName"].ToString().Contains("Pre"))
                {
                    var data = new
                    {
                        material = trackInMaterialsInput.Materials.FirstOrDefault().Name,
                        recipe = trackInMaterialsInput.Recipe.ResourceRecipeName,
                        recipeHash = trackInMaterialsInput.Recipe.BodyChecksum
                    };

                    // Validate Recipe - If successful recipeValidationResult will be true
                    dynamic reply = instance.SendRequest("ValidateRecipe", Newtonsoft.Json.JsonConvert.SerializeObject(data), 10000);

                    if ((bool)reply.recipeValidationResult)
                    {
                        // Start Printing Job
                        instance.SendRequest("OnTrackIn", Newtonsoft.Json.JsonConvert.SerializeObject(data), 10000);
                    }
                    else
                    {
                        throw new Exception("Invalid Recipe");
                    }
                }
                else
                {
                    // Get Resource Current State
                    resource.Load();
                    // Retrieve BOM (bill of materials)
                    var bom = resource.CurrentBOM;
                    if (bom != null)
                    {

                        string feederMaterial;
                        string feederMaterialProduct;

                        var material = trackInMaterialsInput.Materials.FirstOrDefault();

                        #region Retrieve Feeder Material

                        // For Resource ResourceType "3d Printer" we will only have one consumable feed with one material
                        IResourceOrchestration resourceOrchestration = ApplicationContext.CurrentServiceProvider.GetService<IResourceOrchestration>();
                        var consumables = resourceOrchestration.GetConsumableFeeds(new GetConsumableFeedsInput()
                        {
                            OnlyFirstMaterials = true,
                            Resource = resource
                        });

                        DataSet ds = NgpDataSet.ToDataSet(consumables.ConsumableFeeds);
                        if (HasData(ds))
                        {
                            if (ds.Tables[0].Rows.Count > 1)
                            {
                                throw new Exception("Only one feeder is supported for 3D Printer");
                            }
                            var row = ds.Tables[0].Rows[0];
                            feederMaterial = row.Field<string>("SubResourceTargetEntityMaterialResourceSourceEntityName");
                            feederMaterialProduct = row.Field<string>("SubResourceTargetEntityMaterialResourceSourceEntityProductName");
                        }
                        else
                        {
                            throw new Exception("Please attach a Material to the Consumable Feeder");
                        }

                        #endregion

                        // Retrieve BOM Products
                        bom.Load();
                        bom.LoadBomProducts(material.Step, material.LogicalFlowPath);
                        var data = new
                        {
                            BOMProduct = bom.BomProducts.FirstOrDefault().Name,
                            BOMName = bom.Name,
                            feederMaterial = feederMaterial,
                            feederMaterialProduct = feederMaterialProduct
                        };

                        instance.SendRequest("BOMData", Newtonsoft.Json.JsonConvert.SerializeObject(data), 10000);
                    }
                    else
                    {
                        throw new Exception("Missing Mandatory BOM");
                    }
                }
            }

            static bool HasData(DataSet ds)
            {
                return ds != null && ds.Tables != null && ds.Tables.Count > 0 && ds.Tables[0].Rows != null && ds.Tables[0].Rows.Count > 0;
            }

            //---End DEE Condition Code---
            return true;
        }
    }
}
