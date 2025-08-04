import {
    Task,
    System,
    TaskBase
} from "@criticalmanufacturing/connect-iot-controller-engine";
import superagent from "superagent";

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
 * * `bool`  : ** success ** - Triggered when the the task is executed with success
 * * `Error` : ** error ** - Triggered when the task failed for some reason
 *
 * ### Settings
 * See {@see MlPredictionSettings}
 */
@Task.Task()
export class MlPredictionTask extends TaskBase implements MlPredictionSettings {
    /** **Inputs** */

    /** **Outputs** */

    /** Result of the prediction */
    @Task.OutputProperty()
    public result: Task.Output<any> = new Task.Output<any>();

    public raw: object = {};

    /** Settings */
    inputs: Task.TaskInput[];
    outputs: Task.TaskOutput[];

    /** Properties Settings */
    mlModelName: string;
    mlModelRevision: string;


    /**
     * When one or more input values is changed this will be triggered,
     * @param changes Task changes
     */
    async onChanges(changes: Task.Changes): Promise<void> {
        if (changes["activate"]) {
            // It is advised to reset the activate to allow being reactivated without the value being different
            this.activate = undefined;

            this.guardClauses();

            this._logger.info(`Getting an ML Prediction from the ML Agent - Using ML Model: ${this.mlModelName} - ${this.mlModelRevision}`);

            const inputForMLExec: Map<string, any> = new Map<string, any>();

            inputForMLExec.set("ML_ModelName", this.mlModelName);
            inputForMLExec.set("ML_ModelRevision", this.mlModelRevision);
            inputForMLExec.set("ML_SysProperties_EventId", this["eventId"]);

            let inputs = this.inputs;
            for (const input of inputs) {
                for (const rawEntry of Object.entries(this.raw)) {
                    if (input.name === rawEntry[0]) {
                        this[input.name] = rawEntry[1];
                    }
                }
                if (input.name != "raw") {
                    inputForMLExec.set(input.name, this[input.name] ?? "");
                }
            }

            this._logger.debug("Calling ML Agent: " + this.mlModelName + "[" + this.mlModelRevision + "]");

            const outputMap: Map<string, any> = await this.exec(inputForMLExec);

            if (outputMap.get("Result") != null) {
                this.result.emit(outputMap.get("Result"));
                this._logger.debug("result: " + JSON.stringify(outputMap.get("Result")));

                this.outputs?.forEach(output => {
                    this[output.name].emit(outputMap.get("Result")[output.name]);
                    this._logger.debug(output.name + ": " + JSON.stringify(outputMap.get("Result")[output.name]));
                });

                this.success.emit(true);
                this._logger.info("ML Prediction done successfully");
            } else if (outputMap.get("Error") != null) {
                this.logAndEmitError(outputMap.get("Error"));
            }
        }
    }

    /** Right after settings are loaded, create the needed dynamic outputs. */
    async onBeforeInit(): Promise<void> {
        if (this.inputs != null && this.inputs.length > 0) {
            for (const input of this.inputs) {
                this[input.name] = input.defaultValue;
            }
        }
        if (this.outputs) {
            for (const output of this.outputs) {
                this[output.name] = new Task.Output<any>();
            }
        }
    }

    private guardClauses() {
        if (this.mlModelName == null || this.mlModelName.length === 0) {
            this.logAndEmitError("'mlModelName' not defined");
        }

        if (this.mlModelRevision == null || this.mlModelRevision.length === 0) {
            this.logAndEmitError("'mlModelRevision' not defined");
        }
    }

    /**
     * Calls the ML agent with the given input parameters and returns the output.
     *
     * @param {Map<string, any>} inputParameters - The input parameters for the function.
     * @return {Promise<Map<string, any>>} - The output of the function as a Promise.
     */
    private async exec(inputParameters: Map<string, any>): Promise<Map<string, any>> {
        const output: Map<string, any> = new Map<string, any>();

        const parameters = Object.fromEntries(inputParameters.entries());

        this._logger.debug("Calling ML Agent with the following parameters: " + JSON.stringify(parameters));

        try {
            const res = await superagent
                .post("http://mlplatformagent:8080/ml/predict")
                .set("Content-Type", "application/json")
                .send(parameters);

            output.set("Result", res.body);
        } catch (err: any) {
            output.set("Error", err.message);
        }

        return output;
    }
}

// Add settings here
/** MlPrediction Settings object */
export interface MlPredictionSettings extends System.TaskDefaultSettings {
    /** ML Model Name */
    mlModelName: string;

    /** ML Model Revision */
    mlModelRevision: string;
}

export interface MlPredictionInputSettings extends System.Property {
    /** Name that will appear in Task */
    name: string;

    /** Friendly Name */
    friendlyName?: string;

    /** Value Type */
    valueType: Task.TaskComplexValueType;

    /** Default value that will be used if no other was retrieved */
    defaultValue?: any;
}
