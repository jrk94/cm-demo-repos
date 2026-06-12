import { Cmf } from "cmf-lbos";
import { ScriptScopeBase } from "../types/globals";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class RetrieveProtocolSettingsWrapper extends ScriptScopeBase {
    [key: string]: any;

    private retrieveProtocolSettings() {
        // PackagePacker: Start of Script
        (async () => {

            function compareSemver(a: string, b: string): number {
                const pa = a.split('.').map(Number);
                const pb = b.split('.').map(Number);
                for (let i = 0; i < 3; i++) {
                    if (pa[i] > pb[i]) return 1;
                    if (pa[i] < pb[i]) return -1;
                }
                return 0;
            }

            const getNpmPackageVersionsInput =
                new Cmf.Foundation.BusinessOrchestration.GenericServiceManagement.InputObjects.GetNpmPackageVersionsInput();
            getNpmPackageVersionsInput.PackageNames = ["@criticalmanufacturing/connect-iot-driver-secsgem"];

            const packageVersions = await this.System.call(getNpmPackageVersionsInput) as Cmf.Foundation.BusinessOrchestration.GenericServiceManagement.OutputObjects.GetNpmPackageVersionsOutput;

            let versionWithTheBiggestSemver = "0.0.0";
            packageVersions.PackageVersions.get("@criticalmanufacturing/connect-iot-driver-secsgem")?.forEach((version) => {
                // Choose the one that has the bigger semver version, in case there are more than one versions that are marked as latest
                if (compareSemver(version, versionWithTheBiggestSemver) == 1) {
                    versionWithTheBiggestSemver = version;
                }
            });

            const getAutomationProtocolDataInput =
                new Cmf.Foundation.BusinessOrchestration.ConnectIoTManagement.InputObjects.GetAutomationProtocolDataInput();

            getAutomationProtocolDataInput.PackageVersion = versionWithTheBiggestSemver;
            getAutomationProtocolDataInput.Package = "@criticalmanufacturing/connect-iot-driver-secsgem";

            const protocolSettings = await this.System.call(getAutomationProtocolDataInput) as Cmf.Foundation.BusinessOrchestration.ConnectIoTManagement.OutputObjects.GetAutomationProtocolDataOutput;

            this.answers.automationProtocol = protocolSettings.AutomationProtocol;
            this.answers.automationProtocolDataTypesEnum = protocolSettings.AutomationProtocol.DataTypeCollection.map((dataType) => ({
                Id: dataType.Name,
                Name: dataType.Name
            }));
            this.answers.automationProtocolParameters = protocolSettings.AutomationProtocol.Parameters;
            this.answers.automationProtocolParametersEnum =
                protocolSettings.AutomationProtocol.Parameters.map(param => ({
                    Id: param.Name,
                    Name: `${param.Name} - ${param.DefaultValue?.toString() ?? ""} - ${param.Description}`
                }));
        })();
        // PackagePacker: End of Script
    }
}