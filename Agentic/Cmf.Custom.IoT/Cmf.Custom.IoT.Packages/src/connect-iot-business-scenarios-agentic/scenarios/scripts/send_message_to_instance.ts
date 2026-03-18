import Cmf, { CMFMap } from "cmf-lbos";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class SendMessageToInstanceWrapper {
    [key: string]: any;

    private SendMessageToInstance() {
        // PackagePacker: Start of Script
        (async () => {

            const inputAction = new Cmf.Foundation.BusinessOrchestration.DynamicExecutionEngineManagement.InputObjects.GetActionByNameInput();
            inputAction.Name = "SendMessageToInstance";

            const action = ((await this.System.call(inputAction)) as Cmf.Foundation.BusinessOrchestration.DynamicExecutionEngineManagement.OutputObjects.GetActionByNameOutput).Action;

            if (this.answers.SessionId == null || this.answers.SessionId === "") {
                this.answers.SessionId = this.utilService.uuidv4();
            }

            const inputData: any = new Map<string, any>();
            inputData.set("AutomationControllerInstanceId", this.answers.instanceToTalkWith.Id);
            inputData.set("Message", this.answers.question);
            inputData.set("SessionId", this.answers.SessionId);

            const input = new Cmf.Foundation.BusinessOrchestration.DynamicExecutionEngineManagement.InputObjects.ExecuteActionInput();
            input.Action = action;
            input.Input = inputData;

            const results = (await this.System.call(input)) as Cmf.Foundation.BusinessOrchestration.DynamicExecutionEngineManagement.OutputObjects.ExecuteActionOutput;

            return results.Output.get("Reply")["reply"] as string;
        })();
        // PackagePacker: End of Script
    }
}
