import { Task, System, Utilities, TaskBase, LBOS } from "@criticalmanufacturing/connect-iot-controller-engine";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const moment = require("moment");
import DataPlatform = System.LBOS.Cmf.Foundation.BusinessOrchestration.DataPlatform;

/** Helper to check if a string is null, undefined, or whitespace */
const isNullOrWhiteSpace = (value: string | null | undefined): boolean =>
    value === null || value === undefined || value.trim() === "";

/** Helper to set a value at a nested path in an object (e.g., "Automation.Name" -> { Automation: { Name: value } }) */
const setNestedValue = (obj: any, path: string, value: any): void => {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current)) {
            current[key] = {};
        }
        current = current[key];
    }
    current[keys[keys.length - 1]] = value;
};

/** Default values for settings */
export const SETTINGS_DEFAULTS: PostMultipleIotEventsSettings = {
    retries: 10,
    sleepBetweenRetries: 5000,
    systemRetries: 1,
    applicationName: "ConnectIoTUNSConnector",
};

export interface PropertyValue {
    /** Identifier of the property (the name, which must be unique in the driver definition) */
    propertyName: string;
    /** Value converted to the data type */
    value: any;
    /** Original value as it was provided from the equipment */
    originalValue: any;
};

export interface EventOccurrence {
    timestamp: Date;
    eventSystemId: string;
    eventName: string;
    eventDeviceId: string;
    propertyValues: PropertyValue[];
};

/**
 * @whatItDoes
 *
 * This task does something ... describe here
 *
 * @howToUse
 *
 * yada yada yada
 *
 * ### Inputs
 * * `any` : **activate** - Activate the task
 *
 * ### Outputs
 *
 * * `bool`  : ** success ** - Triggered when the the task is executed with success
 * * `Error` : ** error ** - Triggered when the task failed for some reason
 *
 * ### Settings
 * See {@see PostMultipleIotEventsSettings}
 */
@Task.Task()
export class PostMultipleIotEventsTask extends TaskBase implements PostMultipleIotEventsSettings {

    /** Accessor helper for untyped properties and output emitters. */
    // [key: string]: any;

    /** **Inputs** */
    bulkEvents: EventOccurrence[];

    /** **Outputs** */


    /** Properties Settings */
    /** Information about the example setting */
    public retries: number = SETTINGS_DEFAULTS.retries;
    public sleepBetweenRetries: number = SETTINGS_DEFAULTS.sleepBetweenRetries;
    public systemRetries: number = SETTINGS_DEFAULTS.systemRetries;
    public applicationName: string = SETTINGS_DEFAULTS.applicationName;

    /**
     * When one or more input values is changed this will be triggered,
     * @param changes Task changes
     */
    public override async onChanges(changes: Task.Changes): Promise<void> {
        if (changes["activate"]) {
            // It is advised to reset the activate to allow being reactivated without the value being different
            this.activate = undefined;
            const events = this.bulkEvents;

            try {
                await Utilities.ExecuteWithRetry(this._logger, this.retries, this.sleepBetweenRetries, async () => {
                    const input = new LBOS.Cmf.Foundation.BusinessOrchestration.DataPlatform.InputObjects.PostMultipleIoTEventsInput();
                    input.IgnoreLastServiceId = false;
                    input.NumberOfRetries = this.systemRetries;
                    input.ServiceComments = "";
                    input.IoTEvents = [];

                    for (let event of events) {
                        const serviceInput = new LBOS.Cmf.Foundation.BusinessOrchestration.DataPlatform.InputObjects.PostEventInput();
                        serviceInput.IgnoreLastServiceId = false;
                        serviceInput.NumberOfRetries = this.systemRetries;
                        serviceInput.ServiceComments = "";

                        let appProperties = new LBOS.Cmf.Foundation.BusinessOrchestration.DataPlatform.Domain.AppProperties();
                        appProperties.ApplicationName = this.applicationName
                        appProperties.EventDefinition = event.eventDeviceId;
                        appProperties.EventTime = moment(event.timestamp);

                        serviceInput.AppProperties = appProperties;

                        let data: any = {};

                        for (let propertyValue of event.propertyValues) {
                            let prop = this._driverProxy?.automationControllerDriverDefinition?.AutomationDriverDefinition?.Properties?.find(p => p.Name === propertyValue.propertyName);

                            if (prop == null) {
                                prop = this._driverProxy?.["_driver"]?._fullDriverDefinitions?.SystemProperties?.get(propertyValue.propertyName);
                            }
                            const path = (prop?.ExtendedData as any)?.path;
                            if (path) {
                                setNestedValue(data, path, propertyValue.value);
                            } else {
                                data[propertyValue.propertyName] = propertyValue.value;
                            }
                        }

                        serviceInput.Data = data

                        input.IoTEvents.push(serviceInput);
                    }
                    const output: any = await this._systemAPI.call<System.LBOS.Cmf.Foundation.BusinessOrchestration.BaseOutput>(input);

                    if (output != null) {
                        if (output.HasErrors === false) {
                            this.success.emit(true);
                            this._logger.info("Event posted successfully");
                        } else if (output.HasErrors === true) {
                            const error = output.ErrorList?.size > 0 ? [...output.ErrorList.values()].join("; ") : "Unknown error";
                            this.logAndEmitError(error);
                        }
                    }
                });
                this.success.emit(true);
            } catch (error) {
                this.logAndEmitError(`Error posting events: ${error.message}`);
            }
        }
    }
}

// Add settings here
/** PostMultipleIotEvents Settings object */
export interface PostMultipleIotEventsSettings extends System.TaskDefaultSettings {
    /** Information about the example setting */
    retries: number;
    sleepBetweenRetries: number;
    systemRetries: number;
    applicationName: string;
}
