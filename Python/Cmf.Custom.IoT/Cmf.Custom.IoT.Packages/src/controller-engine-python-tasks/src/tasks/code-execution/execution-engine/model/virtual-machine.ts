export enum VirtualMachineEngineVersion {
    /** Version 1.0.0 */
    v100 = "v1.0.0",
}

/**
 * Options available for the Virtual Machine execution engine
 */
export interface VirtualMachineOptions {
    /** Version of the engine */
    version: VirtualMachineEngineVersion,
    /** Maximum amount of time allowed for the execution */
    timeout: number;
}

/**
 * VM sandbox handler to enable script execution - used for instance in the code execution task
 */
export interface VirtualMachine {
    /**
     * Initialize the Virtual Machine
     * @param options Options of the Virtual Machine
     */
    initialize(options: VirtualMachineOptions): void;

    /**
     * Build and execute the Virtual Machine with the code
     * @param code Code to use (will be compiled and reused)
     */
    execute(code: string): Promise<any>;
}
