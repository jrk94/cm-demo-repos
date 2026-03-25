import { Task } from "@criticalmanufacturing/connect-iot-controller-engine";
import { CodeExecutionTask } from "./code-execution.task";
import { VirtualMachineBrowserHandler } from "./execution-engine/virtual-machine-browser";

@Task.TaskModule({
    task: CodeExecutionTask,
    providers: [{
        class: VirtualMachineBrowserHandler,
        isSingleton: true,
        symbol: "VirtualMachineExecutionEngine",
        scope: Task.ProviderScope.Local
    }]
})
export class CodeExecutionModule { }
