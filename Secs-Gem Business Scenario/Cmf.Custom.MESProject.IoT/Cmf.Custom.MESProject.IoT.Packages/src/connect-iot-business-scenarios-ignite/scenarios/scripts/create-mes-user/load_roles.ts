import { Cmf } from "cmf-lbos";
import { ScriptScopeBase } from "../types/globals";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class LoadRolesWrapper extends ScriptScopeBase {
    [key: string]: any;

    private loadRoles() {
        // PackagePacker: Start of Script
        (async () => {
            const output = await this.System.call(new Cmf.Foundation.BusinessOrchestration.SecurityManagement.InputObjects.GetAllRolesInput()) as Cmf.Foundation.BusinessOrchestration.SecurityManagement.OutputObjects.GetAllRolesOutput;
            return output.Roles.map((r: any) => ({ Id: r.Id, Name: r.Name }));
        })();
        // PackagePacker: End of Script
    }
}
