import { EventMapping, ScriptScopeBase } from "../types/globals";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class CreateEventWrapper extends ScriptScopeBase {
    [key: string]: any;

    private createEvent() {
        // PackagePacker: Start of Script

        if (!this.answers.eventMapping) {
            // link data collection to ceid and ceid to list of rptid and each rptid has a list of svid, so we can support multiple data collections mapped to the same CEID and multiple RPTIDs mapped to the same CEID
            this.answers.eventMapping = new Map() as EventMapping;
        }

        if (!this.answers.eventMapping.has(this.answers.eventCEID)) {
            this.answers.eventMapping.set(this.answers.eventCEID, {
                dataCollection: this.answers.currentDataCollection,
                dataCollectionMode: this.answers.currentDataCollectionMode,
                rptidAndSvidList: []
            });
        }

        // PackagePacker: End of Script
    }
}