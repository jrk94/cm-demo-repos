
/** Access to MES system */
export interface SystemAPI {
    /**
     * Calls the external system and waits for its reply
     * Note: Currently, LBOs are not accessible, so you must use the "complex" way to call system apis
     * Example:
     *    const serviceInput: any = {};
     *    serviceInput["$type"] = "Cmf.Navigo.BusinessOrchestration.ContainerManagement.InputObjects.EmptyContainerInput, Cmf.Navigo.BusinessOrchestration";
     *    serviceInput.IgnoreLastServiceId = true;
     *    serviceInput["constructor"] = {
     *       "_CMFInternal_HTTPMethod": "POST",
     *       "_CMFInternal_URLSuffix": "api/Container/EmptyContainer"
     *    };
     *    serviceInput.Container = { "$type": "Cmf.Navigo.BusinessObjects.Container, Cmf.Navigo.BusinessObjects", "Name": "Container001", };
     *    const res = await this.api.system.call(serviceInput);
     *
     * @param input Input object to send to the system.
     * @return Output object sent by the system.
     */
    call(input: any): Promise<any>;
}
