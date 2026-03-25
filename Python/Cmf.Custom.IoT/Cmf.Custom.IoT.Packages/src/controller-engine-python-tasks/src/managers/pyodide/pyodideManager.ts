import { injectable } from "inversify";
import { NodeVM } from "vm2";
import { Dependencies, DI, System, TYPES, Communication } from "@criticalmanufacturing/connect-iot-controller-engine";
import { PyodideSettings } from "./pyodideConfig";
import { PyodideExecutionManager, PyodideOutputsProxy } from "./pyodideExecutionManager";
import { Guid } from "../../utilities/utilities";

/** Symbol used to inject this manager via DI */
export const PYODIDE_MANAGER_SYMBOL = "GlobalPyodideManager";

/**
 * Manages the Pyodide runtime lifecycle, package installation, and sandboxed Python execution.
 * Registered as a Controller-scoped singleton so all tasks in a controller share one Pyodide instance.
 *
 * Execution is sandboxed via NodeVM (vm2), which wraps the JS code that drives Pyodide —
 * the same approach used by the TS code-execution task.
 *
 * The Python code is expected to follow this convention:
 * ```python
 * class Code:
 *     def __init__(self, framework):
 *         self.logger = framework['logger']
 *
 *     async def main(self, inputs, outputs):
 *         value = inputs['myInput']
 *         self.logger.info(f"Processing: {value}")
 *         outputs.myOutput.emit(value * 2)
 *         return { 'myOutput': value * 2 }
 * ```
 */
@injectable()
export class PyodideManager implements PyodideExecutionManager {

    @DI.Inject(TYPES.Dependencies.Logger)
    private _logger: Dependencies.Logger;

    @DI.Inject(TYPES.System.PersistedDataStore)
    private _dataStore: System.DataStore;

    @DI.Inject(TYPES.System.MessageBus)
    private _messageBus: Communication.MessageBus;

    @DI.Inject(TYPES.System.API)
    private _systemApi: System.SystemAPI;

    @DI.Inject(TYPES.System.Driver)
    @DI.Optional()
    private _driver: System.DriverProxy;

    private _pyodide: any = null;
    private _initialized: boolean = false;

    /**
     * Python bootstrap — defines the proxy classes available to user code.
     * Embedded into every execution run so the classes are always in scope.
     *
     * Bridge callables (_log_fn, _emit_fn, …) are injected into Python's own
     * global namespace via pyodide.globals.set() before each execution.
     * No `import js` is used, so the Python sandbox has no access to the JS
     * global scope (globalThis) and cannot reach process, require, or any other
     * Node.js runtime API.
     */
    private readonly _bootstrapPython = `
class _Logger:
    def info(self, msg):    _log_fn("info",    str(msg))
    def warning(self, msg): _log_fn("warning", str(msg))
    def error(self, msg):   _log_fn("error",   str(msg))
    def debug(self, msg):   _log_fn("debug",   str(msg))

class _Output:
    def __init__(self, name):
        self._name = name
    def emit(self, value):
        _emit_fn(self._name, value)

class _Outputs:
    def __getattr__(self, name):
        return _Output(name)

class _DataStore:
    async def get(self, key):
        return await _dataStore_get_fn(key)
    async def set(self, key, value):
        await _dataStore_set_fn(key, value)
`;

    /**
     * Python runner suffix — instantiates the user's Code class and calls main().
     * Appended after the user's code on every execution.
     */
    private readonly _runnerSuffix = `
_code_obj = Code({'logger': _Logger(), 'data_store': _DataStore()})
_result = await _code_obj.main(_inputs, _Outputs())
_result
`;

