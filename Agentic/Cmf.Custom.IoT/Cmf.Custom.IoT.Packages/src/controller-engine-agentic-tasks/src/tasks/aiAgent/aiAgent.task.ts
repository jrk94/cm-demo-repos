import type { Dependencies } from "@criticalmanufacturing/connect-iot-controller-engine";
import { Task, System, TaskBase, TYPES, DI } from "@criticalmanufacturing/connect-iot-controller-engine";
import { defineChatSessionFunction, getLlama, LlamaChatSession, resolveModelFile } from "node-llama-cpp";
import { SLMManager } from "../../slm/slmManager.js";

/** Default values for settings */
export const SETTINGS_DEFAULTS: AiAgentSettings = {
    schema: undefined,
    enablePersistencyAccess: false,
    systemPrompt: "",
    modelLocation: "",
    model: "",
    loadModelSettings: {},
    contextSettings: {},
    promptSettings: {}
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
 * See {@see AiAgentSettings}
 */
@Task.Task()
export class AiAgentTask extends TaskBase implements AiAgentSettings {

    /** Accessor helper for untyped properties and output emitters. */
    // [key: string]: any;

    /** **Inputs** */
    /** Prompt */
    public prompt: string = "";
    public sessionId: string = "";
    public forceCleanSession: boolean;

    /** **Outputs** */
    response: Task.Output<string> = new Task.Output<string>();
    sessionIdOut: Task.Output<string> = new Task.Output<string>();

    /** Properties Settings */
    /** Information about the example setting */
    schema: any = SETTINGS_DEFAULTS.schema;
    enablePersistencyAccess: boolean = SETTINGS_DEFAULTS.enablePersistencyAccess;
    systemPrompt: string = SETTINGS_DEFAULTS.systemPrompt;

    modelLocation: string = SETTINGS_DEFAULTS.modelLocation;
    model: string = SETTINGS_DEFAULTS.model;

    loadModelSettings: any = SETTINGS_DEFAULTS.loadModelSettings;
    contextSettings: any = SETTINGS_DEFAULTS.contextSettings;
    promptSettings: any = SETTINGS_DEFAULTS.promptSettings;

    @DI.Inject(TYPES.Dependencies.Logger)
    protected _logger: Dependencies.Logger;

    /**
     * This is the representation of the SLM manager
     */
    @DI.Inject("GlobalSLMManagerHandler")
    private _slmManager: SLMManager;

    /**
     * When one or more input values is changed this will be triggered,
     * @param changes Task changes
     */
    public override async onChanges(changes: Task.Changes): Promise<void> {
        if (changes["activate"]) {
            // It is advised to reset the activate to allow being reactivated without the value being different
            this.activate = undefined;
            let sessionId = this.sessionId;
            try {

                // Load Model
                const modelId = await this._slmManager.loadModel(this.modelLocation, this.model, this.loadModelSettings, this.contextSettings);
                // Get Session
                const sessionValues = this._slmManager.getSession(modelId, this.systemPrompt, this.sessionId);
                sessionId = sessionValues.id;

                let functions: any = undefined;
                if (this.enablePersistencyAccess) {
                    functions = {
                        listKeysFromPersistency: defineChatSessionFunction({
                            description: "List all keys from the persistency layer.",
                            handler: () => {
                                return this._dataStore.listKeys(System.DataStoreLocation.Temporary);
                            }
                        }),
                        retrieveFromStorePersistency: defineChatSessionFunction({
                            description: "Retrieve information from the persistency layer.",
                            params: {
                                type: "object",
                                properties: {
                                    identifier: {
                                        description: "The key to identify the data to be retrieved. Case insensitive.",
                                        type: "string"
                                    },
                                    defaultValue: {
                                        description: "The default value to return if the key is not found.",
                                        type: "string"
                                    },
                                    maxSize: {
                                        description: "The maximum number of items to retrieve. Please choose a value that makes sense for the data you are trying to retrieve, as retrieving too many items might impact performance. e.g. 2 for a list of the last 2 values of a variable.",
                                        type: "number"
                                    }
                                }
                            },
                            handler: async (params: any) => {
                                let identifier = params.identifier;
                                let defaultValue = params.defaultValue;
                                let maxSize = params.maxSize || 10;

                                let retrievedValue = await this._dataStore.retrieve(identifier, defaultValue);

                                if (retrievedValue === defaultValue) {
                                    identifier = identifier.toLowerCase();
                                    defaultValue = defaultValue.toLowerCase();
                                    retrievedValue = await this._dataStore.retrieve(identifier, defaultValue);
                                }

                                retrievedValue = retrievedValue.storage ? retrievedValue.storage.map((item: any) => item.value) : retrievedValue;

                                if (Array.isArray(retrievedValue) && retrievedValue.length > maxSize) {
                                    retrievedValue = (retrievedValue as Array<any>).slice(-maxSize);
                                }

                                return typeof retrievedValue === "string" ? retrievedValue : JSON.stringify(retrievedValue);
                            }
                        }),
                        storeInPersistency: defineChatSessionFunction({
                            description: "Store information in the persistency layer.",
                            params: {
                                type: "object",
                                properties: {
                                    identifier: {
                                        description: "The key to identify the data to be stored. Case insensitive.",
                                        type: "string"
                                    },
                                    data: {
                                        description: "The data to be stored.",
                                        type: "string"
                                    }
                                }
                            },
                            handler: async (params: any) => {
                                const identifier = params.identifier.toLowerCase();
                                const data = params.data.toLowerCase();

                                return await this._dataStore.store(identifier, data, System.DataStoreLocation.Temporary);
                            }
                        })
                    };
                }

                const result = await this._slmManager.promptSession(sessionId, this.prompt, this.schema, functions, this.promptSettings);
                this.response.emit(this.stripLlamaFunctionMarkup(result.trim()));
                this.sessionIdOut.emit(sessionId);
                if (this.forceCleanSession === true) {
                    this._slmManager.disposeSession(sessionId);
                }

                this.success.emit(true);
            } catch (error) {
                this._slmManager.disposeSession(sessionId);
                this.logAndEmitError(`Error while executing the AiAgent task: ${error instanceof Error ? error.message : String(error)}`);
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

    private stripLlamaFunctionMarkup(response: string): string {
        const keywords = [
            "overview",
            "function",
            "param",
            "returns",
            "description",
            "namespace",
            "type",
            "enum",
            "required",
            "optional",
            "report",
        ];

        const pattern = new RegExp(
            `^\\s*\\|\\|\\s*(${keywords.join("|")})\\s*:.*$`,
            "gmi"
        );

        return response
            .replace(pattern, "")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
    }
}

// Add settings here
/** AiAgent Settings object */
export interface AiAgentSettings extends System.TaskDefaultSettings {
    /** Information about the example setting */
    schema: any;
    enablePersistencyAccess: boolean;
    systemPrompt: string;
    modelLocation: string;
    model: string;

    loadModelSettings: any;
    contextSettings: any;
    promptSettings: any;
}

@Task.TaskModule({
    task: AiAgentTask,
    providers: [
        {
            class: SLMManager,
            isSingleton: true,
            symbol: "GlobalSLMManagerHandler",
            scope: Task.ProviderScope.Controller,
        }
    ]
})
export class AiAgentModule { }