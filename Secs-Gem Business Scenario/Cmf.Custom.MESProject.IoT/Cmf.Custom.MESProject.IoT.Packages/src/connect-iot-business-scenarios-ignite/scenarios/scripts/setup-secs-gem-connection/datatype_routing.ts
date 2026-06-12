import { Cmf } from "cmf-lbos";
import { ScriptScopeBase } from "../types/globals";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class DataTypeRoutingWrapper extends ScriptScopeBase {
    [key: string]: any;

    private datatypeRouting() {
        // PackagePacker: Start of Script
        (async () => {

            // Due to bug in enum handling I have to do this parsing workaround
            this.answers.settingToChange = this.answers.settingToChange.split(" - ")[0].trim();

            const selectedParam: Cmf.Foundation.BusinessObjects.AutomationProtocolParameter = this.answers.automationProtocolParameters.find((param: Cmf.Foundation.BusinessObjects.AutomationProtocolParameter) => param.Name == this.answers.settingToChange)

            switch (selectedParam.DataType) {
                case Cmf.Foundation.BusinessObjects.AutomationDataType.Time:
                case Cmf.Foundation.BusinessObjects.AutomationDataType.Date:
                case Cmf.Foundation.BusinessObjects.AutomationDataType.DateTime:
                    this.answers.paramDatatypeRender = "datetime";
                    break;
                case Cmf.Foundation.BusinessObjects.AutomationDataType.Long:
                case Cmf.Foundation.BusinessObjects.AutomationDataType.Decimal:
                case Cmf.Foundation.BusinessObjects.AutomationDataType.Integer:
                    this.answers.paramDatatypeRender = "number";
                    break;
                case Cmf.Foundation.BusinessObjects.AutomationDataType.Text:
                case Cmf.Foundation.BusinessObjects.AutomationDataType.String:

                    if (selectedParam.EnumValues && selectedParam.EnumValues.length > 0) {
                        this.answers.paramDatatypeRender = "enum";
                        this.answers.paramDatatypeEnum = this.lboUtilities.convertArrayOfStringsToEnum(JSON.parse(selectedParam.EnumValues));
                    } else {
                        this.answers.paramDatatypeRender = "string";
                    }
                    break;
                case Cmf.Foundation.BusinessObjects.AutomationDataType.Binary:
                case Cmf.Foundation.BusinessObjects.AutomationDataType.Boolean:
                    this.answers.paramDatatypeRender = "boolean";
                    break;
                case Cmf.Foundation.BusinessObjects.AutomationDataType.Object:
                    this.answers.paramDatatypeRender = "object";
                    break;
                default:
                    this.answers.paramDatatypeRender = "Data type not supported";
            }

            this.answers.settingNewValue = selectedParam.DefaultValue;
        })();
        // PackagePacker: End of Script
    }
}