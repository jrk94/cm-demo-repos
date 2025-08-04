import { Task, System, TaskBase } from "@criticalmanufacturing/connect-iot-controller-engine";

/** Default values for settings */
export const SETTINGS_DEFAULTS: PathTranslatorSettings = {
    example: "Hello World",
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
 * See {@see PathTranslatorSettings}
 */
@Task.Task()
export class PathTranslatorTask extends TaskBase implements PathTranslatorSettings {

    /** Accessor helper for untyped properties and output emitters. */
    // [key: string]: any;

    /** **Inputs** */
    @Task.InputProperty(Task.TaskValueType.String)
    public fullPath: string;

    /** **Outputs** */
    @Task.OutputProperty(Task.TaskValueType.String)
    public projectName: Task.Output<string> = new Task.Output<string>();

    @Task.OutputProperty(Task.TaskValueType.Object)
    public packageObj: Task.Output<{ Type: string; Name: string; Version: string }> = new Task.Output<{ Type: string; Name: string; Version: string }>();

    @Task.OutputProperty(Task.TaskValueType.Object)
    public context: Task.Output<object> = new Task.Output<object>();

    @Task.OutputProperty(Task.TaskValueType.String)
    public eventTime: Task.Output<string> = new Task.Output<string>();

    /** Properties Settings */
    /** Information about the example setting */
    example: string;

    /**
     * When one or more input values is changed this will be triggered,
     * @param changes Task changes
     */
    public override async onChanges(changes: Task.Changes): Promise<void> {
        if (changes["activate"]) {
            // It is advised to reset the activate to allow being reactivated without the value being different
            this.activate = undefined;

            try {
                const pathLength = this.fullPath.split("\\").length;
                const dir = this.fullPath.split("\\")[pathLength - 2].split("_");
                const file = this.fullPath.split("\\")[pathLength - 1].split(".")[0].split("_");
                const project = this.fullPath.split("\\")[pathLength - 3];

                this.projectName.emit(project);
                this.packageObj.emit({ Type: dir[0], "Name": dir[1], "Version": dir[2] });

                const context = {};
                // TODO :: Probably this will have to be a setting somehow
                context["Type"] = file[0];
                context["Name"] = file[1];

                this.context.emit(context);
                this.eventTime.emit(file[file.length - 1]);

                this.success.emit(true);
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
}

// Add settings here
/** PathTranslator Settings object */
export interface PathTranslatorSettings extends System.TaskDefaultSettings {
    /** Information about the example setting */
    example: string;
}
