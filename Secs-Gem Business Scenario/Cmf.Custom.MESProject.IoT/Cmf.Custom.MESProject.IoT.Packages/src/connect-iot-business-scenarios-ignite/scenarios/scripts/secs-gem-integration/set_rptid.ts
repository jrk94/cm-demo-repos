import { Cmf } from "cmf-lbos";
import { EventMapping, ScriptScopeBase } from "../types/globals";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class SetReportIdWrapper extends ScriptScopeBase {
    [key: string]: any;

    private setReportId() {
        // PackagePacker: Start of Script

        const eventMapping = (this.answers.eventMapping as EventMapping).get(this.answers.eventCEID);

        if (!eventMapping?.rptidAndSvidList) {
            // First array adding rptid and svid list for the CEID
            eventMapping!.rptidAndSvidList = [{ rptid: this.answers.rptid, svidList: new Map() }];
        }
        if (!eventMapping?.rptidAndSvidList.find(item => item.rptid === this.answers.rptid)) {
            // Adding rptid and svid list for the CEID if rptid is not exist for the CEID
            eventMapping?.rptidAndSvidList.push({ rptid: this.answers.rptid, svidList: new Map() });
        }
        // PackagePacker: End of Script
    }
}