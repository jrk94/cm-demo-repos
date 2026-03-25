import "reflect-metadata";
import { Task } from "@criticalmanufacturing/connect-iot-controller-engine";
import EngineTestSuite from "@criticalmanufacturing/connect-iot-controller-engine/dist/test";
import * as chai from "chai";

import {
    PythonCodeTask,
    PythonCodeSettings,
    SETTINGS_DEFAULTS
} from "../../../../src/tasks/pythonCode/pythonCode.task";
import { PyodideManager, PYODIDE_MANAGER_SYMBOL } from "../../../../src/managers/pyodide/pyodideManager";
import { PyodideOutputsProxy } from "../../../../src/managers/pyodide/pyodideExecutionManager";
import { encode } from "../../../../src/utilities/utilities";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Minimal Python stub — satisfies the Code class convention, does nothing */
const MINIMAL_PYTHON = [
    "class Code:",
    "    def __init__(self, fw): pass",
    "    async def main(self, inputs, outputs):",
    "        return {}"
].join("\n");

/** Any-typed input/output, used when the actual type does not matter for the test */
const ANY_TYPE: Task.TaskComplexValueType = { type: Task.TaskValueType.Object };

type SandboxFn = (inputs: Record<string, any>, outputs: PyodideOutputsProxy) => Promise<any>;

/** Builds a lightweight stand-in for PyodideManager. Bound via toConstantValue — no @injectable needed. */
function makeMock(sandboxFn: SandboxFn = async () => null) {
    return {
        initialize: async () => { },
        compile: async (_code: string) => sandboxFn,
        destroy: async () => { }
    };
}

type ExtraLink = { sourceId: string; outputName: string; targetId: string; inputName: string };

/**
 * Wires up PythonCodeTask (id "0") against a MockTask (id "1").
 *
 * Wire name conventions (IoT engine):
 *   - input  wire into  python task: "{propertyName}In"  (e.g. "valueIn")
 *   - output wire from  python task: "{propertyName}Out" (e.g. "resultOut")
 *
 * The mock task automatically exposes an output for every extra link
 * originating from it, so trigger() can emit on those outputs by name.
 */
function createTaskTest(
    settings: Partial<PythonCodeSettings>,
    sandboxFn: SandboxFn,
    trigger: (outputs: Map<string, Task.Output<any>>) => void,
    validate: (changes: Task.Changes) => void,
    extraLinks: ExtraLink[] = []
): void {
    const resolvedSettings: PythonCodeSettings = {
        ...SETTINGS_DEFAULTS,
        pyCodeBase64: encode(MINIMAL_PYTHON),
        ...settings
    };

    EngineTestSuite.createTasks(
        [
            { class: PythonCodeTask, id: "0", settings: resolvedSettings },
            {
                id: "1",
                class: Task.Task({ name: "mockTask" })(
                    class MockTask implements Task.TaskInstance {
                        [key: string]: any;
                        _outputs: Map<string, Task.Output<any>> = new Map();

                        async onBeforeInit(): Promise<void> {
                            this["activate"] = new Task.Output<any>();
                            this._outputs.set("activate", this["activate"]);

                            // Expose any extra outputs the test needs to send to the python task
                            for (const link of extraLinks.filter(l => l.sourceId === "1")) {
                                if (!this._outputs.has(link.outputName)) {
                                    this[link.outputName] = new Task.Output<any>();
                                    this._outputs.set(link.outputName, this[link.outputName]);
                                }
                            }
                        }

                        async onInit(): Promise<void> { trigger(this._outputs); }
                        async onChanges(changes: Task.Changes): Promise<void> { validate(changes); }
                    }
                )
            }
        ],
        [
            { sourceId: "1", outputName: "activate", targetId: "0", inputName: "activate" },
            { sourceId: "0", outputName: "success", targetId: "1", inputName: "success" },
            { sourceId: "0", outputName: "error", targetId: "1", inputName: "error" },
            ...extraLinks
        ],
        undefined,
        (container) => {
            if (container.isBound(PYODIDE_MANAGER_SYMBOL)) {
                container.unbind(PYODIDE_MANAGER_SYMBOL);
            }
            container.bind(PYODIDE_MANAGER_SYMBOL).toConstantValue(makeMock(sandboxFn));
        }
    );
}

