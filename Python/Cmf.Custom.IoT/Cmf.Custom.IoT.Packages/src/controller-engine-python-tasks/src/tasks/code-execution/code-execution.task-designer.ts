import {
    Injectable
} from "@angular/core";

import {
    TaskDesigner,
    TaskDesignerInstance,
    TaskDesignerContainerService,
    LinkingPort,
    AutoLinkResult,
    TaskProtocol
} from "cmf-core-connect-iot";

import { Task, Utilities, } from "@criticalmanufacturing/connect-iot-controller-engine";
import { CodeExecutionSettings, AUTO_IN, AUTO_OUT } from "./code-execution.task";

@TaskDesigner({
    name: $localize`:@@@criticalmanufacturing/connect-iot-controller-engine-core-tasks/code-execution#TITLE:Code`,
    iconClass: "icon-core-tasks-connect-iot-lg-codeexecution",
    inputs: {
        autoIn: <Task.TaskType>{
            friendlyName: $localize`:@@@criticalmanufacturing/connect-iot-controller-engine-core-tasks/code-execution#AUTO_INPUT_PORT_TEXT:Link here to add new`,
            type: Task.AUTO
        },
        activate: Task.INPUT_ACTIVATE
    },
    outputs: {
        autoOut: <Task.TaskType>{
            friendlyName: $localize`:@@@criticalmanufacturing/connect-iot-controller-engine-core-tasks/code-execution#AUTO_OUTPUT_PORT_TEXT:Link from here to add new`,
            type: Task.AUTO
        },
        success: Task.OUTPUT_SUCCESS,
        error: Task.OUTPUT_ERROR
    },
    protocol: TaskProtocol.All,
    driverOptional: true
})
@Injectable()
export class CodeExecutionDesigner implements TaskDesignerInstance, CodeExecutionSettings {
    // Settings
    tsCode: string[];
    jsCodeBase64: string;
    contextExpirationInMilliseconds: number;
    executionExpirationInMilliseconds: number;
    inputs: Task.TaskInput[];

    constructor(private _container: TaskDesignerContainerService) {
    }

    outputs: Task.TaskOutput[];

    private async processAutoPortLink(autoPort: string, linkingPort: LinkingPort, inputs: Task.TaskInputs, outputs: Task.TaskOutputs):
        Promise<AutoLinkResult> {
        const rt: AutoLinkResult = { messages: [] };

        const inputValidation = this._container.autoPortLinkValidation(Utilities.propertyToInput(linkingPort.name), inputs, outputs);
        const outputValidation = this._container.autoPortLinkValidation(Utilities.propertyToOutput(linkingPort.name), inputs, outputs);

        // Validate port name
        rt.messages = rt.messages.concat(inputValidation).concat(outputValidation);

        // If no error, add input/output
        if (rt.messages.length === 0) {
            const entry = {
                name: linkingPort.name,
                valueType: Object.assign({ friendlyName: linkingPort.name }, linkingPort.type)
            };

            if (autoPort === AUTO_IN) {
                this.inputs.push(entry);
                rt.port = { name: Utilities.propertyToInput(linkingPort.name) };
            } else if (autoPort === AUTO_OUT) {
                this.outputs.push(entry);
                rt.port = { name: Utilities.propertyToOutput(linkingPort.name) };
            }
        }

        return rt;
    }

    /**
     * Resolve the inputs to be displayed in the task during design time
     * @param inputs List of inputs automatically resolved.
     * Return the updated list of inputs to design
     */
    public async onGetInputs(inputs: Task.TaskInputs): Promise<Task.TaskInputs> {
        //  creates a task input for each one in the inputs array
        if (this.inputs) {
            for (const input of this.inputs) {
                const inputName = Utilities.propertyToInput(input.name);
                inputs[inputName] = this._container.getPortName(input);
                this[inputName] = input.defaultValue;
            }
        }
        return inputs;
    }

    /**
     * Resolve the outputs to be displayed in the task during design time
     * @param outputs List of outputs automatically resolved.
     * Return the updated list of outputs to design
     */
    public async onGetOutputs(outputs: Task.TaskOutputs): Promise<Task.TaskOutputs> {
        //  creates a task output for each one in the outputs array
        if (this.outputs) {
            for (const output of this.outputs) {
                const outputName = Utilities.propertyToOutput(output.name);
                outputs[outputName] = this._container.getPortName(output);
            }
        }
        return outputs;
    }

    /**
     * Add Inputs handler. Signals the task that a new link was connected to an 'Auto' input.
     * @param outputPort The output port of the task connecting to this task.
     */
    public async onAutoInputLink(autoPort: string, outputPort: LinkingPort, inputs: Task.TaskInputs, outputs: Task.TaskOutputs): Promise<AutoLinkResult> {
        return this.processAutoPortLink(autoPort, outputPort, inputs, outputs);
    }

    /**
     * Add Outputs handler. Signals the task that a new link was connected to an 'Auto' output.
     * @param inputPort The input port of the task this task is connecting to.
     */
    public async onAutoOutputLink(autoPort: string, inputPort: LinkingPort, inputs: Task.TaskInputs, outputs: Task.TaskOutputs): Promise<AutoLinkResult> {
        return this.processAutoPortLink(autoPort, inputPort, inputs, outputs);
    }
}
