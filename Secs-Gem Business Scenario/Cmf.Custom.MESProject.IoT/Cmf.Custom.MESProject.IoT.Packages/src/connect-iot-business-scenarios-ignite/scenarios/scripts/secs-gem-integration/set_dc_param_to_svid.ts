import { Cmf } from "cmf-lbos";
import { EventMapping, ScriptScopeBase } from "../types/globals";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class SetDCParamToSVIDWrapper extends ScriptScopeBase {
    [key: string]: any;

    private setDCParamToSVID() {
        // PackagePacker: Start of Script
        (async () => {
            const eventMapping = (this.answers.eventMapping as EventMapping).get(this.answers.eventCEID);
            const reportIdAndSvidIndex = eventMapping?.rptidAndSvidList.findIndex(item => item.rptid === this.answers.rptid)
            const svid = eventMapping?.rptidAndSvidList[reportIdAndSvidIndex]?.svidList.get(this.answers.svid);

            const getObjectByNameInput =
                new Cmf.Foundation.BusinessOrchestration.GenericServiceManagement.InputObjects.GetObjectByNameInput();
            getObjectByNameInput.Name = this.answers.dcParameter.Name;
            getObjectByNameInput.Type = "Cmf.Navigo.BusinessObjects.Parameter";

            const getObjectByNameOutput = await this.System.call(getObjectByNameInput) as Cmf.Foundation.BusinessOrchestration.GenericServiceManagement.OutputObjects.GetObjectByNameOutput;

            svid.parameter = getObjectByNameOutput.Instance;
            eventMapping?.rptidAndSvidList[reportIdAndSvidIndex]?.svidList.set(this.answers.svid, svid);
        })();
        // PackagePacker: End of Script
    }
}