using System.Collections.Generic;

namespace Cmf.Custom.Demo.Actions.Demo
{
    internal class DemoDee : DeeDevBase
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
