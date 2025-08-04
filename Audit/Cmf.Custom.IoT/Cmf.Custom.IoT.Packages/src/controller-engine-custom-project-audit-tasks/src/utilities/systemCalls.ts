import { Dependencies, System, Task, Utilities } from "@criticalmanufacturing/connect-iot-controller-engine";
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
    public static async postProjectTelemetry(data: object, applicationName: string, ignoreLastServiceId: boolean, iotRetries: number, iotSleepBetweenRetries: number, numberOfRetries: number, systemProxy: System.SystemProxy, logger: Dependencies.Logger): Promise<DataPlatform.OutputObjects.PostEventOutput> {
        logger.info("Posting a telemetry event");

        if (applicationName != null && applicationName.length > 0) {

            // Post!
            const output: DataPlatform.OutputObjects.PostEventOutput =
                await Utilities.ExecuteWithSystemErrorRetry(logger, iotRetries, iotSleepBetweenRetries, async () => {
                    return (await systemProxy.call<System.LBOS.Cmf.Foundation.BusinessOrchestration.BaseOutput>(
                        this.createCallPostProjectTelemetry(data, applicationName, ignoreLastServiceId, numberOfRetries, logger)));
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
    private static createCallPostProjectTelemetry(data: object, applicationName: string, ignoreLastServiceId: boolean, numberOfRetries: number, logger: Dependencies.Logger) {

        const input = new DataPlatform.InputObjects.PostEventInput();
        input.AppProperties = new DataPlatform.Domain.AppProperties();
        // applicationName
        input.AppProperties.ApplicationName = applicationName;
        // EventDefinitionName
        input.AppProperties.EventDefinition = "PostProjectTelemetry_1";
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