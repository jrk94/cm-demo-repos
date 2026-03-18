using Cmf.Foundation.BusinessObjects;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Xml.Linq;

namespace Cmf.Custom.Demo.Actions.Demo
{
    internal class SendMessageToInstance : DeeDevBase
    {
        public override Dictionary<string, object> DeeActionCode(Dictionary<string, object> Input)
        {
            //---Start DEE Code--- 
            UseReference("Cmf.Foundation.BusinessObjects.dll", "Cmf.Foundation.BusinessObjects");
            UseReference("Cmf.Foundation.BusinessOrchestration.dll", "");
            UseReference("", "Cmf.Foundation.Common.Exceptions");
            UseReference("", "Cmf.Foundation.Common");
            UseReference("Cmf.Navigo.BusinessObjects.dll", "Cmf.Navigo.BusinessObjects");
            UseReference("Newtonsoft.Json.dll", "Newtonsoft.Json.Linq");
            UseReference("%MicrosoftNetPath%Microsoft.CSharp.dll", "");

            var serviceProvider = (IServiceProvider)Input["ServiceProvider"];
            long.TryParse(Input.TryGetValue("AutomationControllerInstanceId", out var valueACIID) ? valueACIID?.ToString() ?? string.Empty : string.Empty, out long aciId);
            var message = Input.TryGetValue("Message", out var valueMessage) ? valueMessage?.ToString() ?? string.Empty : string.Empty;
            var sessionId = Input.TryGetValue("SessionId", out var valueSession) ? valueSession?.ToString() ?? string.Empty : string.Empty;

            AutomationControllerInstance aci = serviceProvider.GetService<IAutomationControllerInstance>();
            aci.Load(aciId);

            var request =
                JObject.FromObject(
                    new
                    {
                        Prompt = message,
                        SessionId = sessionId
                    }
                );

            dynamic reply = aci.SendRequest("Cmf.Agent.Query", request, 100000);
            Input["Reply"] = reply;

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
