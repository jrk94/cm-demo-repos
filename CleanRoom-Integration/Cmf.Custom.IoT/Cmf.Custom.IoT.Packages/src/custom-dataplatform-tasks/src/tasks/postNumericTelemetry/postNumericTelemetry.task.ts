import { Task, System, TaskBase, Utilities } from "@criticalmanufacturing/connect-iot-controller-engine";
import moment from "moment";
import DataPlatform = System.LBOS.Cmf.Foundation.BusinessOrchestration.DataPlatform;
import Cmf from "cmf-lbos";
import { Queries } from "../../utilities/queries";

/** Default values for settings */
export const SETTINGS_DEFAULTS: PostNumericTelemetrySettings = {
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
 * See {@see PostNumericTelemetrySettings}
 */
@Task.Task()
export class PostNumericTelemetryTask extends TaskBase implements PostNumericTelemetrySettings {

    /** Accessor helper for untyped properties and output emitters. */
    // [key: string]: any;

    /** **Inputs** */
    @Task.InputProperty(System.PropertyValueType.ReferenceType)
    public instance: System.LBOS.Cmf.Foundation.BusinessObjects.Entity;

    @Task.InputProperty(Task.TaskValueType.String)
    public class: string;

    @Task.InputProperty(Task.TaskValueType.String)
    public unitOfMeasure: string;

    @Task.InputProperty(Task.TaskValueType.String)
    public parameterName: string;

    @Task.InputProperty(Task.TaskValueType.Object)
    public tags: object;

    @Task.InputProperty(Task.TaskValueType.Decimal)
    public value: number;

    @Task.InputProperty(Task.TaskValueType.DateTime)
    public valueTimestamp: Date;

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

            const data =
                await this.createData(
                    this.instance,
                    this.class,
                    this.parameterName,
                    this.unitOfMeasure,
                    this.tags,
                    this.value,
                    this.valueTimestamp.valueOf().toString());

            await this.postTelemetry(data);

            this.success.emit(true);
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

    private async extractISA95(instance: System.LBOS.Cmf.Foundation.BusinessObjects.Entity): Promise<ISA95> {

        let query;
        switch (instance["$type"].toString()) {
            case "Cmf.Navigo.BusinessObjects.Resource, Cmf.Navigo.BusinessObjects":
                query = Queries.GetIsa95QueryFromResource(this.instance.Name);
                break;
            case "Cmf.Navigo.BusinessObjects.Area, Cmf.Navigo.BusinessObjects":
                query = Queries.GetIsa95QueryFromArea(this.instance.Name);
                break;
            case "Cmf.Navigo.BusinessObjects.Facility, Cmf.Navigo.BusinessObjects":
                query = Queries.GetIsa95QueryFromFacility(this.instance.Name);
                break;
            case "Cmf.Foundation.BusinessObjects.Site, Cmf.Foundation.BusinessObjects":
                query = Queries.GetIsa95QueryFromSite(this.instance.Name);
                break;
            case "Cmf.Foundation.BusinessObjects.Enterprise, Cmf.Foundation.BusinessObjects":
                return { Enterprise: instance.Name };
            default:
                this.logAndEmitError(`This task can only be used with entities of the ISA95`);
        }

        const executeQueryObject = new Cmf.Foundation.BusinessOrchestration.QueryManagement.InputObjects.ExecuteQueryInput();
        executeQueryObject.QueryObject = query;
        const result = await this._systemAPI.call(executeQueryObject) as Cmf.Foundation.BusinessOrchestration.QueryManagement.OutputObjects.ExecuteQueryOutput;

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

    private async createData(
        instance: System.LBOS.Cmf.Foundation.BusinessObjects.Entity,
        className: string,
        parameterName: string,
        unitOfMeasure: string,
        tags: object,
        value: number,
        valueTimestamp: string
    ): Promise<PostTelemetry> {

        // Retrieve from cached memory
        let isa95: ISA95 | undefined = await this._dataStore.retrieve(`${instance.Name}_ISA95`, undefined);

        if (isa95 == null) {
            // If it doesn't exist, extract from the MES and store in cache
            isa95 = await this.extractISA95(instance);
            this._dataStore.store(`${instance.Name}_ISA95`, isa95, System.DataStoreLocation.Temporary);
        }

        return {
            Parameters: [{
                Class: className,
                Name: parameterName,
                UnitOfMeasure: unitOfMeasure,
                NumericValues: [value],
                Timestamps: [valueTimestamp]
            }],
            Tags: tags,
            Resource: { Name: isa95.Resource },
            Area: { Name: isa95.Area },
            Facility: { Name: isa95.Facility },
            Site: { Name: isa95.Site },
            Enterprise: { Name: isa95.Enterprise },
        };
    }

    private createCall(data: object): DataPlatform.InputObjects.PostEventInput {
        const input = new DataPlatform.InputObjects.PostEventInput();
        input.AppProperties = new DataPlatform.Domain.AppProperties();
        // applicationName
        input.AppProperties.ApplicationName = this.applicationName;
        // EventDefinitionName
        input.AppProperties.EventDefinition = "PostTelemetry";
        // If event time is not a valid moment setup as now
        input.AppProperties.EventTime = moment.utc();
        // Inject BaseInput values
        input.IgnoreLastServiceId = Utilities.convertValueToType(this.ignoreLastServiceId, Task.TaskValueType.Boolean, false);
        input.NumberOfRetries = Utilities.convertValueToType(this.numberOfRetries, Task.TaskValueType.Integer, false);
        // Payload
        input.Data = data;
        this._logger.debug(` AppProperties: ${JSON.stringify(input.AppProperties)}, Payload: ${JSON.stringify(input.Data)}`);

        return input;
    }

    /**
     * Post event based on the current available values
     */
    private async postTelemetry(data: object): Promise<void> {
        this._logger.info("Posting a telemetry event");

        if (this.applicationName != null && this.applicationName.length > 0) {

            // Post!
            const output: DataPlatform.OutputObjects.PostEventOutput =
                await Utilities.ExecuteWithSystemErrorRetry(this._logger, this.retries, this.sleepBetweenRetries, async () => {
                    return (await this._systemProxy.call<System.LBOS.Cmf.Foundation.BusinessOrchestration.BaseOutput>(this.createCall(data)));
                }
                );

            if (output != null) {
                if (output.HasErrors === false) {
                    this.success.emit(true);
                    this._logger.info("Event posted successfully");
                } else if (output.HasErrors === true) {
                    const error = output.ErrorList?.size > 0 ? [...output.ErrorList.values()].join("; ") : "Unknown error";
                    this.logAndEmitError(error);
                }
            }
        } else {
            this.logAndEmitError("'applicationName' not defined");
        }
    }
}

// Add settings here
/** PostNumericTelemetry Settings object */
export interface PostNumericTelemetrySettings extends System.TaskDefaultSettings {
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

interface Data {
    Class: string,
    Name: string,
    NumericValues: number[],
    Timestamps: string[],
    UnitOfMeasure: string
}

interface PostTelemetry {
    Parameters: Data[],
    Tags: object,
    Resource?: { Name: string },
    Area?: { Name: string },
    Facility?: { Name: string },
    Site?: { Name: string },
    Enterprise?: { Name: string },
}

interface ISA95 {
    Resource?: string,
    Area?: string,
    Site?: string,
    Facility?: string,
    Enterprise?: string
}