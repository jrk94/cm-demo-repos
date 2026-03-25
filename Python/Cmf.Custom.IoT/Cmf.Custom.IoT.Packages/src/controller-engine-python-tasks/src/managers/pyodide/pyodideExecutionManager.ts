import { PyodideSettings } from "./pyodideConfig";

/** Proxy object exposing named output emitters to Python code */
export type PyodideOutputsProxy = Record<string, { emit: (value: any) => void }>;

/**
 * Contract for the Pyodide execution manager.
 * Handles Pyodide lifecycle, package installation, and sandboxed Python execution.
 */
export interface PyodideExecutionManager {
    /**
     * Initializes Pyodide and installs the requested packages via micropip.
     * Must be called once before compile().
     * @param settings Manager settings including packages list
     */
    initialize(settings: PyodideSettings): Promise<void>;

    /**
     * Compiles the Python code into a sandboxed runnable function via NodeVM.
     * Call this once at init time and store the result — mirrors the TS code-execution pattern.
     *
     * @param code Python source code to sandbox
     * @returns A sandboxed async function: (inputs, outputs) => Promise<any>
     */
    compile(code: string): Promise<(inputs: Record<string, any>, outputs: PyodideOutputsProxy) => Promise<any>>;

    /**
     * Tears down the Pyodide runtime and releases resources.
     */
    destroy(): Promise<void>;
}
