import { Task, System, TaskBase } from "@criticalmanufacturing/connect-iot-controller-engine";
import * as path from "path";

/** Default values for settings */
export const SETTINGS_DEFAULTS: AiAgentSettings = {
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
 * See {@see AiAgentSettings}
 */
@Task.Task()
export class AiAgentTask extends TaskBase implements AiAgentSettings {

    /** Accessor helper for untyped properties and output emitters. */
    // [key: string]: any;

    /** **Inputs** */
    /** Prompt */
    public prompt: string = "";

    /** **Outputs** */


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
                const { getLlama, LlamaChatSession, resolveChatWrapper } =
                    await (new Function('return import("node-llama-cpp")')() as Promise<typeof import("node-llama-cpp")>);



                const llama = await getLlama();
                const model = await llama.loadModel({
                    modelPath: path.resolve(__dirname, "../../..", "models", "hf_bartowski_Phi-3.1-mini-4k-instruct.Q8_0.gguf")
                });
                const context = await model.createContext({
                    contextSize: 4096,
                    threads: 16
                });
                const session = new LlamaChatSession({
                    contextSequence: context.getSequence(),
                    chatWrapper: resolveChatWrapper(model)
                });


                const q1 = "What is the capital of germany?";
                console.log("User: " + q1);

                const abortController = new AbortController();
                const timeout = setTimeout(() => abortController.abort(), 60_000);

                const a1 = await session.prompt(q1, {
                    maxTokens: 256,
                    signal: abortController.signal,
                    onTextChunk: (chunk) => process.stdout.write(chunk)
                });
                clearTimeout(timeout);
                console.log("\nAI: " + a1);

















                // const llama = await getLlama();

                // const modelPath = path.resolve(__dirname, "../../..", "models", "hf_bartowski_Phi-3.1-mini-4k-instruct.Q8_0.gguf");

                // const model = await llama.loadModel({
                //     modelPath,
                //     gpuLayers: {
                //         fitContext: {
                //             contextSize: 16384
                //         },
                //         max: 41
                //     },
                //     useMmap: true,
                //     useDirectIo: true
                // });

                // // Use the model overload - reads jinja template directly from the model's native bindings
                // // and correctly auto-detects the wrapper (avoids silent fallback to GeneralChatWrapper)
                // const chatWrapper = resolveChatWrapper(model);
                // console.log("Chat wrapper:", chatWrapper.wrapperName);

                // const context = await model.createContext({
                //     contextSize: 16384,
                //     threads: 16
                // });

                // const session = new LlamaChatSession({
                //     contextSequence: context.getSequence(),
                //     chatWrapper: chatWrapper
                // });

                // console.log("Model BOS token:", model.tokens.bos, "EOS token:", model.tokens.eos);

                // const userPrompt = "Hello, can you help me with a simple question? Always reply only with a yes or no.";
                // console.log("Prompt:", userPrompt);

                // const response = await session.prompt(
                //     userPrompt,
                //     {
                //         temperature: 0.5,
                //         maxTokens: 128,
                //         repeatPenalty: {
                //             penalty: 1.1,
                //             lastTokens: 64
                //         },
                //         onTextChunk: (chunk) => process.stdout.write(chunk)
                //     }
                // );

                // console.log("\n\nFinal:", response);

                await model.dispose();

            } catch (error) {
                console.error("LLM error:", error);
            }


            // ... code here
            this.success.emit(true);

            // or
            this._logger.error(`Something very wrong just happened! Log it!`);
            this.error.emit(new Error("Will stop processing, but Error output will be triggered with this value"));
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
/** AiAgent Settings object */
export interface AiAgentSettings extends System.TaskDefaultSettings {
    /** Information about the example setting */
    example: string;
}
