import { AutomationController, AutomationEvent, AutomationEventProperty, AutomationProperty, DataType } from "cmf-core-chatbot/lib/side-bar-bot/script-executer/utils";
import { EventMapping, ScriptScopeBase } from "../types/globals";
import { Cmf } from "cmf-lbos";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class GenerateSecsGemIntegrationWrapper extends ScriptScopeBase {
    // [key: string]: any;

    private generateSecsGemIntegration() {
        // PackagePacker: Start of Script
        (async () => {

            const eventMapping = (this.answers.eventMapping as EventMapping)
            const protocolName = `${this.answers.integrationName} Protocol`;
            const protocolType = "General";
            const packageName = "@criticalmanufacturing/connect-iot-driver-secsgem";
            const description = `This was a SECS-GEM integration generated with Automation Business Scenarios`;
            const parentConfigPath = `/Cmf/Custom/ConnectIoT/${this.answers.integrationName}`;

            //#region Config
            const parentConfig = {
                parentPath: "/Cmf/Custom/ConnectIoT",
                name: `${this.answers.integrationName}`,
                valueType: "",
                value: ""
            };
            await this.masterdataDirector.builder.addConfig(parentConfig.parentPath, parentConfig.name, parentConfig.value, parentConfig.valueType);

            const ipAndAddressConfig = {
                parentPath: `${parentConfigPath}`,
                name: `ipAndAddress`,
                valueType: "string",
                value: this.answers.ipAddressPort
            };
            await this.masterdataDirector.builder.addConfig(ipAndAddressConfig.parentPath, ipAndAddressConfig.name, ipAndAddressConfig.value, ipAndAddressConfig.valueType);

            //#endregion Config

            //#region Build Protocol
            const protocol = {
                name: protocolName,
                type: protocolType,
                packageName: packageName,
                description
            };
            await this.masterdataDirector.buildProtocol(protocol);
            //#endregion Build Protocol

            //#region Build Driver Definition
            const driverDefinition = {
                name: `${this.answers.integrationName} Driver Definition`,
                type: `General`,
                automationProtocol: `${this.answers.integrationName} Protocol`,
                objectType: this.answers.iotEnabledEntity.Name,
                description
            };

            const properties: AutomationProperty[] = [];
            const eventProperties: AutomationEventProperty[] = [];
            const events: AutomationEvent[] = [];

            function getEventName(eventCEID: number | string) {
                return `Event_CEID_${eventCEID?.toString()}`;
            };
            function getPropertyName(propSvid: number | string) {
                return `Property_SVID_${propSvid?.toString()}`;
            };

            eventMapping.forEach((value, eventCEID) => {

                const event: AutomationEvent = {
                    automationDriverDefinition: driverDefinition.name,
                    name: getEventName(eventCEID),
                    deviceEventId: eventCEID?.toString(),
                    extendedData: "{}",
                    isEnabled: true
                };
                events.push(event);

                value.rptidAndSvidList.forEach(rpt => {
                    let index = 1;
                    rpt.svidList.forEach((svidDefinition, svid) => {

                        const automationProperty: AutomationProperty = {
                            automationDriverDefinition: driverDefinition.name,
                            name: getPropertyName(svid),
                            devicePropertyId: svid?.toString(),
                            dataType: svidDefinition.dataType,
                            isWritable: true,
                            isReadable: true,
                            automationProtocolDataType: svidDefinition.automationProtocolDataType,
                            extendedData: "{}",
                        };

                        const eventProperty: AutomationEventProperty = {
                            automationDriverDefinition: driverDefinition.name,
                            automationEvent: event.name,
                            automationProperty: automationProperty.name,
                            extendedData: { reportId: rpt?.rptid?.toString() } as any,
                            order: index
                        };

                        properties.push(automationProperty);
                        eventProperties.push(eventProperty);
                        index++;
                    });
                });
            });


            await this.masterdataDirector.buildDriverDefinition(driverDefinition, properties, events, eventProperties);
            //#endregion Build Driver Definition

            //#region Build Controller
            const controller: AutomationController = {
                name: `${this.answers.integrationName} Controller`,
                type: `General`,
                scope: `ConnectIoT`,
                objectType: this.answers.iotEnabledEntity.Name,
                description,
                tasksPackages: [
                    "@criticalmanufacturing/connect-iot-controller-engine-core-tasks",
                    "@criticalmanufacturing/connect-iot-controller-engine-mes-tasks",
                    "@criticalmanufacturing/connect-iot-controller-engine-secsgem-tasks"
                ],
                // Need to be set later with the correct version
                tasksLibraryPackages: [],
                controllerPackageVersion: undefined
            };

            const driverAlias = `SecsGemDriver`;
            const controllerDriverDefinition = {
                automationController: `${this.answers.integrationName} Controller`,
                name: driverAlias,
                displayName: driverAlias,
                automationDriverDefinition: `${this.answers.integrationName} Driver Definition`,
                color: `#adffc9`,
                order: 1
            };

            const expressions: any[] = [];
            const jsonata = (setting: string, value: string, context = "Settings") => {
                return {
                    context,
                    value: `($updatePath:=function($input,$newDefaultValue){$map($input._inputs,function($v){$v.name="${setting}"?$merge([$v,{"defaultValue":$newDefaultValue}]):$v})};$merge([$,{"_inputs":$updatePath($,"${value}")}]))`
                };
            };

            //#region Setup Workflow
            // Add Driver Event Task
            const rootTaskId = (await this.workflowBuilder.addRootTask(
                "@criticalmanufacturing/connect-iot-controller-engine-core-tasks",
                "driverEvent",
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                driverAlias
            )).id;

            const configFullPath = ipAndAddressConfig.parentPath + "/" + ipAndAddressConfig.name;

            // Add Get Configs Task
            const configTask = await this.workflowBuilder.addTask(
                rootTaskId,
                "handler",
                "@criticalmanufacturing/connect-iot-controller-engine-core-tasks",
                "getConfigurations",
                {
                    "inputs": [],
                    "outputs": [
                        {
                            "name": "ipAddressAndPort",
                            "fullPath": `${configFullPath}`,
                            "valueType": {
                                "name": "String",
                                "type": 4,
                                "collectionType": 0,
                                "referenceType": null,
                                "referenceTypeName": null,
                                "referenceTypeId": null,
                                "friendlyName": "Type"
                            },
                            "settingKey": "name"
                        }
                    ]
                },
                undefined,
                [
                    {
                        name: "ipAddressAndPort",
                        fullPath: configFullPath,
                        valueType: { name: "String", type: 4 },
                        value: "{{ $this.ipAddressAndPortOut }}",
                        dataType: "String"
                    }
                ],
                undefined,
                undefined,
                driverAlias
            );

            expressions.push(jsonata("networkAddress", `{{ $${configTask.name}.ipAddressAndPort.split(':')[0] }}`));
            expressions.push(jsonata("networkPort", `{{ $${configTask.name}.ipAddressAndPort.split(':')[1] }}`));

            // Build equipmentConfig _inputs dynamically from fetched protocol parameters,
            // overriding networkAddress and networkPort defaults with config task expressions.
            const equipmentConfigInputOverrides: Record<string, Partial<any>> = {
                networkAddress: {
                    defaultValue: `{{ $${configTask.name}.ipAddressAndPort.split(':')[0] }}`
                },
                networkPort: {
                    defaultValue: `{{ $${configTask.name}.ipAddressAndPort.split(':')[1] }}`
                }
            };

            const equipmentConfigInputs = (this.answers.automationProtocolParameters as any[]).map(param => {
                const base = {
                    name: param.name,
                    label: param.label ?? param.name,
                    defaultValue: param.value ?? param.defaultValue ?? "",
                    parameter: {
                        $type: "Cmf.Foundation.BusinessObjects.AutomationProtocolParameter, Cmf.Foundation.BusinessObjects",
                        Name: param.name
                    },
                    dataType: param.dataType,
                    automationDataType: param.automationDataType ?? 0,
                    referenceType: param.referenceType ?? 0,
                    description: param.description ?? "",
                    ...(param.valueReferenceType != null && { valueReferenceType: param.valueReferenceType }),
                    ...(param.settings?.enumValues?.length && { settings: { enumValues: param.settings.enumValues } })
                };
                return { ...base, ...(equipmentConfigInputOverrides[param.name] ?? {}) };
            });

            // Add Equipment Config Task
            await this.workflowBuilder.addTask(
                rootTaskId,
                "handler",
                "@criticalmanufacturing/connect-iot-controller-engine-core-tasks",
                "equipmentConfig",
                { _inputs: equipmentConfigInputs },
                [
                    {
                        "name": "networkAddress",
                        "displayName": "networkAddress",
                        "value": `{{ $${configTask.name}.ipAddressAndPort.split(':')[0] }}`,
                        "dataType": "String"
                    },
                    {
                        "name": "networkPort",
                        "displayName": "networkPort",
                        "value": `{{ $${configTask.name}.ipAddressAndPort.split(':')[1] }}`,
                        "dataType": "Integer"
                    }
                ],
                undefined,
                undefined,
                undefined,
                driverAlias,
                undefined,
                expressions
            );

            // Add Driver Command Task
            await this.workflowBuilder.addTask(
                rootTaskId,
                "handler",
                "@criticalmanufacturing/connect-iot-controller-engine-core-tasks",
                "driverCommand",
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                driverAlias
            );

            const workflows: any[] = [];
            const controllerSetupWorkflow = {
                automationController: `${this.answers.integrationName} Controller`,
                name: `Setup`,
                displayName: `Setup`,
                workflow: this.workflowBuilder.getWorkflow(),
                order: 1
            };

            workflows.push(controllerSetupWorkflow);
            //#endregion Setup Workflow

            //#region New Event DataCollection
            // Had to do this as the enum DataType is not known at runtime by SES
            const dataTypeNameMap: Record<number, string> = {
                0: "String",
                1: "Url",
                2: "Long",
                3: "Decimal",
                4: "DateTime",
                5: "Duration",
                6: "Boolean"
            };

            if (this.answers?.currentDataCollection != null && this.answers.currentDataCollection != "") {

                for (const [eventName, value] of eventMapping) {
                    const eventOutputs = [
                        {
                            "name": "event",
                            "displayName": "event",
                            "value": "{{ $this.event }}",
                            "dataType": "Any"
                        },
                        {
                            "name": "timestamp",
                            "displayName": "timestamp",
                            "value": "{{ $this.timestamp }}",
                            "dataType": "Any"
                        },
                        {
                            "name": "eventRawData",
                            "displayName": "eventRawData",
                            "value": "{{ $this.eventRawData }}",
                            "dataType": "Any"
                        }
                    ];
                    const settings = {
                        "_autoActivate": true,
                        "_event": {
                            "Name": getEventName(eventName),
                        },
                        "_workingMode": "AlwaysActive",
                        "_messageFullName": getEventName(eventName),
                        "_outputs": []
                    };

                    let dcMode = Cmf.Navigo.BusinessObjects.ComplexPerformDataCollectionMode.PerformToResource;
                    switch (value.dataCollectionMode) {
                        case "Perform to Resource":
                            dcMode = Cmf.Navigo.BusinessObjects.ComplexPerformDataCollectionMode.PerformToResource;
                            break;
                        case "Perform to First Material In Resource":
                            dcMode = Cmf.Navigo.BusinessObjects.ComplexPerformDataCollectionMode.PerformToFirstMaterialInResource;
                            break;
                        case "Perform to All Materials In Resource":
                            dcMode = Cmf.Navigo.BusinessObjects.ComplexPerformDataCollectionMode.PerformToAllMaterialsInResource;
                            break;
                    }

                    const svidProps: Array<{ name: string; prop: any }> = [];

                    for (const rptidAndSvid of value.rptidAndSvidList) {
                        for (const [name, prop] of rptidAndSvid.svidList) {
                            eventOutputs.push({
                                "name": getPropertyName(name),
                                "displayName": getPropertyName(name),
                                "value": `{{ $this.${getPropertyName(name)} }}`,
                                "dataType": prop.dataType
                            });
                            settings._outputs.push({
                                "name": getPropertyName(name),
                                "propertyId": name,
                                "property": {
                                    "DataType": prop.dataType,
                                    "$type": "Cmf.Foundation.BusinessObjects.AutomationProperty, Cmf.Foundation.BusinessObjects"
                                },
                                "valueType": prop.dataType,
                                "deviceDataType": prop.automationProtocolDataType,
                                "defaultValue": null,
                                "outputType": "Value"
                            });
                            svidProps.push({ name, prop });
                        }
                    }

                    const equipmentEvent = await this.workflowBuilder.addRootTask(
                        "@criticalmanufacturing/connect-iot-controller-engine-core-tasks",
                        "equipmentEvent",
                        settings,
                        undefined,
                        eventOutputs,
                        undefined,
                        undefined,
                        driverAlias
                    );

                    const entityInstance = await this.workflowBuilder.addTask(
                        equipmentEvent.id,
                        "handler",
                        "@criticalmanufacturing/connect-iot-controller-engine-core-tasks",
                        "entityInstance",
                        {
                            "entityTypeName": `${this.answers.iotEnabledEntity.Name}`,
                        },
                        undefined,
                        [
                            {
                                "name": "instance",
                                "displayName": "instance",
                                "value": "{{ $this.instance }}",
                                "dataType": "Object"
                            }
                        ],
                        undefined,
                        undefined,
                        undefined
                    );

                    const dcTaskSettings = {
                        "complexPerformDataCollectionMode": dcMode,
                        "skipDCValidation": true,
                        "retries": 3,
                        "sleepBetweenRetries": 1000,
                        "systemRetries": 3,
                        "inputs": [
                        ],
                        "defaultDataCollection": {
                            "$type": "Cmf.Navigo.BusinessObjects.DataCollection, Cmf.Navigo.BusinessObjects",
                            "Name": `${value.dataCollection.Name}`
                        }
                    };
                    const dcTaskSettingsInputs = [{
                        "name": "dataCollection",
                        "displayName": "dataCollection",
                        "value": "",
                        "dataType": "Object"
                    },
                    {
                        "name": "resource",
                        "displayName": "resource",
                        "value": `{{ $${entityInstance.name}.instance }}`,
                        "dataType": "Object"
                    },
                    {
                        "name": "material",
                        "displayName": "material",
                        "value": "",
                        "dataType": "Object"
                    },
                    {
                        "name": "rawData",
                        "displayName": "rawData",
                        "value": "",
                        "dataType": "Any"
                    },
                    {
                        "name": "dataCollectionMode",
                        "displayName": "dataCollectionMode",
                        "value": "",
                        "dataType": "String"
                    }];

                    for (const { name, prop } of svidProps) {
                        if (prop.parameter != null && prop.parameter.Name != null && prop.parameter.Name != "") {
                            dcTaskSettings.inputs.push({
                                "name": prop.parameter.Name,
                                "propertyName": prop.parameter.Name,
                                "defaultValue": `{{ $${equipmentEvent.name}.${getPropertyName(name)} }}`,
                                "valueType": dataTypeNameMap[prop.parameter.DataType],
                                "defaultSampleId": null,
                                "settingKey": "name"
                            });
                            dcTaskSettingsInputs.push({
                                "name": prop.parameter.Name,
                                "displayName": prop.parameter.Name,
                                "value": `{{ $${equipmentEvent.name}.${getPropertyName(name)} }}`,
                                "dataType": dataTypeNameMap[prop.parameter.DataType]
                            });
                        }
                    }

                    await this.workflowBuilder.addTask(
                        equipmentEvent.id,
                        "handler",
                        "@criticalmanufacturing/connect-iot-controller-engine-mes-tasks",
                        "dataCollection",
                        dcTaskSettings,
                        dcTaskSettingsInputs,
                        [
                            {
                                "name": "dataCollectionInstances",
                                "displayName": "dataCollectionInstances",
                                "value": "{{ $this.dataCollectionInstances }}",
                                "dataType": "Object"
                            },
                            {
                                "name": "openedProtocolInstances",
                                "displayName": "openedProtocolInstances",
                                "value": "{{ $this.openedProtocolInstances }}",
                                "dataType": "Object"
                            },
                            {
                                "name": "postChartDataPointResults",
                                "displayName": "postChartDataPointResults",
                                "value": "{{ $this.postChartDataPointResults }}",
                                "dataType": "Object"
                            }
                        ],
                        undefined,
                        undefined,
                        undefined
                    );

                    const controllerNewDCWorkflow = {
                        automationController: `${this.answers.integrationName} Controller`,
                        name: `DataCollection - ${this.answers.currentDataCollection.Name} - ${eventName}`,
                        displayName: `DataCollection - ${this.answers.currentDataCollection.Name} - ${eventName}`,
                        workflow: this.workflowBuilder.getWorkflow(),
                        order: workflows.length + 1
                    };

                    workflows.push(controllerNewDCWorkflow);
                }
            }
            //#endregion New Event DataCollection

            controller.tasksLibraryPackages = this.workflowBuilder.getTasksLibraryPackages(controller.tasksPackages);
            await this.masterdataDirector.buildController(controller, [controllerDriverDefinition], workflows);

            //#endregion Build Controller
        })();
        // PackagePacker: End of Script
    }
}
