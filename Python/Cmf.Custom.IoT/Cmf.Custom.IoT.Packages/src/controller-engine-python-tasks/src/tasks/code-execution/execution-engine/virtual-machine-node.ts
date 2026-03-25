import { DI, TYPES } from "@criticalmanufacturing/connect-iot-controller-engine";

import {
    injectable,
    Container
} from "inversify";

import { VirtualMachine, VirtualMachineOptions, VirtualMachineEngineVersion } from "./model/virtual-machine";

import {
    VirtualMachineHandler
} from "./v100/virtual-machine-handler";

@injectable()
export class VirtualMachineNodeHandler implements VirtualMachine {

    // Only one version for now, but be ready for the future
    private _implementation: VirtualMachine;

    @DI.Inject(TYPES.Dependencies.Injector)
    private _container: Container;

    /**
     * Initialize the Virtual Machine
     * @param options Options of the Virtual Machine
     */
    public initialize(options: VirtualMachineOptions): void {
        // Initialize the correct engine depending on the version to use
        if (!this._container.isBound(`VirtualMachineEngine ${options.version}`)) {
            let implementationClass: any;
            switch (options.version) {
                case VirtualMachineEngineVersion.v100:
                    implementationClass = VirtualMachineHandler;
                    break;
                default:
                    throw new Error(`Unknown Virtual Machine Engine version '${options.version}'`);
            }
            this._container.bind(`VirtualMachineEngine ${options.version}`).to(implementationClass);
        }
        this._implementation = this._container.get(`VirtualMachineEngine ${options.version}`);
        this._implementation.initialize(options);
    }

    /**
     * Build and execute the Virtual Machine with the code
     * @param code Code to use
     */
    public async execute(code: any): Promise<any> {
        return (this._implementation.execute(code));
    }
}
