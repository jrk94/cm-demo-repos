import {
    Dependencies,
    TYPES,
    Task,
    System,
    Communication,
    DI,
    Utilities
} from "@criticalmanufacturing/connect-iot-controller-engine";

import { NodeVM } from "vm2";

import { VirtualMachine, VirtualMachineOptions } from "../model/virtual-machine";

@DI.Injectable()
export class VirtualMachineHandler implements VirtualMachine {

    @DI.Inject(TYPES.Task.Library)
    private _library: Task.Library;

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

    // Virtual Machine
    private _options: VirtualMachineOptions;
    private _vm: NodeVM;

    /**
     * Initialize the Virtual Machine
     * @param options Options of the Virtual Machine
     */
    public initialize(options: VirtualMachineOptions): void {
        this._logger.debug("Initializing Virtual Machine Engine version 1.0.0");
        this._options = options;
    }

    /**
     * Build and execute the Virtual Machine with the code
     * @param code Code to use
     */
    public async execute(code: string): Promise<any> {
        // Instantiate the VM
        this._vm = new NodeVM({
            timeout: this._options.timeout,
            sandbox: {
                // LBOS are not frozen to allow using setters in the Input objects
                LBOS: System.LBOS
            }
        });

        // Provide the framework as frozen (libs can't be changed)
        this._vm.freeze(this._logger, "logger");
        this._vm.freeze(this._dataStore, "dataStore");
        this._vm.freeze(this._messageBus, "messageBus");
        this._vm.freeze(this._systemApi, "system");
        this._vm.freeze(this._driver, "driver");
        this._vm.freeze({
            convertValueToType: Utilities.convertValueToType,
            sleep: Utilities.sleep,
            ExecuteWithRetry: Utilities.ExecuteWithRetry,
            ExecuteWithSystemErrorRetry: Utilities.ExecuteWithSystemErrorRetry
        }, "utils");
        this._vm.freeze(this._library?.implementations, "additionalLibs");

        // Prepare and execute the code
        const codeToRun = `
            // Compile user code
            ${code}
            const codeClass = exports.default;

            // Prepare the default libs
            const framework = {
                logger: logger,
                dataStore: dataStore,
                messageBus: messageBus,
                system: system,
                LBOS: LBOS,
                utils: utils
            }
            if (driver != null) {
                framework.driver = driver;
            }
            // Prepare the libs provided by other tasks (custom)
            Object.assign(framework, additionalLibs);

            // Return runnable code
            module.exports = function(inputs, outputs) {
                const codeObj = new codeClass(framework);
                return codeObj.main(inputs, outputs);
            }
        `;
        return await this._vm.run(codeToRun, __dirname + "/codeToRun-" + this.generateUuid() + ".js");
    }

    /**
     * Generate universally unique identifier
     */
    private generateUuid(): string {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0, v = c === "x" ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}
