import { Cmf } from "cmf-lbos";
import { ScriptScopeBase } from "../types/globals";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class CreateUserWrapper extends ScriptScopeBase {
    [key: string]: any;

    private createUser() {
        // PackagePacker: Start of Script
        (async () => {
            const rolesList: Array<{ Id: string; Name: string }> = this.answers.rolesList ?? [];

            // The Enum question with {Id, Name}[] data stores the selected Id;
            // fall back to Name match in case the runtime stores the Name instead.
            const selectedRole =
                rolesList.find((r) => r.Id === this.answers.primaryRole) ??
                rolesList.find((r) => r.Name === this.answers.primaryRole);

            if (!selectedRole) {
                throw new Error(`Primary role not found: ${this.answers.primaryRole}`);
            }

            const user = new Cmf.Foundation.Security.User();
            user.IsEnabled = true;
            user.UserAccount = this.answers.userAccount;
            user.UserName = this.answers.userName;
            user.MailAddress = this.answers.mailAddress;
            user.AuthenticationStrategy = this.answers.authenticationStrategy;
            user.Password = this.answers.password;

            const role = new Cmf.Foundation.Security.Role();
            role.Id = selectedRole.Id;
            role.Name = selectedRole.Name;
            user.PrimaryRole = role;

            const input = new Cmf.Foundation.BusinessOrchestration.SecurityManagement.InputObjects.CreateUserInput();
            input.User = user;
            input.Password = this.answers.password;
            input.IgnoreLastServiceId = true;
            input.IsToSkipSyncFromAd = true;
            input.PlainSecureFields = true;

            await this.System.call(input) as Cmf.Foundation.BusinessOrchestration.SecurityManagement.OutputObjects.CreateUserOutput;
        })();
        // PackagePacker: End of Script
    }
}
