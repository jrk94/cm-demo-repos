import { Task, Dependencies, System, DI, TYPES, Utilities } from "@criticalmanufacturing/connect-iot-controller-engine";
import { Buffer } from "buffer";
import { VirtualMachine, VirtualMachineEngineVersion } from "./execution-engine/model/virtual-machine";

/** Default values for settings */
export const SETTINGS_DEFAULTS: CodeExecutionSettings = {
    tsCode: [],
    jsCodeBase64: "",
    inputs: [],
    outputs: [],
    contextExpirationInMilliseconds: 10000,
    executionExpirationInMilliseconds: 0 // default is disabled because is only effective while running synchronous code
};

/** String encoding utility constants */
type BufferEncoding = Parameters<typeof Buffer.from>[1];
export const BASE64: BufferEncoding = "base64";
export const ASCII: BufferEncoding = "ascii";

/** String encoding utility constants */
export function encode(text: string): string {
    return Buffer.from(text).toString(BASE64);
}
export function decode(encodedText: string): string {
    return Buffer.from(encodedText, BASE64).toString(ASCII);
}

/** Auto input port key */
export const AUTO_IN: string = "autoIn";
/** Auto output port key */
export const AUTO_OUT: string = "autoOut";

/**
 * @whatItDoes
 * This task allows to write custom code in typescript using the GUI
 * and execute it in an sandbox
 *
 * @howToUse
 * Add the needed inputs and outputs to the task
 * Write the code using the code editor in settings
 * 'Activate' triggers the execution of the code with the values of inputs
 * received within the same execution context
 *
 * ### Inputs
 * * `any` : **activate** - Activate the task
 *
 * ### Outputs

 * * `bool`  : ** success ** - Triggered when the the task is executed with success
 * * `Error` : ** error ** - Triggered when the task failed for some reason
 *
 * ### Settings
 * See {@see CodeExecutionSettings}
 */
@Task.Task()
export class CodeExecutionTask implements Task.TaskInstance, CodeExecutionSettings {

    private _syncContexts: Map<string, CodeTaskExecutionContext> = new Map<string, CodeTaskExecutionContext>();
    private _sandBoxedCode: Function = undefined;

    @DI.Inject("VirtualMachineExecutionEngine")
    private _vmHandler: VirtualMachine;

    @DI.Inject(TYPES.Dependencies.Logger)
    private _logger: Dependencies.Logger;

    @DI.Inject(TYPES.Dependencies.ExecutionContext)
    private _executionContext: Dependencies.ExecutionContext;

    /** **Inputs** */
    /** Activate task execution */
    @Task.InputProperty(Task.INPUT_ACTIVATE)
    public activate: any = undefined;

    /** **Outputs** */
    /** To output a success notification */
    @Task.OutputProperty(Task.OUTPUT_SUCCESS)
    public success: Task.Output<boolean> = new Task.Output<boolean>();
    /** To output an error notification */
    @Task.OutputProperty(Task.OUTPUT_ERROR)
    public error: Task.Output<Error> = new Task.Output<Error>();

    /** Settings */
    inputs: Task.TaskInput[];
    outputs: Task.TaskOutput[];
    /** TypeScript code */
    tsCode: string[];
    /** JavaScript code encoded in base64 */
    jsCodeBase64: string;
    /** Expirations timeout */
    contextExpirationInMilliseconds: number;
    executionExpirationInMilliseconds: number;

    /**
     * Checks if a given input is an input defined in settings
     * @param input Input name to check
     */
    private isInput(inputName: string): boolean {
        const inputNameWithoutSuffix = Utilities.inputToProperty(inputName);
        return inputName !== "activate" && inputNameWithoutSuffix !== "" && this.inputs.some(input => input.name === inputNameWithoutSuffix);
    }

    /**
     * Checks if a given output is an emitter defined in settings
     * @param output Output name to check
     */
    private isOutput(outputName: string): boolean {
        const outputNameWithSuffix = Utilities.propertyToOutput(outputName);
        const output: Task.Output<any> = this[outputNameWithSuffix];
        if (output != null && typeof output.emit === "function") {
            return true;
        } else {
            return false;
        }
    }

