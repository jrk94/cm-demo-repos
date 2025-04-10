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

            UseReference("Cmf.Foundation.BusinessObjects.dll", "Cmf.Foundation.BusinessObjects");
            UseReference("Cmf.Foundation.BusinessOrchestration.dll", "");
            UseReference("", "Cmf.Foundation.Common.Exceptions");
            UseReference("", "System.Linq");
            UseReference("Cmf.Navigo.BusinessObjects.dll", "Cmf.Navigo.BusinessObjects");
            UseReference("Newtonsoft.Json.dll", "Newtonsoft.Json.Linq");
            UseReference("%MicrosoftNetPath%Microsoft.CSharp.dll", "");

            var serviceProvider = (IServiceProvider)Input["ServiceProvider"];

            if (Input.ContainsKey("TrackOutMaterialInput"))
            {
                (Input["TrackOutMaterialInput"] as Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.TrackOutMaterialInput).Material.Load();
            }
            else
            if (Input.ContainsKey("CombineMaterialInput"))
            {

                var input = (Input["CombineMaterialInput"] as Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.CombineMaterialInput);

                input.Material.Load();

                foreach (var cbsm in input.CombineSourceMaterials)
                {
                    cbsm.Material.Load();
                }
                Input["CombineMaterialInput"] = input;
            }
            else
            if (Input.ContainsKey("AssembleMaterialInput"))
            {

                var input = (Input["AssembleMaterialInput"] as Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.AssembleMaterialInput);

                input.Material.Load();

                foreach (var sm in input.SourceMaterials)
                {
                    sm.Material.Load();
                    sm.BOMProduct.SourceEntity.Load();
                    sm.BOMProduct.TargetEntity.Load();
                    sm.BOMProduct.Load();
                    sm.SourceProduct.Load();
                }
                Input["AssembleMaterialInput"] = input;
            }

            //---End DEE Condition Code---
            return true;
        }
    }
}
