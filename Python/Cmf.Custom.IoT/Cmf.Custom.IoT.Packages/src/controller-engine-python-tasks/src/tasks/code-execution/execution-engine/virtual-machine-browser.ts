import {
    injectable
} from "inversify";

import {
    VirtualMachine,
    VirtualMachineOptions
} from "./model/virtual-machine";

@injectable()
export class VirtualMachineBrowserHandler implements VirtualMachine {
    /**
     * Initialize the Virtual Machine
     * @param options Options of the Virtual Machine
     */
    public initialize(options: VirtualMachineOptions): void {
        console.warn("*** BROWSER MODE ***");
        console.warn("Code Execution is not possible to be used inside the browser, otherwise it would be initialized");
    }

    /**
     * Build and execute the Virtual Machine with the code
     * @param code Code to use (will be compiled and reused)
     */
    public async execute(code: string): Promise<any> {
        console.warn("*** BROWSER MODE ***");
        console.warn("Code Execution is not possible to be used inside the browser, otherwise it would be executed");
    }
}
