import { ScriptScopeBase } from "../types/globals";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class ValidateResourceEntityWrapper extends ScriptScopeBase {
    [key: string]: any;

    private validateResourceEntity() {
        // PackagePacker: Start of Script
        (async () => {
            const entities = await this.lboUtilities.iotEnabledEntities();

            const resource = entities?.find((entity) => entity?.Name == "Resource");
            if (entities == null || entities.length == 0 || !resource) {
                throw new Error("Resource is not ConnectIoT enabled. Please enable ConnectIoT on the resource and try again.");
            }
            this.answers.iotEnabledEntity = resource;
        })()
        // PackagePacker: End of Script
    }
}