import { Dependencies, System, Task, Utilities } from "@criticalmanufacturing/connect-iot-controller-engine";
import { ISA95 } from "./interfaces";
import Cmf from "cmf-lbos";
import { Queries } from "./queries";
import DataPlatform = System.LBOS.Cmf.Foundation.BusinessOrchestration.DataPlatform;
import moment from "moment";

/**
 * Provides utility system calls to interact with ISA95 model data
 * and to post telemetry events into the data platform.
 *
 * @remarks
 * This class abstracts the communication with CMF system APIs
 * and includes retry handling for robustness.
 */
export class SystemCalls {

    /**
     * Extracts the ISA95 model hierarchy information (Enterprise, Site, Facility, Area, Resource)
     * from the provided system entity instance.
     *
     * @param instance - The system entity instance to extract ISA95 hierarchy from.
     * @param system - The `SystemAPI` object used to execute queries.
     * @param logAndEmitError - A callback used to log and emit errors if the type is unsupported or a query fails.
     * @returns A promise resolving to an `ISA95` object containing the hierarchy values.
     *
     * @remarks
     * The method supports different `$type` values for Resource, Area, Facility, Site, and Enterprise.
     * If the type is unsupported, it will call the `logAndEmitError` function.
     */
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
     * Posts telemetry data as an event to the data platform.
     *
     * @param data - The telemetry payload to be posted.
     * @param applicationName - Name of the application posting the event.
     * @param ignoreLastServiceId - Whether to ignore the last service ID to avoid duplicates.
     * @param iotRetries - Number of retry attempts if the call fails.
     * @param iotSleepBetweenRetries - Wait time in milliseconds between retries.
     * @param numberOfRetries - Retry count used inside the event input.
     * @param systemProxy - The `SystemProxy` object used to call the platform.
     * @param logger - Logger instance for logging information and debugging.
     * @returns A promise that resolves to the output of the telemetry post call.
     *
     * @throws Will throw an error if `applicationName` is not provided.
     *
     * @remarks
     * This method uses `Utilities.ExecuteWithSystemErrorRetry` to ensure resilience against transient failures.
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

    /**
     * Creates the input object required to post telemetry to the data platform.
     *
     * @param data - The telemetry payload.
     * @param applicationName - The name of the application posting the event.
     * @param ignoreLastServiceId - Whether to ignore the last service ID during posting.
     * @param numberOfRetries - Number of retries to be used during post execution.
     * @param logger - Logger instance used for debugging the generated input object.
     * @returns A `PostEventInput` object configured with telemetry data and metadata.
     *
     * @remarks
     * The event time is set to the current UTC time. This method also logs the
     * composed payload and application properties for debugging purposes.
    */
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