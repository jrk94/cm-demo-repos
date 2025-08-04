import { Task, System, TaskBase } from "@criticalmanufacturing/connect-iot-controller-engine";
import { SystemCalls } from "../../utilities/systemCalls";
import { PostProjectTelemetry } from "../../utilities/interfaces";

/** Default values for settings */
export const SETTINGS_DEFAULTS: PostProjectTelemetrySettings = {
    applicationName: "MES",
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
 * See {@see PostProjectTelemetrySettings}
 */
@Task.Task()
export class PostProjectTelemetryTask extends TaskBase implements PostProjectTelemetrySettings {

    /** Accessor helper for untyped properties and output emitters. */
    // [key: string]: any;

    /** **Inputs** */
    @Task.InputProperty(Task.TaskValueType.String)
    public project: string;

    @Task.InputProperty(Task.TaskValueType.Object)
    public package: { Type: string; Name: string; Version: string };

    @Task.InputProperty(Task.TaskValueType.String)
    public eventTime: string;

    @Task.InputProperty(Task.TaskValueType.Object)
    public payload: object;

    @Task.InputProperty(Task.TaskValueType.Object)
    public context: object;

    /** **Outputs** */


    /** Properties Settings */
    /** Information about the example setting */
    applicationName: string = SETTINGS_DEFAULTS.applicationName;
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
            const allPostPromises = [];
            let serviceCallResults = [];

            try {
                for (const dataToPost of await this.createData(
                    this.project,
                    this.package,
                    this.eventTime,
                    this.context,
                    this.payload)) {

                    allPostPromises.push(SystemCalls.postProjectTelemetry(
                        dataToPost,
                        this.applicationName,
                        this.ignoreLastServiceId,
                        this.retries,
                        this.sleepBetweenRetries,
                        this.numberOfRetries,
                        this._systemProxy,
                        this._logger));
                }

                serviceCallResults = await Promise.all(allPostPromises);

                if (serviceCallResults.find(call => call.HasErrors) === undefined) {
                    this.success.emit(true);
                    this._logger.info("Events posted successfully");
                } else {
                    const error = serviceCallResults.map(call => JSON.stringify([...call?.ErrorList?.entries() ?? ""]) ?? "").join(";");
                    this.logAndEmitError(error);
                }
            } catch (e) {
                this.logAndEmitError(e);
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

    private async createData(
        project: string,
        _package: { Type: string; Name: string; Version: string },
        eventTime: string,
        context: object,
        payload: object
    ): Promise<PostProjectTelemetry[]> {

        const posts: PostProjectTelemetry[] = [];
        for (const entry of Object.entries(payload)) {

            const item: Partial<PostProjectTelemetry> = {
                Project: { Name: project },
                Package: _package
            };

            item.Parameters = this.transformDataIntoParameters(entry, eventTime);
            item.Tags = this.transformDataIntoTags(context);

            posts.push(item as PostProjectTelemetry);
        }
        return posts;
    }

    private transformDataIntoTags(context: object): PostProjectTelemetry["Tags"] {
        const tags: PostProjectTelemetry["Tags"] = [];

        for (const entry of Object.entries(context)) {
            tags.push({ Key: entry[0], Value: entry[1].toString() });
        }

        return tags;
    }


    private transformDataIntoParameters(entry: [string, any], timestamp: string): any[] {
        const [name, value] = entry;
        const values = Array.isArray(value) ? value : [value];

        return values.map(v => ({
            Class: "Datapoint",
            Name: name,
            UnitOfMeasure: "",
            ...(this.isNumeric(v)
                ? { NumericValues: [v] }
                : { StringValues: [v] }),
            Timestamps: [timestamp],
        }));
    }

    private isNumeric(value: any): boolean {
        return !isNaN(parseFloat(value)) && isFinite(value);
    }
}

// Add settings here
/** PostProjectTelemetry Settings object */
export interface PostProjectTelemetrySettings extends System.TaskDefaultSettings {
    /** Application name */
    applicationName: string;
    /** Number of retries until a good answer is received from System */
    retries: number;
    /** Number of milliseconds to wait between retries */
    sleepBetweenRetries: number;
    /* Should  the system ignore the last service id */
    ignoreLastServiceId: boolean,
    /* Number of retries on the DEE execution */
    numberOfRetries: number;
}