// ─── Mock tests ───────────────────────────────────────────────────────────────

describe("PythonCode Task tests", () => {

    it("should emit success when activated with no-op code", (done) => {
        createTaskTest(
            {},
            async () => null,
            (outputs) => outputs.get("activate").emit(true),
            (changes) => {
                chai.expect(changes["success"].currentValue).to.equal(true);
                done();
            }
        );
    });

    it("should emit error when no Python code is defined", (done) => {
        createTaskTest(
            { pyCodeBase64: "" },
            async () => null, // compile() is never reached — _sandboxedCode stays null
            (outputs) => outputs.get("activate").emit(true),
            (changes) => {
                chai.expect(changes["error"].currentValue).to.be.instanceOf(Error);
                done();
            }
        );
    });

    it("should emit error when the Python sandbox throws", (done) => {
        createTaskTest(
            {},
            async () => { throw new Error("boom"); },
            (outputs) => outputs.get("activate").emit(true),
            (changes) => {
                chai.expect(changes["error"].currentValue).to.be.instanceOf(Error);
                chai.expect((changes["error"].currentValue as Error).message).to.include("boom");
                done();
            }
        );
    });

    it("should forward accumulated inputs to the Python sandbox", (done) => {
        let capturedInputs: Record<string, any> | null = null;

        createTaskTest(
            { inputs: [{ name: "value", valueType: ANY_TYPE }], outputs: [] },
            async (inputs) => { capturedInputs = { ...inputs }; return null; },
            (outputs) => {
                // "valueIn" wire → property "value" inside the python task
                outputs.get("valueIn").emit(42);
                outputs.get("activate").emit(true);
            },
            (changes) => {
                if (changes["success"]) {
                    chai.expect(capturedInputs).to.deep.equal({ value: 42 });
                    done();
                }
            },
            [{ sourceId: "1", outputName: "valueIn", targetId: "0", inputName: "valueIn" }]
        );
    });

    it("should use input default values when the input wire was not triggered", (done) => {
        let capturedInputs: Record<string, any> | null = null;

        createTaskTest(
            { inputs: [{ name: "value", valueType: ANY_TYPE, defaultValue: 99 }], outputs: [] },
            async (inputs) => { capturedInputs = { ...inputs }; return null; },
            (outputs) => outputs.get("activate").emit(true),
            (changes) => {
                if (changes["success"]) {
                    chai.expect(capturedInputs?.["value"]).to.equal(99);
                    done();
                }
            }
        );
    });

    it("should emit custom output values returned by the sandbox", (done) => {
        createTaskTest(
            { inputs: [], outputs: [{ name: "result", valueType: ANY_TYPE }] },
            async () => ({ result: 84 }),
            (outputs) => outputs.get("activate").emit(true),
            (changes) => {
                // "resultOut" output wire → mock task input "resultReceived"
                if (changes["resultReceived"] != null) {
                    chai.expect(changes["resultReceived"].currentValue).to.equal(84);
                    done();
                }
            },
            [{ sourceId: "0", outputName: "resultOut", targetId: "1", inputName: "resultReceived" }]
        );
    });

    it("should emit custom output values via the outputs proxy", (done) => {
        createTaskTest(
            { inputs: [], outputs: [{ name: "proxyValue", valueType: ANY_TYPE }] },
            async (_inputs, outputs) => { outputs["proxyValue"].emit(77); return null; },
            (outputs) => outputs.get("activate").emit(true),
            (changes) => {
                if (changes["received"] != null) {
                    chai.expect(changes["received"].currentValue).to.equal(77);
                    done();
                }
            },
            [{ sourceId: "0", outputName: "proxyValueOut", targetId: "1", inputName: "received" }]
        );
    });

    // ─── Integration tests — real Pyodide WASM runtime ────────────────────────

    describe("integration (real Pyodide)", function () {
        // Pyodide WASM init takes several seconds; apply a generous timeout to
        // the whole suite so individual tests inherit it automatically.
        this.timeout(120_000);

        let manager: PyodideManager;

        before(async function () {
            manager = new PyodideManager();

            const stubLogger = {
                info: (_m: string) => { },
                warning: (_m: string) => { },
                error: (m: string) => console.error("[pyodide-test]", m),
                debug: (_m: string) => { }
            };
            (manager as any)._logger = stubLogger;
            (manager as any)._dataStore = { get: async () => null, set: async () => { } };
            (manager as any)._messageBus = {};
            (manager as any)._systemApi = {};

            await manager.initialize({ packages: [], executionTimeoutMs: 0 });
        });

        after(async () => {
            await manager.destroy();
        });

        it("should execute simple Python arithmetic", async () => {
            const code = [
                "class Code:",
                "    def __init__(self, fw): pass",
                "    async def main(self, inputs, outputs):",
                "        return {'answer': 6 * 7}"
            ].join("\n");

            const fn = await manager.compile(code);
            const result = await fn({}, {});
            chai.expect(result["answer"]).to.equal(42);
        });

        it("should receive inputs from the task and use them in Python", async () => {
            const code = [
                "class Code:",
                "    def __init__(self, fw): pass",
                "    async def main(self, inputs, outputs):",
                "        return {'doubled': inputs['x'] * 2}"
            ].join("\n");

            const fn = await manager.compile(code);
            const result = await fn({ x: 21 }, {});
            chai.expect(result["doubled"]).to.equal(42);
        });

        it("should emit values via the outputs proxy from Python", async () => {
            const code = [
                "class Code:",
                "    def __init__(self, fw): pass",
                "    async def main(self, inputs, outputs):",
                "        outputs.out.emit(123)",
                "        return {}"
            ].join("\n");

            const emitted: any[] = [];
            const fn = await manager.compile(code);
            await fn({}, { out: { emit: (v) => emitted.push(v) } });

            chai.expect(emitted).to.deep.equal([123]);
        });

        it("should use the logger bridge without throwing", async () => {
            const code = [
                "class Code:",
                "    def __init__(self, fw):",
                "        self.log = fw['logger']",
                "    async def main(self, inputs, outputs):",
                "        self.log.info('hello from Python')",
                "        self.log.warning('warn')",
                "        self.log.debug('dbg')",
                "        return {'ok': True}"
            ].join("\n");

            const fn = await manager.compile(code);
            const result = await fn({}, {});
            chai.expect(result["ok"]).to.equal(true);
        });

        it("should raise a JavaScript error when Python raises an exception", async () => {
            const code = [
                "class Code:",
                "    def __init__(self, fw): pass",
                "    async def main(self, inputs, outputs):",
                "        raise ValueError('bad input')"
            ].join("\n");

            const fn = await manager.compile(code);
            let threw = false;
            try {
                await fn({}, {});
            } catch (err: any) {
                threw = true;
                chai.expect(err.message).to.include("bad input");
            }
            chai.expect(threw, "expected an error to be thrown").to.be.true;
        });

        it("should handle multiple sequential activations correctly", async () => {
            const code = [
                "class Code:",
                "    def __init__(self, fw): pass",
                "    async def main(self, inputs, outputs):",
                "        return {'n': inputs['n'] + 1}"
            ].join("\n");

            const fn = await manager.compile(code);
            for (const n of [0, 1, 9]) {
                const result = await fn({ n }, {});
                chai.expect(result["n"]).to.equal(n + 1);
            }
        });
    });
});
