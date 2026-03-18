import { resolve } from "path";
import { createHash } from "node:crypto";
import type { Dependencies } from "@criticalmanufacturing/connect-iot-controller-engine";
import { TYPES, DI } from "@criticalmanufacturing/connect-iot-controller-engine";
import type { LLamaChatPromptOptions, LlamaContext, LlamaModel } from "node-llama-cpp";
import { getLlama, LlamaChatSession, resolveModelFile } from "node-llama-cpp";

@DI.Injectable()
export class SLMManager {

    @DI.Inject(TYPES.Dependencies.Logger)
    protected _logger: Dependencies.Logger;

    private _models: Map<string, { model: LlamaModel, context: LlamaContext }> = new Map();
    private _sessions: Map<string, LlamaChatSession> = new Map();

    public async loadModel(modelLocation: string, modelName: string, loadModelSettings: any = {}, contextSettings: any = {}) {
        const id = this.modelSessionId(modelLocation, modelName, loadModelSettings, contextSettings);

        if (!this._models.has(id)) {
            const llama = await getLlama();
            const modelPath = await resolveModelFile(modelName, resolve(modelLocation));
            const model = await llama.loadModel({ modelPath, ...loadModelSettings });
            const context = await model.createContext(Object.assign({
                contextSize: { max: 4096 },
                sequences: 2 // set max sequences here
            }, contextSettings));

            this._models.set(id, { model, context });

            this._logger.debug(`Model '${modelName}' loaded and cached with id ${id}`);
        } else {
            this._logger.debug(`Model '${modelName}' is already loaded, will not do anything ${id}`);
        }

        return id;
    }

    public getModel(modelLocation: string, modelName: string, loadModelSettings: any = {}, contextSettings: any = {}) {

        // Model was not loaded yet, load and cache it
        if (!this._models.has(this.modelSessionId(modelLocation, modelName, loadModelSettings, contextSettings))) {
            return this.loadModel(modelLocation, modelName, loadModelSettings, contextSettings);
        }

        return this._models.get(this.modelSessionId(modelLocation, modelName, loadModelSettings, contextSettings));
    }

    public getSession(modelId: string, systemPrompt: string = "", sessionId: string = ""): { id: string, session: any } {

        if (sessionId === "") {
            sessionId = createHash("sha1").update(modelId + systemPrompt).digest("hex");
        }

        if (this._sessions.has(sessionId)) {
            this._logger.debug(`Session with id ${sessionId} retrieved from cache`);
            return { id: sessionId, session: this._sessions.get(sessionId) };
        } else {
            if (!this._models.has(modelId)) {
                throw new Error(`Model with id ${modelId} not found. Make sure to load the model before trying to get a session for it.`);
            }

            const { context } = this._models.get(modelId);

            if (context.sequencesLeft === 0) {
                this._sessions.values().next().value.dispose({ disposeSequence: true });
                this._sessions.delete(this._sessions.keys().next().value);
                this._logger.debug(`No sequences left in context, disposed the oldest session to free up sequences`);
            }

            const session = new LlamaChatSession({
                contextSequence: context.getSequence(),
                systemPrompt
            });

            this._sessions.set(sessionId, session);
            return { id: sessionId, session };
        }
    }

    public disposeSession(sessionId: string): void {
        if (this._sessions.has(sessionId)) {
            this._sessions.get(sessionId).dispose({ disposeSequence: true });
            this._sessions.delete(sessionId);
            this._logger.debug(`Session with id ${sessionId} disposed and removed from cache`);
        }
    }

    public async promptSession(sessionId: string, prompt: string, schema: any = undefined, functions: any = undefined, options: LLamaChatPromptOptions<undefined> = {}): Promise<string> {

        if (!this._sessions.has(sessionId)) {
            throw new Error(`Session with id ${sessionId} not found. Make sure to get the session before trying to prompt it.`);
        }

        let grammar = undefined;
        if (schema) {
            const llama = await getLlama();
            grammar = await llama.createGrammarForJsonSchema(schema);
        }

        const session = this._sessions.get(sessionId);
        if (functions) {
            return await session.prompt(prompt, Object.assign({
                onResponseChunk: (chunk) => this._logger.debug(`Received chunk from session ${sessionId}: ${JSON.stringify(chunk)}`),
                functions
            }, options));
        } else if (grammar) {
            return await session.prompt(prompt, Object.assign({
                onResponseChunk: (chunk) => this._logger.debug(`Received chunk from session ${sessionId}: ${JSON.stringify(chunk)}`),
                grammar
            }, options));
        } else {
            return await session.prompt(prompt, options);
        }
    }

    private modelSessionId(
        modelLocation: string,
        modelName: string,
        loadModelSettings: any = {},
        contextSettings: any = {}
    ): string {
        const key = JSON.stringify({ modelLocation, modelName, loadModelSettings, contextSettings });
        return createHash("sha1").update(key).digest("hex");
    }
}