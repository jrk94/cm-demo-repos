using System;
using System.Collections.Generic;

namespace Cmf.Custom.Demo.Actions.Demo
{
    internal class LoadMaterials : DeeDevBase
    {
        public override Dictionary<string, object> DeeActionCode(Dictionary<string, object> Input)
        {
            //---Start DEE Code--- 

            UseReference("Cmf.Foundation.BusinessObjects.dll", "Cmf.Foundation.BusinessObjects");
            UseReference("Cmf.Foundation.BusinessOrchestration.dll", "");
            UseReference("", "Cmf.Foundation.Common.Exceptions");
            UseReference("", "System.Linq");
            UseReference("Cmf.Navigo.BusinessObjects.dll", "Cmf.Navigo.BusinessObjects");
            UseReference("Newtonsoft.Json.dll", "Newtonsoft.Json.Linq");
            UseReference("%MicrosoftNetPath%Microsoft.CSharp.dll", "");

            var serviceProvider = (IServiceProvider)Input["ServiceProvider"];

            if (Input.ContainsKey("ComplexTrackInMaterialsInput"))
            {
                (Input["ComplexTrackInMaterialsInput"] as Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.ComplexTrackInMaterialsInput).Materials.Load();
                (Input["ComplexTrackInMaterialsInput"] as Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.ComplexTrackInMaterialsInput).Resource.Load();
            }
            else
            if (Input.ContainsKey("ComplexTrackInMaterialInput"))
            {
                (Input["ComplexTrackInMaterialInput"] as Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.ComplexTrackInMaterialInput).Material.Load();
                (Input["ComplexTrackInMaterialInput"] as Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.ComplexTrackInMaterialInput).Resource.Load();
            }
            else
            if (Input.ContainsKey("ComplexTrackOutMaterialInput"))
            {
                (Input["ComplexTrackOutMaterialInput"] as Cmf.Navigo.BusinessOrchestration.MaterialManagement.InputObjects.ComplexTrackOutMaterialInput).Material.Load();
            }
            //---End DEE Code---

            return Input;
        }

        public override bool DeeTestCondition(Dictionary<string, object> Input)
        {
            //---Start DEE Condition Code---

            #region Info

            /* Description:
             *  
             * Action Groups:
             *    N/A
             *     
            */

            #endregion

            return true;

            //---End DEE Condition Code---
        }
    }
}
