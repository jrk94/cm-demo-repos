import { Cmf } from "cmf-lbos";
import { ScriptScopeBase } from "../types/globals";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class SetProtocolParamWrapper extends ScriptScopeBase {
    [key: string]: any;

    private setProtocolParam() {
        // PackagePacker: Start of Script
        (async () => {

            const index: number = this.answers.automationProtocolParameters.findIndex((param: Cmf.Foundation.BusinessObjects.AutomationProtocolParameter) => param.Name == this.answers.settingToChange)

            this.answers.automationProtocolParameters[index].DefaultValue = this.answers.settingNewValue;
            this.answers.automationProtocolParametersEnum.find((param: any) => param.Id == this.answers.settingToChange).Name = `${this.answers.settingToChange} - ${this.answers.settingNewValue?.toString() ?? ""} - ${this.answers.automationProtocolParameters[index].Description}`;
        })();
        // PackagePacker: End of Script
    }
}