    public async initialize(settings: PyodideSettings): Promise<void> {
        if (this._initialized) {
            this._logger.warning("PyodideManager already initialized — skipping.");
            return;
        }

        this._logger.debug("Initializing Pyodide runtime...");

        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
            const { loadPyodide } = require("pyodide") as { loadPyodide: (options?: any) => Promise<any> };
            this._pyodide = await loadPyodide();

            // Replace `js` and `pyodide_js` with empty namespaces so user Python
            // code cannot access the Node.js global scope (globalThis) via either
            // `import js` or `import pyodide_js` (both map to globalThis in Pyodide).
            await this._pyodide.runPythonAsync(`
import sys, types
_blocked = types.SimpleNamespace()
sys.modules['js'] = _blocked
sys.modules['pyodide_js'] = _blocked
`);

            if (settings.packages?.length > 0) {
                this._logger.info(`Installing Python packages: ${settings.packages.join(", ")}`);
                await this._pyodide.loadPackage("micropip");
                const micropip = this._pyodide.pyimport("micropip");
                await micropip.install(settings.packages);
                this._logger.info("Python packages installed.");
            }

            this._initialized = true;
            this._logger.info("Pyodide runtime ready.");
        } catch (err) {
            this._logger.error(`Failed to initialize Pyodide: ${err.message}`);
            throw err;
        }
    }

    /**
     * Creates a NodeVM sandbox, freezes Pyodide and framework services into it,
     * and returns a sandboxed async function that runs the given Python code.
     *
     * Mirrors the TS code-execution task's execute() method — call once at init,
     * store the result, invoke on each activation.
     */
    public async compile(
        code: string
    ): Promise<(inputs: Record<string, any>, outputs: PyodideOutputsProxy) => Promise<any>> {
        if (!this._initialized || this._pyodide == null) {
            throw new Error("PyodideManager is not initialized. Call initialize() first.");
        }

        // _isPyProxy is passed via sandbox so the VM can convert the Python return
        // value without relying on pyodide.isPyProxy (removed in 0.27+) or
        // pyodide.ffi.PyProxy (not reachable through vm2's freeze proxy).
        const isPyProxy = (v: any) => v instanceof this._pyodide.ffi.PyProxy;

        const vm = new NodeVM({
            sandbox: {
                _bootstrapPython: this._bootstrapPython,
                _userCode: code,
                _runnerSuffix: this._runnerSuffix,
                _isPyProxy: isPyProxy,
            }
        });

        vm.freeze(this._pyodide, "pyodide");
        vm.freeze(this._logger, "logger");
        vm.freeze(this._dataStore, "dataStore");
        vm.freeze(this._messageBus, "messageBus");
        vm.freeze(this._systemApi, "system");
        if (this._driver != null) {
            vm.freeze(this._driver, "driver");
        }

        // Bridge callables are injected into Python's own isolated namespace via
        // pyodide.globals.set() — not onto globalThis — so the Python sandbox
        // cannot reach any Node.js runtime API (process, require, fs, …).
        const vmCode = `
            module.exports = async function(inputs, outputs) {
                pyodide.globals.set("_log_fn", function(level, msg) {
                    if (level === "info") { logger.info(msg); }
                    else if (level === "warning") { logger.warning(msg); }
                    else if (level === "error") { logger.error(msg); }
                    else if (level === "debug") { logger.debug(msg); }
                });
                pyodide.globals.set("_emit_fn", function(name, value) {
                    const jsVal = _isPyProxy(value) ? value.toJs() : value;
                    if (outputs[name] != null) {
                        outputs[name].emit(jsVal);
                    } else {
                        logger.warning("Python emitted to unknown output: " + name);
                    }
                });
                pyodide.globals.set("_dataStore_get_fn", async function(key) {
                    return dataStore.get(key);
                });
                pyodide.globals.set("_dataStore_set_fn", async function(key, value) {
                    return dataStore.set(key, value);
                });

                pyodide.globals.set("_inputs", pyodide.toPy(inputs));

                const fullCode = _bootstrapPython + "\\n" + _userCode + "\\n" + _runnerSuffix;
                const result = await pyodide.runPythonAsync(fullCode);
                return _isPyProxy(result) ? result.toJs() : result;
            };
        `;

        return vm.run(vmCode, `${__dirname}/pyodideRunner-${Guid.newGuid()}.js`);
    }

    public async destroy(): Promise<void> {
        this._pyodide = null;
        this._initialized = false;
        this._logger.info("PyodideManager destroyed.");
    }
}
