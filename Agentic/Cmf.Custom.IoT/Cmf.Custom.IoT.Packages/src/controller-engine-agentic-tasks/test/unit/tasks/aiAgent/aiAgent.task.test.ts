// import "reflect-metadata";
// import { Task } from "@criticalmanufacturing/connect-iot-controller-engine";
// import EngineTestSuite from "@criticalmanufacturing/connect-iot-controller-engine/test";
// import * as chai from "chai";

// import {
//     AiAgentTask,
// } from "../../../../src/tasks/aiAgent/aiAgent.task.js";

// import type { AiAgentSettings } from "../../../../src/tasks/aiAgent/aiAgent.task.js";

// class SLMManagerMock {
//     public loadModel = async (_modelLocation: string, _modelName: string, _loadModelSettings: any, _contextSettings: any): Promise<string> => {
//         return "mock-model-id";
//     };

//     public getSession = (_modelId: string, _systemPrompt: string, sessionId: string): { id: string, session: any } => {
//         return { id: sessionId || "mock-session-id", session: {} };
//     };

//     public promptSession = async (_sessionId: string, _prompt: string, _schema: any, _functions: any): Promise<string> => {
//         return "mock-response";
//     };

//     public disposeSession = (_sessionId: string): void => {
//         // no-op
//     };
// }

// describe("AiAgent Task tests", () => {

//     const defaultSettings: AiAgentSettings = {
//         schema: undefined,
//         enablePersistencyAccess: false,
//         systemPrompt: "You are a helpful assistant",
//         modelLocation: "/models",
//         model: "test-model.gguf",
//         loadModelSettings: {},
//         contextSettings: {}
//     };

//     // eslint-disable-next-line @typescript-eslint/ban-types
//     const aiAgentTestFactory = (settings: AiAgentSettings | undefined, trigger: Function, validate: Function): void => {

//         const taskDefinition = {
//             class: AiAgentTask,
//             id: "0",
//             settings: (settings || defaultSettings)
//         };

//         EngineTestSuite.createTasks([
//             taskDefinition,
//             {
//                 id: "1",
//                 class: Task.Task({
//                     name: "mockTask"
//                 })(class MockTask implements Task.TaskInstance {
//                     [key: string]: any;
//                     _outputs: Map<string, Task.Output<any>> = new Map<string, Task.Output<any>>();

//                     async onBeforeInit(): Promise<void> {
//                         this["activate"] = new Task.Output<any>();
//                         this._outputs.set("activate", this["activate"]);
//                         this["prompt"] = new Task.Output<any>();
//                         this._outputs.set("prompt", this["prompt"]);
//                         this["sessionId"] = new Task.Output<any>();
//                         this._outputs.set("sessionId", this["sessionId"]);
//                         this["forceCleanSession"] = new Task.Output<any>();
//                         this._outputs.set("forceCleanSession", this["forceCleanSession"]);
//                     }

//                     // Trigger the test
//                     async onInit(): Promise<void> {
//                         trigger(this._outputs);
//                     }

//                     // Validate the results
//                     async onChanges(changes: Task.Changes): Promise<void> {
//                         validate(changes);
//                     }
//                 })
//             }
//         ], [
//             { sourceId: "1", outputName: "activate", targetId: "0", inputName: "activate" },
//             { sourceId: "1", outputName: "prompt", targetId: "0", inputName: "prompt" },
//             { sourceId: "1", outputName: "sessionId", targetId: "0", inputName: "sessionId" },
//             { sourceId: "1", outputName: "forceCleanSession", targetId: "0", inputName: "forceCleanSession" },
//             { sourceId: "0", outputName: "success", targetId: "1", inputName: "success" },
//             { sourceId: "0", outputName: "error", targetId: "1", inputName: "error" },
//             { sourceId: "0", outputName: "response", targetId: "1", inputName: "response" },
//         ],
//             undefined,
//             (container) => {
//                 container.bind("GlobalSLMManagerHandler").toConstantValue(new SLMManagerMock());
//             });
//     };

//     /**
//      * Instructions about the tests
//      * It is assumed that there are two tasks:
//      *    0 - AiAgent Task
//      *    1 - Mockup task
//      *
//      * All Outputs of Mock task are connected to the inputs of the AiAgent task
//      * All Outputs of AiAgent Task are connected to the Mock task inputs
//      *
//      * The mock SLMManager is injected via the container to avoid real model loading.
//      */

//     it("should get success when activated", (done) => {
//         aiAgentTestFactory(undefined,
//             (outputs: Map<string, Task.Output<any>>) => {
//                 outputs.get("activate").emit(true);
//             }, (changes: Task.Changes) => {
//                 if (changes["success"]) {
//                     chai.expect(changes["success"].currentValue).to.equal(true);
//                     done();
//                 }
//             });
//     });

//     it("should emit response when activated with a prompt", (done) => {
//         aiAgentTestFactory(undefined,
//             (outputs: Map<string, Task.Output<any>>) => {
//                 outputs.get("prompt").emit("Hello, how are you?");
//                 outputs.get("activate").emit(true);
//             }, (changes: Task.Changes) => {
//                 if (changes["response"]) {
//                     chai.expect(changes["response"].currentValue).to.equal("mock-response");
//                     done();
//                 }
//             });
//     });

//     it("should emit error when SLM manager fails", (done) => {
//         const failingSlmSettings: AiAgentSettings = {
//             ...defaultSettings,
//             model: "nonexistent-model.gguf"
//         };

//         const taskDefinition = {
//             class: AiAgentTask,
//             id: "0",
//             settings: failingSlmSettings
//         };

//         EngineTestSuite.createTasks([
//             taskDefinition,
//             {
//                 id: "1",
//                 class: Task.Task({
//                     name: "mockTask"
//                 })(class MockTask implements Task.TaskInstance {
//                     [key: string]: any;
//                     _outputs: Map<string, Task.Output<any>> = new Map<string, Task.Output<any>>();

//                     async onBeforeInit(): Promise<void> {
//                         this["activate"] = new Task.Output<any>();
//                         this._outputs.set("activate", this["activate"]);
//                     }

//                     async onInit(): Promise<void> {
//                         this._outputs.get("activate").emit(true);
//                     }

//                     async onChanges(changes: Task.Changes): Promise<void> {
//                         if (changes["error"]) {
//                             chai.expect(changes["error"].currentValue).to.be.instanceOf(Error);
//                             done();
//                         }
//                     }
//                 })
//             }
//         ], [
//             { sourceId: "1", outputName: "activate", targetId: "0", inputName: "activate" },
//             { sourceId: "0", outputName: "success", targetId: "1", inputName: "success" },
//             { sourceId: "0", outputName: "error", targetId: "1", inputName: "error" },
//         ],
//             undefined,
//             (container) => {
//                 container.bind("GlobalSLMManagerHandler").toConstantValue({
//                     loadModel: async () => { throw new Error("Model loading failed"); },
//                     getSession: () => { return { id: "mock-session-id", session: {} }; },
//                     promptSession: async () => { return ""; },
//                     disposeSession: () => { }
//                 });
//             });
//     });
// });
