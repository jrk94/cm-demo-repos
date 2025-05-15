import { Task, System, TaskBase } from "@criticalmanufacturing/connect-iot-controller-engine";
import moment from "moment";
import { Data, ISA95, OvenData, PostTelemetry } from "../../utilities/interfaces";
import { SystemCalls } from "../../utilities/systemCalls";
import { CallTracker } from "assert";

/** Default values for settings */
export const SETTINGS_DEFAULTS: PostOvenTelemetrySettings = {
    applicationName: "MES",
    eventTime: null,
    retries: 30,
    sleepBetweenRetries: 1000,
    ignoreLastServiceId: false,
    numberOfRetries: 30,
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
 * See {@see PostOvenTelemetrySettings}
 */
@Task.Task()
export class PostOvenTelemetryTask extends TaskBase implements PostOvenTelemetrySettings {

    /** Accessor helper for untyped properties and output emitters. */
    // [key: string]: any;

    /** **Inputs** */
    @Task.InputProperty(System.PropertyValueType.ReferenceType)
    public instance: System.LBOS.Cmf.Foundation.BusinessObjects.Entity;

    @Task.InputProperty(Task.TaskValueType.String)
    public material: string;

    @Task.InputProperty(Task.TaskValueType.Object)
    public tags: object;

    @Task.InputProperty(Task.TaskValueType.Object)
    public values: OvenData[];

    @Task.InputProperty(Task.TaskValueType.DateTime)
    public valuesTimestamp: Date;

    /** **Outputs** */

    /** Properties Settings */
    applicationName: string = SETTINGS_DEFAULTS.applicationName;
    eventTime: moment.Moment = SETTINGS_DEFAULTS.eventTime;
    retries: number = SETTINGS_DEFAULTS.retries;
    sleepBetweenRetries: number = SETTINGS_DEFAULTS.sleepBetweenRetries;
    ignoreLastServiceId: boolean = SETTINGS_DEFAULTS.ignoreLastServiceId;
    numberOfRetries: number = SETTINGS_DEFAULTS.numberOfRetries;

    /**
     * When one or more input values is changed this will be triggered,
     * @param changes Task changes
     */
    public override async onChanges(changes: Task.Changes): Promise<void> {
        if (changes["activate"]) {
            // It is advised to reset the activate to allow being reactivated without the value being different
            this.activate = undefined;
            const serviceCallResults = [];
            try {
                for (const ovenData of this.values) {

                    // One Post per zone
                    serviceCallResults.push(await SystemCalls.postTelemetry(
                        await this.createData(
                            this.instance,
                            this.material,
                            ovenData,
                            this.tags,
                            this.valuesTimestamp),
                        this.applicationName,
                        this.ignoreLastServiceId,
                        this.retries,
                        this.sleepBetweenRetries,
                        this.numberOfRetries,
                        this._systemProxy,
                        this._logger));
                }

                if (serviceCallResults.find(call => call.HasErrors) == undefined) {
                    this.success.emit(true);
                    this._logger.info("Events posted successfully");
                } else {
                    const error = serviceCallResults.map(call => call?.ErrorList ?? "").join(";");
                    this.logAndEmitError(error);
                }

            } catch (error) {
                this.logAndEmitError(error);
            }
        }
    }

    /** Right after settings are loaded, create the needed dynamic outputs. */
    public override async onBeforeInit(): Promise<void> {
    }

    /** Initialize this task, register any event handler, etc */
    public override async onInit(): Promise<void> {
        this.sanitizeSettings(SETTINGS_DEFAULTS);
    }

    /** Cleanup internal data, unregister any event handler, etc */
    public override async onDestroy(): Promise<void> {
    }

    private transformData(ovenData: OvenData, timestamp: string): any[] {
        const parameters: any[] = [];

        // Handle Zone fields
        for (const [key, value] of Object.entries(this.removeDollarId(ovenData.Zone))) {
            const param: any = {
                Class: "Property",
                Name: key,
                UnitOfMeasure: "",
                Timestamps: [timestamp],
            };

            if (typeof value === "string") {
                param.StringValues = [value];
            } else if (typeof value === "number") {
                param.NumericValues = [value];
            }

            parameters.push(param);
        }

        // Helper function to group fields
        const groupFields = <T>(
            items: T[],
            field: keyof T,
            className: "Property" | "Sensor",
            namePrefix: string,
            valueKey: "StringValues" | "NumericValues",
            unit: string = ""
        ) => {
            const grouped = items.map((item) => item[field]);
            return {
                Class: className,
                Name: `${namePrefix}.${field.toString()}`,
                UnitOfMeasure: unit,
                [valueKey]: grouped,
                Timestamps: [timestamp],
            };
        };

        // Handle Setpoints
        parameters.push(
            groupFields(ovenData.Setpoints, "SubZone", "Property", "Setpoints", "StringValues"),
            groupFields(ovenData.Setpoints, "SetpointType", "Property", "Setpoints", "StringValues"),
            groupFields(ovenData.Setpoints, "Setpoint", "Property", "Setpoints", "NumericValues", "ºC")
        );

        // Handle Readings
        parameters.push(
            groupFields(ovenData.Readings, "SubZone", "Sensor", "Readings", "StringValues"),
            groupFields(ovenData.Readings, "ReadingType", "Sensor", "Readings", "StringValues"),
            groupFields(ovenData.Readings, "ReadingValue", "Sensor", "Readings", "NumericValues", "ºC")
        );

        // Final structure
        return parameters;
    }

    private removeDollarId(obj) {
        if (Array.isArray(obj)) {
            return obj.map(this.removeDollarId);
        } else if (obj !== null && typeof obj === 'object') {
            const newObj = {};
            for (const key in obj) {
                if (key !== '$id') {
                    newObj[key] = this.removeDollarId(obj[key]);
                }
            }
            return newObj;
        }
        return obj;
    }
    private async createData(
        instance: System.LBOS.Cmf.Foundation.BusinessObjects.Entity,
        material: string,
        zoneData: OvenData,
        tags: object,
        valuesTimestamp: Date
    ): Promise<PostTelemetry> {

        // Retrieve from cached memory
        let isa95: ISA95 | undefined = await this._dataStore.retrieve(`${instance.Name}_ISA95`, undefined);

        if (isa95 == null) {
            // If it doesn't exist, extract from the MES and store in cache
            isa95 = await SystemCalls.extractISA95(instance, this._systemAPI, this.logAndEmitError);
            this._dataStore.store(`${instance.Name}_ISA95`, isa95, System.DataStoreLocation.Temporary);
        }

        return {
            Parameters: this.transformData(zoneData, new Date(valuesTimestamp).valueOf().toString()),
            Tags: tags,
            Material: { Name: material },
            Resource: { Name: isa95.Resource },
            Area: { Name: isa95.Area },
            Facility: { Name: isa95.Facility },
            Site: { Name: isa95.Site },
            Enterprise: { Name: isa95.Enterprise },
        };
    }
}

// Add settings here
/** PostOvenTelemetry Settings object */
export interface PostOvenTelemetrySettings extends System.TaskDefaultSettings {
    /** Application name */
    applicationName: string;
    /** Event Time */
    eventTime: moment.Moment;
    /** Number of retries until a good answer is received from System */
    retries: number;
    /** Number of milliseconds to wait between retries */
    sleepBetweenRetries: number;
    /* Should  the system ignore the last service id */
    ignoreLastServiceId: boolean,
    /* Number of retries on the DEE execution */
    numberOfRetries: number;
}