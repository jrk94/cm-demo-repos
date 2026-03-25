export const TEMPLATE_INTELLISENSE_SYSTEM: string = `
/** Access to MES system */
export interface SystemAPI {
    /**
     * Calls the external system and waits for its reply
     * @param input Input object to send to the system.
     * @return Output object sent by the system.
     */
    call(input: any): Promise<any>;
}

`;
