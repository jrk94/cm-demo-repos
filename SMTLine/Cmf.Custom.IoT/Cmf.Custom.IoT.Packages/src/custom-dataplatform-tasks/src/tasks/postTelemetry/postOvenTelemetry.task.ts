import { Task, System, TaskBase } from "@criticalmanufacturing/connect-iot-controller-engine";
import moment from "moment";
import { ISA95, OvenData, PostTelemetry, Reading, Setpoint } from "../../utilities/interfaces";
import { SystemCalls } from "../../utilities/systemCalls";

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
 *
 * This task transforms CFX Units Processed data into a set of IoT Post Events,
 * specifically for oven telemetry. It processes readings and setpoints from
 * oven zones and dispatches them to a telemetry system.
 *
 *
 * This task is activated by its `activate` input. Upon activation, it iterates
 * through provided oven data, constructs telemetry payloads, and posts them
 * using `SystemCalls.postTelemetry`. It handles success and error conditions,
 * emitting appropriate output signals.
 *
 * It's designed to work with structured oven data, matching readings with
 * corresponding setpoints and enriching the data with relevant tags and ISA95
 * hierarchy information.
 *
 * ### Inputs
 * * `activate`: `any` - Triggers the execution of the task. Set to any value to activate.
 * * `instance`: `System.LBOS.Cmf.Foundation.BusinessObjects.Entity` - The system entity (e.g., a specific oven) to which the telemetry belongs.
 * * `material`: `string` - The material currently being processed in the oven.
 * * `values`: `OvenData[]` - An array of oven data, where each `OvenData` object contains readings and setpoints for a specific zone.
 * * `valuesTimestamp`: `Date` - The timestamp to associate with all processed telemetry values.
 *
 * ### Outputs
 * * `success`: `boolean` - Emits `true` when all telemetry events are successfully posted.
 * * `error`: `Error` - Emits an `Error` object if the task fails to post telemetry for any reason.
 *
 * ### Settings
 * See {@link PostOvenTelemetrySettings} for configurable properties like application name,
 * retry mechanisms, and more.
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
    public values: OvenData[];

    @Task.InputProperty(Task.TaskValueType.DateTime)
    public valuesTimestamp: Date;

    @Task.OutputProperty()
    public results: Task.Output<any> = new Task.Output<any>();

    /** **Outputs** */

    /** Properties Settings */
    applicationName: string = SETTINGS_DEFAULTS.applicationName;
    eventTime: moment.Moment = SETTINGS_DEFAULTS.eventTime;
    retries: number = SETTINGS_DEFAULTS.retries;
    sleepBetweenRetries: number = SETTINGS_DEFAULTS.sleepBetweenRetries;
    ignoreLastServiceId: boolean = SETTINGS_DEFAULTS.ignoreLastServiceId;
    numberOfRetries: number = SETTINGS_DEFAULTS.numberOfRetries;

    /**
     * Called when one or more input values have changed.
     *
     * @param changes - An object representing the changed inputs.
     * @remarks
     * This method checks for activation of the task, processes oven telemetry data, 
     * and sends it to the system via `SystemCalls.postTelemetry`. It emits
     * success or error signals based on the result.
     */
    public override async onChanges(changes: Task.Changes): Promise<void> {
        if (changes["activate"]) {
            // It is advised to reset the activate to allow being reactivated without the value being different
            this.activate = undefined;
            let serviceCallResults = [];
            try {

                let allPostPromises = [];
                const result = {};
                for (const ovenData of this.values) {

                    for (const dataToPost of await this.createData(
                        this.instance,
                        this.material,
                        ovenData,
                        this.valuesTimestamp)) {

                        for (const parameter of dataToPost.Parameters) {
                            if (parameter.Name === "ReadingValue") {
                                result[
                                    dataToPost.Tags.find(key => key.Key === "ReflowZoneType").Value + "_" +
                                    dataToPost.Tags.find(key => key.Key === "StageName").Value + "_" +
                                    dataToPost.Tags.find(key => key.Key === "Reading.SubZone").Value + "_" +
                                    dataToPost.Tags.find(key => key.Key === "Reading.ReadingType").Value] = parameter.NumericValues[0];
                            }
                        }

                        // One Post per subzone
                        allPostPromises.push(SystemCalls.postTelemetry(
                            dataToPost,
                            this.applicationName,
                            this.ignoreLastServiceId,
                            this.retries,
                            this.sleepBetweenRetries,
                            this.numberOfRetries,
                            this._systemProxy,
                            this._logger))
                    }
                }

                serviceCallResults = await Promise.all(allPostPromises);

                if (serviceCallResults.find(call => call.HasErrors) == undefined) {
                    this.results.emit(result);
                    this.success.emit(true);
                    this._logger.info("Events posted successfully");
                } else {
                    const error = serviceCallResults.map(call => JSON.stringify([...call?.ErrorList.entries()]) ?? "").join(";");
                    this.logAndEmitError(error);
                }

            } catch (error) {
                this.logAndEmitError(error);
            }
        }
    }

    /**
     * Initializes the task.
     *
     * @remarks
     * Registers any required handlers and ensures the settings are sanitized
     * against default values before execution begins.
     */

    public override async onInit(): Promise<void> {
        this.sanitizeSettings(SETTINGS_DEFAULTS);
    }

    /**
     * Converts a reading and setpoint pair into an array of telemetry parameters.
     *
     * @param reading - The sensor reading data.
     * @param setpoint - The corresponding setpoint data.
     * @param timestamp - The timestamp to associate with the parameter values.
     * @returns An array of structured telemetry parameters.
     */
    private transformDataIntoParameters(reading: Reading, setpoint: Setpoint, timestamp: string): any[] {
        const parameters: any[] = [];

        parameters.push({
            Class: "Sensor",
            Name: `ReadingValue`,
            UnitOfMeasure: this.resolveUnit(reading.ReadingType),
            NumericValues: [reading.ReadingValue],
            Timestamps: [timestamp],
        });

        parameters.push({
            Class: "Property",
            Name: `Setpoint`,
            UnitOfMeasure: this.resolveUnit(setpoint.SetpointType),
            NumericValues: [setpoint.Setpoint],
            Timestamps: [timestamp],
        });

        // Final structure
        return parameters;
    }

    /**
     * Converts a setpoint into telemetry parameters.
     *
     * @param setpoint - The setpoint data.
     * @param timestamp - The timestamp to associate with the setpoint.
     * @returns An array of structured telemetry parameters for the setpoint only.
     */
    private transformDataIntoParametersForSetpoint(setpoint: Setpoint, timestamp: string): any[] {
        const parameters: any[] = [];
        parameters.push({
            Class: "Property",
            Name: `Setpoint`,
            UnitOfMeasure: this.resolveUnit(setpoint.SetpointType),
            NumericValues: [setpoint.Setpoint],
            Timestamps: [timestamp],
        });

        // Final structure
        return parameters;
    }

    /**
     * Converts a reading into telemetry parameters.
     *
     * @param reading - The reading data.
     * @param timestamp - The timestamp to associate with the reading.
     * @returns An array of structured telemetry parameters for the reading only.
     */
    private transformDataIntoParametersForReading(reading: Reading, timestamp: string): any[] {
        const parameters: any[] = [];

        parameters.push({
            Class: "Sensor",
            Name: `ReadingValue`,
            UnitOfMeasure: this.resolveUnit(reading.ReadingType),
            NumericValues: [reading.ReadingValue],
            Timestamps: [timestamp],
        });

        // Final structure
        return parameters;
    }

    /**
     * Converts zone, reading, and setpoint metadata into a set of tags.
     *
     * @param ovenData - The oven zone data object.
     * @param reading - Optional sensor reading data to include.
     * @param setpoint - Optional setpoint data to include.
     * @returns An array of key-value tags used for telemetry posting.
     */
    private transformDataIntoTags(ovenData: OvenData, reading: Reading = null, setpoint: Setpoint = null): PostTelemetry["Tags"] {
        const tags: PostTelemetry["Tags"] = [];

        // Handle Zone fields
        for (const [key, value] of Object.entries(this.removeDollarId(ovenData.Zone))) {
            tags.push({ Key: key, Value: value.toString() });
        }

        if (reading != null) {
            delete reading.ReadingValue;
            for (const [key, value] of Object.entries(this.removeDollarId(reading))) {
                tags.push({ Key: `Reading.${key}`, Value: value.toString() });
            }
        }

        if (setpoint != null) {
            delete setpoint.Setpoint;

            for (const [key, value] of Object.entries(this.removeDollarId(setpoint))) {
                tags.push({ Key: `Setpoint.${key}`, Value: value.toString() });
            }
        }

        // Final structure
        return tags;
    }

    /**
     * Recursively removes `$id` properties from an object or array.
     *
     * @param obj - The object or array to sanitize.
     * @returns A new object or array with `$id` properties removed.
     */
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

    /**
     * Creates telemetry post payloads from oven zone data.
     *
     * @param instance - The system instance (entity) to post against.
     * @param material - The material name associated with the data.
     * @param zoneData - The oven zone data including readings and setpoints.
     * @param valuesTimestamp - The timestamp to assign to all values.
     * @returns A promise that resolves to an array of telemetry post objects.
     *
     * @remarks
     * If ISA95 data is not cached, it will be retrieved and cached for future use.
     * Readings and setpoints are matched and grouped into telemetry posts.
     */
    private async createData(
        instance: System.LBOS.Cmf.Foundation.BusinessObjects.Entity,
        material: string,
        zoneData: OvenData,
        valuesTimestamp: Date
    ): Promise<PostTelemetry[]> {

        // Retrieve from cached memory
        let isa95: ISA95 | undefined = await this._dataStore.retrieve(`${instance.Name}_ISA95`, undefined);

        if (isa95 == null) {
            // If it doesn't exist, extract from the MES and store in cache
            isa95 = await SystemCalls.extractISA95(instance, this._systemAPI, this.logAndEmitError);
            this._dataStore.store(`${instance.Name}_ISA95`, isa95, System.DataStoreLocation.Temporary);
        }

        const posts: PostTelemetry[] = [];
        for (let index = zoneData.Readings.length - 1; index >= 0; index--) {
            const reading = zoneData.Readings[index];
            // Each Reading Type and Setpoint type that is the same will be posted together

            let matchingSetpointFound = false;
            for (let spIndex = 0; spIndex < zoneData.Setpoints.length; spIndex++) {
                const setpoint = zoneData.Setpoints[spIndex];
                if (reading.ReadingType == setpoint.SetpointType &&
                    reading.SubZone == setpoint.SubZone
                ) {
                    const parameters = this.transformDataIntoParameters(reading, setpoint, new Date(valuesTimestamp).valueOf().toString());

                    posts.push({
                        Parameters: parameters,
                        Tags: this.transformDataIntoTags(zoneData, reading, setpoint),
                        Material: { Name: material },
                        Resource: { Name: isa95.Resource },
                        Area: { Name: isa95.Area },
                        Facility: { Name: isa95.Facility },
                        Site: { Name: isa95.Site },
                        Enterprise: { Name: isa95.Enterprise },
                    });
                    matchingSetpointFound = true;
                    zoneData.Setpoints.splice(spIndex, 1);
                    zoneData.Readings.splice(index, 1);

                    break;
                }
            }

            if (!matchingSetpointFound) {

                const parameters = this.transformDataIntoParametersForReading(reading, new Date(valuesTimestamp).valueOf().toString());
                posts.push({
                    Parameters: parameters,
                    Tags: this.transformDataIntoTags(zoneData, reading, null),
                    Material: { Name: material },
                    Resource: { Name: isa95.Resource },
                    Area: { Name: isa95.Area },
                    Facility: { Name: isa95.Facility },
                    Site: { Name: isa95.Site },
                    Enterprise: { Name: isa95.Enterprise },
                });
            }
        }

        if (zoneData.Setpoints.length > 0) {

            for (let spIndex = 0; spIndex < zoneData.Setpoints.length; spIndex++) {
                const setpoint = zoneData.Setpoints[spIndex];
                const parameters = this.transformDataIntoParametersForSetpoint(setpoint, new Date(valuesTimestamp).valueOf().toString());
                posts.push({
                    Parameters: parameters,
                    Tags: this.transformDataIntoTags(zoneData, null, setpoint),
                    Material: { Name: material },
                    Resource: { Name: isa95.Resource },
                    Area: { Name: isa95.Area },
                    Facility: { Name: isa95.Facility },
                    Site: { Name: isa95.Site },
                    Enterprise: { Name: isa95.Enterprise },
                });
            }
        }

        return posts;
    }

    /**
     * Maps a type string to its appropriate unit of measure.
     *
     * @param type - The type of measurement (e.g., "Temperature", "O2").
     * @returns A string representing the unit of measure.
     */
    private resolveUnit(type: string): string {
        let unit: string;
        switch (type) {
            case "Temperature":
                unit = "ºC";
                break;
            case "O2":
                unit = "ppm";
                break;
            case "Power":
                unit = "w";
                break;
            case "PowerLevel":
                unit = "%";
                break;
            case "Vacuum":
                unit = "Pa";
                break;
            case "VacuumHoldTime":
                unit = "s";
                break;
            case "ConvectionRate":
                unit = "sPa";
                break;
        }
        return unit;
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