
/** Default api field accessor */
export const DEFAULT_FRAMEWORK_ID: string = "framework";

/** Template content that will appear in the code editor by default */
export const TEMPLATE_CONTENT: string =
`import { Framework } from '${DEFAULT_FRAMEWORK_ID}';
\nexport default class {

    /** Allows accessing external functions */
    private ${DEFAULT_FRAMEWORK_ID}: Framework;

    constructor(${DEFAULT_FRAMEWORK_ID}: Framework) {
        this.${DEFAULT_FRAMEWORK_ID} = ${DEFAULT_FRAMEWORK_ID};
    }

    /*
     * Entry point of the class (IMPORTANT: don't change the signature of this method)
     * Should return an object containing the values for each output to emit
     * If necessary, use the parameter "outputs" to emit data while running the code.
     */
    public async main(inputs: any, outputs: any): Promise<any> {
        // Add code here

        // emit output during execution: outputs.output1.emit("something");
        // return example: return { output1: inputs.input1, output2: "Hello World" };
    }
}
`;
