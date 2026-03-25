import { Task } from "@criticalmanufacturing/connect-iot-controller-engine";
import { CodeExecutionTask } from "./code-execution.task";
import { VirtualMachineNodeHandler } from "./execution-engine/virtual-machine-node";

@Task.TaskModule({
    task: CodeExecutionTask,
    providers: [{
        class: VirtualMachineNodeHandler,
        isSingleton: true,
        symbol: "VirtualMachineExecutionEngine",
        scope: Task.ProviderScope.Local
    }]
})
export class CodeExecutionModule { }
