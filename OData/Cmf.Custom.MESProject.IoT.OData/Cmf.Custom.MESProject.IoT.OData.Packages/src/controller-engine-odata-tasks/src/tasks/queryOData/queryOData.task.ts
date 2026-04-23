import { Task, System, TaskBase, Utilities } from "@criticalmanufacturing/connect-iot-controller-engine";
import buildQuery from 'odata-query';

/** Default values for settings */
export const SETTINGS_DEFAULTS: QueryODataSettings = {
    rawQuery: "",
    rawMethod: "",
    folder: "",
    dataset: "",
    defaultSelect: "",
    defaultFilter: "",
    defaultExpand: "",
    defaultOrderBy: "",
    inputs: []
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
 * See {@see QueryODataSettings}
 */
@Task.Task()
export class QueryODataTask extends TaskBase implements QueryODataSettings {

    /** Accessor helper for untyped properties and output emitters. */
    // [key: string]: any;

    /** **Inputs** */
    rawQuery: string;
    rawMethod: string;
    select: string;
    filter: string;
    expand: string;
    orderBy: string;
    top: number;
    skip: number;
    count: boolean;
    search: string;

    /** **Outputs** */
    value: Task.Output<any[]> = new Task.Output<any[]>();
    countResponse: Task.Output<number | null> = new Task.Output<number | null>();
    nextLink: Task.Output<string | null> = new Task.Output<string | null>();
    rawResponse: Task.Output<any> = new Task.Output<any>();

    /** Properties Settings */
    folder: string;
    dataset: string;
    defaultSelect: string;
    defaultFilter: string;
    defaultExpand: string;
    defaultOrderBy: string;
    defaultTop: number;

    inputs: Task.TaskInput[];

    /**
     * When one or more input values is changed this will be triggered,
     * @param changes Task changes
     */
    public override async onChanges(changes: Task.Changes): Promise<void> {
        if (changes["activate"]) {
            // It is advised to reset the activate to allow being reactivated without the value being different
            this.activate = undefined;
            let url = `${process.env["HOSTURL"]}/datamanager/odata/`;
            if (this.rawQuery) {
                url = `${url}${this.rawQuery}`;
            } else {
                url = `${url}${this.folder}/${this.dataset}`;

                for (const key in changes) {
                    if (this.isInput(key)) {
                        const propertyName = Utilities.inputToProperty(key);
                        // the defaults may contain references to inputs, so we need to build the query with the current values of the inputs
                        // i.e. defaultFilter could be "Severity eq {severityInput}" and we need to replace {severityInput} with the current value of severityInput

                        if (this.defaultSelect != null && this.defaultSelect.includes(`{${propertyName}}`)) {
                            this.defaultSelect = this.defaultSelect.replace(new RegExp(`{${propertyName}}`, 'g'), changes[key].currentValue);
                        }
                        if (this.defaultFilter != null && this.defaultFilter.includes(`{${propertyName}}`)) {
                            this.defaultFilter = this.defaultFilter.replace(new RegExp(`{${propertyName}}`, 'g'), changes[key].currentValue);
                        }
                        if (this.defaultExpand != null && this.defaultExpand.includes(`{${propertyName}}`)) {
                            this.defaultExpand = this.defaultExpand.replace(new RegExp(`{${propertyName}}`, 'g'), changes[key].currentValue);
                        }
                        if (this.defaultOrderBy != null && this.defaultOrderBy.includes(`{${propertyName}}`)) {
                            this.defaultOrderBy = this.defaultOrderBy.replace(new RegExp(`{${propertyName}}`, 'g'), changes[key].currentValue);
                        }

                        this[key] = undefined;
                    }
                }

                const query = buildQuery({
                    select: this.select ?? this.defaultSelect,
                    filter: this.filter ?? this.defaultFilter,
                    expand: this.expand ?? this.defaultExpand,
                    orderBy: this.orderBy ?? this.defaultOrderBy,
                    top: this.top ?? this.defaultTop,
                    skip: this.skip,
                    count: this.count,
                    search: this.search,
                });

                url = `${url}${query}`;
            }

            url = url.replace(/#/g, '%23');

            try {
                const opts = {
                    headers: {
                        'Accept': 'application/json; odata.metadata=minimal; odata.streaming=true; charset=utf-8',
                        'Authorization': `Bearer ${process.env["SYSTEMACCESSTOKEN"]}`,
                    },
                    method: this.rawMethod || "GET"
                };

                const response = await fetch(url, opts);
                const data = await response.json();

                this.rawResponse.emit(data);
                this.value.emit(data.value);
                this.countResponse.emit(data['@odata.count'] ?? null);
                this.nextLink.emit(data['@odata.nextLink'] ?? null);

                this.success.emit(true);
            } catch (error) {
                this.logAndEmitError((error as Error).message);
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

    /**
     * Checks if a given input is an input defined in settings
     * @param input Input name to check
     */
    private isInput(inputName: string): boolean {
        const inputNameWithoutSuffix = Utilities.inputToProperty(inputName);
        return inputName !== "activate" && inputNameWithoutSuffix !== "" && this.inputs.some(input => input.name === inputNameWithoutSuffix);
    }
}

// Add settings here
/** QueryOData Settings object */
export interface QueryODataSettings extends System.TaskDefaultSettings {
    rawQuery: string;
    rawMethod: string;
    folder: string;
    dataset: string;
    defaultSelect: string;
    defaultFilter: string;
    defaultExpand: string;
    defaultOrderBy: string;
    defaultTop?: number | undefined;
    inputs: Task.TaskInput[];
}
