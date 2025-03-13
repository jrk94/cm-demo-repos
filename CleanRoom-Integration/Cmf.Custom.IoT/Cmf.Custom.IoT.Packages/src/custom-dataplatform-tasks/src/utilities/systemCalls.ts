import { Dependencies, System, Task, Utilities } from "@criticalmanufacturing/connect-iot-controller-engine";
import { ISA95 } from "./interfaces";
import Cmf from "cmf-lbos";
import { Queries } from "./queries";
import DataPlatform = System.LBOS.Cmf.Foundation.BusinessOrchestration.DataPlatform;
import moment from "moment";

export class SystemCalls {

    public static async extractISA95(instance: System.LBOS.Cmf.Foundation.BusinessObjects.Entity, system: System.SystemAPI, logAndEmitError: (string) => void): Promise<ISA95> {

        let query;
        switch (instance["$type"].toString()) {
            case "Cmf.Navigo.BusinessObjects.Resource, Cmf.Navigo.BusinessObjects":
                query = Queries.getIsa95QueryFromResource(instance.Name);
                break;
            case "Cmf.Navigo.BusinessObjects.Area, Cmf.Navigo.BusinessObjects":
                query = Queries.getIsa95QueryFromArea(instance.Name);
                break;
            case "Cmf.Navigo.BusinessObjects.Facility, Cmf.Navigo.BusinessObjects":
                query = Queries.getIsa95QueryFromFacility(instance.Name);
                break;
            case "Cmf.Foundation.BusinessObjects.Site, Cmf.Foundation.BusinessObjects":
                query = Queries.getIsa95QueryFromSite(instance.Name);
                break;
            case "Cmf.Foundation.BusinessObjects.Enterprise, Cmf.Foundation.BusinessObjects":
                return { Enterprise: instance.Name };
            default:
                logAndEmitError(`This task can only be used with entities of the ISA95`);
        }

        const executeQueryObject = new Cmf.Foundation.BusinessOrchestration.QueryManagement.InputObjects.ExecuteQueryInput();
        executeQueryObject.QueryObject = query;
        const result = await system.call(executeQueryObject) as Cmf.Foundation.BusinessOrchestration.QueryManagement.OutputObjects.ExecuteQueryOutput;

        if (result != null && result.NgpDataSet && result.NgpDataSet["T_Result"]) {

            // We are doing top 1
            const resultRow = result.NgpDataSet["T_Result"][0];

            return {
                Resource: resultRow.Resource,
                Area: resultRow.Area,
                Facility: resultRow.Facility,
                Site: resultRow.Site,
                Enterprise: resultRow.Enterprise
            };
        }
    }

    /**
     * Post event based on the current available values
     */
    public static async postTelemetry(data: object, applicationName: string, ignoreLastServiceId: boolean, iotRetries: number, iotSleepBetweenRetries: number, numberOfRetries: number, systemProxy: System.SystemProxy, logger: Dependencies.Logger): Promise<DataPlatform.OutputObjects.PostEventOutput> {
        logger.info("Posting a telemetry event");

        if (applicationName != null && applicationName.length > 0) {

            // Post!
            const output: DataPlatform.OutputObjects.PostEventOutput =
                await Utilities.ExecuteWithSystemErrorRetry(logger, iotRetries, iotSleepBetweenRetries, async () => {
                    return (await systemProxy.call<System.LBOS.Cmf.Foundation.BusinessOrchestration.BaseOutput>(
                        this.createCallPostTelemetry(data, applicationName, ignoreLastServiceId, numberOfRetries, logger)));
                }
                );

            return output;
        } else {
            throw new Error("No application name provided");
        }
    }

    private static createCallPostTelemetry(data: object, applicationName: string, ignoreLastServiceId: boolean, numberOfRetries: number, logger: Dependencies.Logger) {

        const input = new DataPlatform.InputObjects.PostEventInput();
        input.AppProperties = new DataPlatform.Domain.AppProperties();
        // applicationName
        input.AppProperties.ApplicationName = applicationName;
        // EventDefinitionName
        input.AppProperties.EventDefinition = "PostTelemetry";
        // If event time is not a valid moment setup as now
        input.AppProperties.EventTime = moment.utc();
        // Inject BaseInput values
        input.IgnoreLastServiceId = Utilities.convertValueToType(ignoreLastServiceId, Task.TaskValueType.Boolean, false);
        input.NumberOfRetries = Utilities.convertValueToType(numberOfRetries, Task.TaskValueType.Integer, false);
        // Payload
        input.Data = data;
        logger.debug(` AppProperties: ${JSON.stringify(input.AppProperties)}, Payload: ${JSON.stringify(input.Data)}`);

        return input;
    }
}