    /**
     * When one or more input values is changed this will be triggered,
     * @param changes Task changes
     */
    async onChanges(changes: Task.Changes): Promise<void> {
        // Get current execution context and create an entry in the map if it doesn't exist
        if (!this._syncContexts.has(this._executionContext.name)) {
            this._syncContexts.set(this._executionContext.name, {
                name: this._executionContext.name,
                expirationTimeout: null,
                values: {}
            });
        }
        const syncContext = this._syncContexts.get(this._executionContext.name);

        // Reset sync context's expiration timeout
        if (syncContext.expirationTimeout != null) {
            clearTimeout(syncContext.expirationTimeout);
            syncContext.expirationTimeout = null;
        }

        // Update sync context values and reset changes
        for (const key in changes) {
            if (this.isInput(key)) {
                const propertyName = Utilities.inputToProperty(key);

                // If there was already a previous value associated with the context, log as debug
                const previousValue = syncContext.values[propertyName];
                if (previousValue != null) {
                    this._logger.debug(`Property '${propertyName}' was already defined for context '${syncContext.name}'. Value lost: ${previousValue}`);
                }

                syncContext.values[propertyName] = changes[key].currentValue;
                this[key] = undefined;
            }
        }

        if (changes["activate"]) {
            this.activate = undefined;
            const currentContext = this._executionContext.current;

            // Remove execution context
            this._syncContexts.delete(syncContext.name);

            // Call custom code
            try {
                // Provide runtime access to outputs (necessary to implement a kind of
                // foreach behavior where the flow continues while the code is being executed)
                const runtimeOutputs: any = {};
                for (const output of this.outputs) {
                    // Running the outputs directly using outputs.<name>.emit("...") would lose the zone
                    // if previously somewhere, you had an "await" call
                    runtimeOutputs[output.name] = {};
                    runtimeOutputs[output.name].emit = (value: any) => {
                        currentContext.run(() => {
                            this[Utilities.propertyToOutput(output.name)].emit(value);
                        });
                    };
                }

                // Prepare the inputs that have default and were not updated with links
                for (const input of this.inputs) {
                    if (syncContext.values[input.name] == null && input.defaultValue != null) {
                        this._logger.debug(`Setting input: '${input.name}' with the default value: '${input.defaultValue}'.`);
                        syncContext.values[input.name] = input.defaultValue;
                    }
                }

                // Run the code in a sandbox inside the VM
                if (this._sandBoxedCode == null) {
                    throw new Error(`No code defined`);
                }

                let result: any;
                try {
                    result = await this._sandBoxedCode(syncContext.values, runtimeOutputs);
                } catch (error) {
                    this._logger.error(`Failed to execute code with error '${error.message}'`);
                    this._logger.error(`Stack Trace: ${error.stack ?? "No Stack"}`);
                    throw error;
                }

                // Sandbox destroys the zone context, so use this to keep it
                currentContext.run(() => {
                    if (result != null) {
                        // Emit outputs set in result
                        for (const key in result) {
                            if (this.isOutput(key)) {
                                const output: Task.Output<any> = this[Utilities.propertyToOutput(key)];
                                output.emit(result[key]);
                            }
                        }
                    }

                    // Even without a result, it is a success
                    this.success.emit(true);
                });
            } catch (err) {
                // If sandbox executed, the zone context may have been lost, so enforce it
                currentContext.run(() => {
                    this._logger.error(err.message);
                    this.error.emit(err);
                });
            }
        } else {
            // Set the expiration timeout of the sync context
            if (this.contextExpirationInMilliseconds > 0) {
                syncContext.expirationTimeout = setTimeout(() => {
                    this._syncContexts.delete(syncContext.name);
                    this._logger.warning(`Execution context '${syncContext.name}' has expired. Lost inputs: ${Object.keys(syncContext.values)}`);
                }, this.contextExpirationInMilliseconds);
            }
        }
    }

    /** Right after settings are loaded, create the needed dynamic outputs. */
    async onBeforeInit(): Promise<void> {
        if (this.outputs != null && this.outputs.length > 0) {
            for (const output of this.outputs) {
                this[Utilities.propertyToOutput(output.name)] = new Task.Output<any>();
            }
        }
    }

    /** Initialize this task, register any event handler, etc */
    async onInit(): Promise<void> {
        if (!this.jsCodeBase64) {
            this._logger.error(`No code defined`);
            return;
        }

        const jsCode = decode(this.jsCodeBase64);
        try {
            // Prepare VM
            this._vmHandler.initialize({
                version: VirtualMachineEngineVersion.v100,
                timeout: this.executionExpirationInMilliseconds <= 0 ? undefined : this.executionExpirationInMilliseconds,
            });
            this._sandBoxedCode = await this._vmHandler.execute(jsCode);
        } catch (err) {
            this._logger.error(`Failed to compile script: ${err.message}`);
        }
    }
}

/**
 * Settings definition
 */
export interface CodeExecutionSettings extends System.TaskDefaultSettings {
    /** Typescript code encoded in base64 */
    tsCodeBase64?: string;
    /** Typescript code encoded in base64 */
    tsCode: string[];
    /** Javascript/Typescript mappings encoded in base64 */
    mapCodeBase64?: string;
    /** Javascript code encoded in base64 */
    jsCodeBase64: string;
    /** Time an execution context is stored without updates */
    contextExpirationInMilliseconds: number;
    /**
     * Maximum time the code can take to execute before returning an error
     * This timeout is only effective while running synchronous code
     */
    executionExpirationInMilliseconds: number;
}

/**
 * Object that contains the input values received for a given execution context
 * as well as an handler to its expiration timeout
 */
export interface CodeTaskExecutionContext {
    /**
     * Handler to the expiration timeout for canceling it
     */
    expirationTimeout: ReturnType<typeof setTimeout>;
    /**
     * Name of the associated execution context
     */
    name: string;
    /**
     * Object with input names and the respective received values
     */
    values: { [key: string]: any };
}
