import { Task, System, TaskBase, DI, WorkflowPlan, TYPES } from "@criticalmanufacturing/connect-iot-controller-engine";
import { LLMWithMCP } from "../../llm/llm";

/** Default values for settings */
export const SETTINGS_DEFAULTS: AgenticSettings = {
    model: "gpt-4.1-2025-04-14",
    temperature: 0.7,
    destroySessionOnSuccess: true,
    prompt: "",
    systemPrompt: "",
    apiKey: "",
};

/**
 * @whatItDoes
 *
 * This task interacts with a Large Language Model (LLM) to generate responses based on provided prompts. It allows for both a user prompt and a system prompt, which can be used to guide the behavior of the LLM. The task can be configured to destroy the session with the LLM after each execution, which can help manage resources but may increase response time for subsequent calls.
 *
 * @howToUse
 *
 * Specify an apikey and a prompt to get a response from the LLM. The system prompt can be used to provide additional instructions to the LLM to guide its behavior. If "Always Close Session" is enabled, the session with the LLM will be closed after each execution, which can help manage resources but may increase response time for subsequent calls.
 *
 * ### Inputs
 * * `any` : **activate** - Activate the task
 * * `string` : **systemPrompt** - System prompt to guide the LLM's behavior
 * * `string` : **prompt** - User prompt for the LLM
 * * `boolean` : **destroySessionOnSuccess** - Whether to close the session after execution
 *
 * ### Outputs
 *
 * * `any`  : ** result ** - The response from the LLM
 * * `bool`  : ** success ** - Triggered when the the task is executed with success
 * * `Error` : ** error ** - Triggered when the task failed for some reason
 *
 * ### Settings
 * See {@see AgenticSettings}
 */
@Task.Task()
export class AgenticTask extends TaskBase implements AgenticSettings {

    /** Accessor helper for untyped properties and output emitters. */
    // [key: string]: any;

    @DI.Inject("GlobalLLMHandler")
    private _globalLLMHandler: LLMWithMCP;

    /** **Inputs** */
    public systemPrompt: string;
    public prompt: string;
    public destroySessionOnSuccess: boolean;

    /** **Outputs** */
    public result = new Task.Output<any>();

    /** Properties Settings */
    /** Information about the example setting */
    model: string;
    temperature: number;
    apiKey: string;

    /**
     * When one or more input values is changed this will be triggered,
     * @param changes Task changes
     */
    public override async onChanges(changes: Task.Changes): Promise<void> {
        if (changes["activate"]) {
            // It is advised to reset the activate to allow being reactivated without the value being different
            this.activate = undefined;

            try {
                this._logger.info("Starting Agentic....");
                await this._globalLLMHandler.init(this.apiKey);
                const chatResult = await this._globalLLMHandler.chat([
                    {
                        role: "user",
                        content: this.prompt,
                    },
                ], {
                    model: this.model,
                    temperature: this.temperature,
                    systemPrompt: this.systemPrompt
                });

                this._logger.info("Finishing Agentic....");
                this.result.emit(chatResult);
                this.success.emit(true);
            } catch (e) {
                this.logAndEmitError((e as Error).message);
            }

            if (this.destroySessionOnSuccess) {
                this._logger.debug("Will disconnect Session");
                this._globalLLMHandler.disconnectAll();
                this._logger.info("Disconnected Session");
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
/** Agentic Settings object */
export interface AgenticSettings extends System.TaskDefaultSettings {
    /** Information about the example setting */
    model: string;
    temperature: number;
    destroySessionOnSuccess: boolean;
    prompt: string;
    systemPrompt: string;
    apiKey: string;
}

@Task.TaskModule({
    task: AgenticTask,
    providers: [
        {
            class: LLMWithMCP,
            isSingleton: true,
            symbol: "GlobalLLMHandler",
            scope: Task.ProviderScope.Controller,
        }
    ]
})
export class AgenticModule { }