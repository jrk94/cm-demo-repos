import "reflect-metadata";
import { Task, System, TYPES, DI } from "@criticalmanufacturing/connect-iot-controller-engine";
import EngineTestSuite from "@criticalmanufacturing/connect-iot-controller-engine/dist/test";
import * as chai from "chai";

import {
    UnsTreeMakerTask,
} from "../../../../src/tasks/unsTreeMaker/unsTreeMaker.task";

describe("UnsTreeMaker Task tests", () => {

    // eslint-disable-next-line @typescript-eslint/ban-types
    const unsTreeMakerTestFactory = (trigger: Function, validate: Function,
        callHandler: (input: System.LBOS.Cmf.Foundation.BusinessOrchestration.BaseInput) => Promise<any> = defaultCallHandler,): void => {

        const taskDefinition = {
            class: UnsTreeMakerTask,
            id: "0",
            settings: {}
        };

        EngineTestSuite.createTasks([
            taskDefinition,
            {
                id: "1",
                class: Task.Task({
                    name: "mockTask"
                })(class MockTask implements Task.TaskInstance {
                    [key: string]: any;
                    _outputs: Map<string, Task.Output<any>> = new Map<string, Task.Output<any>>();

                    async onBeforeInit(): Promise<void> {
                        this["activate"] = new Task.Output<any>();
                        this["raw"] = new Task.Output<any>();
                        this["iotEvent"] = new Task.Output<any>();
                        this._outputs.set("activate", this["activate"]);
                        this._outputs.set("raw", this["raw"]);
                        this._outputs.set("iotEvent", this["iotEvent"]);
                    }

                    async onInit(): Promise<void> {
                        trigger(this._outputs);
                    }

                    async onChanges(changes: Task.Changes): Promise<void> {
                        validate(changes);
                    }
                })
            }
        ], [
            { sourceId: "1", outputName: "activate", targetId: "0", inputName: "activate" },
            { sourceId: "1", outputName: "raw", targetId: "0", inputName: "raw" },
            { sourceId: "1", outputName: "iotEvent", targetId: "0", inputName: "iotEvent" },
            { sourceId: "0", outputName: "success", targetId: "1", inputName: "success" },
            { sourceId: "0", outputName: "error", targetId: "1", inputName: "error" },
            { sourceId: "0", outputName: "dataOut", targetId: "1", inputName: "dataOut" },
        ], undefined,
            (container) => {
                // Container customization can be done here if needed
                container.unbind(TYPES.System.API);
                container.bind(TYPES.System.API).toConstantValue(new (DI.Injectable()(
                    class MockSystemAPI implements System.SystemAPI {
                        addEventHandler(): void {
                            throw new Error("Method not implemented.");
                        }
                        triggerActionGroupEvent(): Promise<any> {
                            throw new Error("Method not implemented.");
                        }
                        async call(input: System.LBOS.Cmf.Foundation.BusinessOrchestration.BaseInput): Promise<any> {
                            return callHandler(input);
                        }
                    })
                ));
            }
        );
    };

    /** Default call handler that simply returns a successful output */
    const defaultCallHandler = async (input: System.LBOS.Cmf.Foundation.BusinessOrchestration.BaseInput): Promise<any> => {
        if (input instanceof System.LBOS.Cmf.Foundation.BusinessOrchestration.GenericServiceManagement.InputObjects.GetObjectByNameInput) {
            return Promise.resolve(dataCollectionEventDefinition);
        } else {
            return Promise.reject("Unexpected input type.");
        }
    };

    /** Helper to create standard iotEvent input */
    const createIotEvent = (eventDefinition: string) => ({
        AppProperties: {
            EventDefinition: eventDefinition
        }
    });

    it("should emit success and dataOut with correct topics for data collection light event", (done) => {
        const rawData = dataCollectionLightEvent;
        const iotEvent = createIotEvent("path\\to\\TestEvent");

        unsTreeMakerTestFactory(
            (outputs: Map<string, Task.Output<any>>) => {
                outputs.get("raw").emit({ "value": rawData });
                outputs.get("iotEvent").emit({ "value": iotEvent });
                outputs.get("activate").emit(true);
            },
            (changes: Task.Changes) => {
                if (changes["error"]) {
                    done(new Error(`Task emitted error: ${changes["error"].currentValue}`));
                    return;
                }
                if (changes["dataOut"]) {
                    const result: { topic: string; raw: any }[] = changes["dataOut"].currentValue;

                    // Should contain eventName entry
                    const eventNameEntry = result.find(r => r.topic.endsWith("/event/name"));
                    chai.expect(eventNameEntry).to.not.be.undefined;
                    chai.expect(eventNameEntry.topic).to.equal(
                        "MachineMakers/criticalmfg/Europe-West/Production-InduTech/Fabrication/event/name"
                    );
                    chai.expect(eventNameEntry.raw).to.equal('"TestEvent"');

                    // Should contain raw entry with full payload
                    const rawEntry = result.find(r => r.topic.endsWith("/raw"));
                    chai.expect(rawEntry).to.not.be.undefined;
                    chai.expect(rawEntry.topic).to.equal(
                        "MachineMakers/criticalmfg/Europe-West/Production-InduTech/Fabrication/raw"
                    );
                    chai.expect(rawEntry.raw).to.deep.equal(rawData);

                    // --- Header fields (flattened under Area node) ---
                    const headerCorrelationIdEntry = result.find(r =>
                        r.topic === "MachineMakers/criticalmfg/Europe-West/Production-InduTech/Fabrication/event/CorrelationId"
                    );
                    chai.expect(headerCorrelationIdEntry).to.not.be.undefined;
                    chai.expect(headerCorrelationIdEntry.raw).to.equal('"2602030000000002829"');

                    const headerDateTimeEntry = result.find(r =>
                        r.topic === "MachineMakers/criticalmfg/Europe-West/Production-InduTech/Fabrication/event/DateTime"
                    );
                    chai.expect(headerDateTimeEntry).to.not.be.undefined;
                    chai.expect(headerDateTimeEntry.raw).to.equal('"2026-02-03T18:56:28.083"');

                    const headerApplicationEntry = result.find(r =>
                        r.topic === "MachineMakers/criticalmfg/Europe-West/Production-InduTech/Fabrication/event/Application"
                    );
                    chai.expect(headerApplicationEntry).to.not.be.undefined;
                    chai.expect(headerApplicationEntry.raw).to.equal('"CDMBuilder"');

                    const headerServiceEntry = result.find(r =>
                        r.topic === "MachineMakers/criticalmfg/Europe-West/Production-InduTech/Fabrication/event/Service"
                    );
                    chai.expect(headerServiceEntry).to.not.be.undefined;
                    chai.expect(headerServiceEntry.raw).to.equal('"PostDataCollectionPoints"');

                    const headerOperationEntry = result.find(r =>
                        r.topic === "MachineMakers/criticalmfg/Europe-West/Production-InduTech/Fabrication/event/Operation"
                    );
                    chai.expect(headerOperationEntry).to.not.be.undefined;
                    chai.expect(headerOperationEntry.raw).to.equal('"Post"');

                    const headerCDMVersionEntry = result.find(r =>
                        r.topic === "MachineMakers/criticalmfg/Europe-West/Production-InduTech/Fabrication/event/CDMVersion"
                    );
                    chai.expect(headerCDMVersionEntry).to.not.be.undefined;
                    chai.expect(headerCDMVersionEntry.raw).to.equal('"11.2.0"');

                    const headerStartDateTimeEntry = result.find(r =>
                        r.topic === "MachineMakers/criticalmfg/Europe-West/Production-InduTech/Fabrication/event/StartDateTime"
                    );
                    chai.expect(headerStartDateTimeEntry).to.not.be.undefined;
                    chai.expect(headerStartDateTimeEntry.raw).to.equal('"2026-02-03T18:56:25.260"');

                    // --- Enterprise node ---
                    const enterpriseUIDEntry = result.find(r =>
                        r.topic === "MachineMakers/node/assetidentifier/assetid"
                    );
                    chai.expect(enterpriseUIDEntry).to.not.be.undefined;
                    chai.expect(enterpriseUIDEntry.raw).to.equal('"2601301526490000002"');

                    const enterpriseNameEntry = result.find(r =>
                        r.topic === "MachineMakers/node/assetidentifier/assetname"
                    );
                    chai.expect(enterpriseNameEntry).to.not.be.undefined;
                    chai.expect(enterpriseNameEntry.raw).to.equal('"MachineMakers"');

                    // --- Site node ---
                    const siteUIDEntry = result.find(r =>
                        r.topic === "MachineMakers/criticalmfg/Europe-West/node/assetidentifier/assetid"
                    );
                    chai.expect(siteUIDEntry).to.not.be.undefined;
                    chai.expect(siteUIDEntry.raw).to.equal('"2601301526490000002"');

                    const siteNameEntry = result.find(r =>
                        r.topic === "MachineMakers/criticalmfg/Europe-West/node/assetidentifier/assetname"
                    );
                    chai.expect(siteNameEntry).to.not.be.undefined;
                    chai.expect(siteNameEntry.raw).to.equal('"Europe-West"');

                    // --- Facility node ---
                    const facilityUIDEntry = result.find(r =>
                        r.topic === "MachineMakers/criticalmfg/Europe-West/Production-InduTech/node/assetidentifier/assetid"
                    );
                    chai.expect(facilityUIDEntry).to.not.be.undefined;
                    chai.expect(facilityUIDEntry.raw).to.equal('"2601301526490000001"');

                    const facilityNameEntry = result.find(r =>
                        r.topic === "MachineMakers/criticalmfg/Europe-West/Production-InduTech/node/assetidentifier/assetname"
                    );
                    chai.expect(facilityNameEntry).to.not.be.undefined;
                    chai.expect(facilityNameEntry.raw).to.equal('"Production InduTech"');

                    // --- Area node ---
                    const areaUIDEntry = result.find(r =>
                        r.topic === "MachineMakers/criticalmfg/Europe-West/Production-InduTech/Fabrication/node/assetidentifier/assetid"
                    );
                    chai.expect(areaUIDEntry).to.not.be.undefined;
                    chai.expect(areaUIDEntry.raw).to.equal('"2601301526490000002"');

                    const areaNameEntry = result.find(r =>
                        r.topic === "MachineMakers/criticalmfg/Europe-West/Production-InduTech/Fabrication/node/assetidentifier/assetname"
                    );
                    chai.expect(areaNameEntry).to.not.be.undefined;
                    chai.expect(areaNameEntry.raw).to.equal('"Fabrication"');

                    // Verify total count of entries
                    chai.expect(result).to.have.lengthOf(50);

                    done();
                }
            }
        );
        done();
    });

    it("should emit success and dataOut with correct topics for material operation light event", (done) => {
        const rawData = materialOperationLightEvent;
        const iotEvent = createIotEvent("path\\to\\TestEvent");

        const resourceBase = "MachineMakers/criticalmfg/Europe-West/Production-InduTech/Fabrication/COLORING_01";
        const areaBase = "MachineMakers/criticalmfg/Europe-West/Production-InduTech/Fabrication";

        unsTreeMakerTestFactory(
            (outputs: Map<string, Task.Output<any>>) => {
                outputs.get("raw").emit({ "value": rawData });
                outputs.get("iotEvent").emit({ "value": iotEvent });
                outputs.get("activate").emit(true);
            },
            (changes: Task.Changes) => {
                if (changes["error"]) {
                    done(new Error(`Task emitted error: ${changes["error"].currentValue}`));
                    return;
                }
                if (changes["dataOut"]) {
                    const result: { topic: string; raw: any }[] = changes["dataOut"].currentValue;

                    // --- event/name and raw ---
                    const eventNameEntry = result.find(r => r.topic.endsWith("/event/name"));
                    chai.expect(eventNameEntry).to.not.be.undefined;
                    chai.expect(eventNameEntry.topic).to.equal(`${resourceBase}/event/name`);
                    chai.expect(eventNameEntry.raw).to.equal('"TestEvent"');

                    const rawEntry = result.find(r => r.topic.endsWith("/raw"));
                    chai.expect(rawEntry).to.not.be.undefined;
                    chai.expect(rawEntry.topic).to.equal(`${resourceBase}/raw`);
                    chai.expect(rawEntry.raw).to.deep.equal(rawData);

                    // --- Header fields (under event/) ---
                    const headerServiceEntry = result.find(r =>
                        r.topic === `${resourceBase}/event/Service`
                    );
                    chai.expect(headerServiceEntry).to.not.be.undefined;
                    chai.expect(headerServiceEntry.raw).to.equal('"ComplexDispatchAndTrackInMaterials"');

                    // --- Hierarchy nodes (using assetidentifier) ---
                    const enterpriseUIDEntry = result.find(r =>
                        r.topic === "MachineMakers/node/assetidentifier/assetid"
                    );
                    chai.expect(enterpriseUIDEntry).to.not.be.undefined;
                    chai.expect(enterpriseUIDEntry.raw).to.equal('"2601301526490000002"');

                    const enterpriseNameEntry = result.find(r =>
                        r.topic === "MachineMakers/node/assetidentifier/assetname"
                    );
                    chai.expect(enterpriseNameEntry).to.not.be.undefined;
                    chai.expect(enterpriseNameEntry.raw).to.equal('"MachineMakers"');


                    // --- Resource node (# replaced with _ in topic) ---
                    const resourceNameEntry = result.find(r =>
                        r.topic === `${resourceBase}/node/assetidentifier/assetname`
                    );
                    chai.expect(resourceNameEntry).to.not.be.undefined;
                    chai.expect(resourceNameEntry.raw).to.equal('"COLORING#01"');

                    const resourceModelEntry = result.find(r =>
                        r.topic === `${resourceBase}/mes/Model`
                    );
                    chai.expect(resourceModelEntry).to.not.be.undefined;
                    chai.expect(resourceModelEntry.raw).to.equal('"Hithuy%CL"');

                    // --- Step (under mes, non-mapped key) ---
                    const stepNameEntry = result.find(r =>
                        r.topic === `${resourceBase}/mes/Step/Name`
                    );
                    chai.expect(stepNameEntry).to.not.be.undefined;
                    chai.expect(stepNameEntry.raw).to.equal('"PLATE COLORING"');

                    // --- Material (under mes) ---
                    const materialNameEntry = result.find(r =>
                        r.topic === `${resourceBase}/mes/Material/Name`
                    );
                    chai.expect(materialNameEntry).to.not.be.undefined;
                    chai.expect(materialNameEntry.raw).to.equal('"Lot-RTU-FRONT C-33bea68a-f48e-4853-8d00-8ffc4bb91166"');

                    // --- Previous/Step (non-mapped, under mes/Previous/) ---
                    const prevStepNameEntry = result.find(r =>
                        r.topic === `${resourceBase}/mes/Previous/Step/Name`
                    );
                    chai.expect(prevStepNameEntry).to.not.be.undefined;
                    chai.expect(prevStepNameEntry.raw).to.equal('"PLATE COLORING"');

                    // --- Previous/Area (mapped topic, uses assetidentifier) ---
                    const prevAreaNameEntry = result.find(r =>
                        r.topic === `${areaBase}/node/Previous/assetidentifier/assetname`
                    );
                    chai.expect(prevAreaNameEntry).to.not.be.undefined;
                    chai.expect(prevAreaNameEntry.raw).to.equal('"Fabrication"');

                    // --- Flow (under mes) ---
                    const flowNameEntry = result.find(r =>
                        r.topic === `${resourceBase}/mes/Flow/Name`
                    );
                    chai.expect(flowNameEntry).to.not.be.undefined;
                    chai.expect(flowNameEntry.raw).to.equal('"Fabrication_Metal Plate"');

                    // Verify total count of entries
                    chai.expect(result).to.have.lengthOf(74);

                    done();
                }
            }
        );

        done();
    });

    it("should emit success and dataOut with correct topics for resource state change light event", (done) => {
        const rawData = resourceStateChangeLightEvent;
        const iotEvent = createIotEvent("path\\to\\TestEvent");

        const resourceBase = "MachineMakers/criticalmfg/Europe-West/Production-InduTech/Final-Assembly/BAY0";
        const areaBase = "MachineMakers/criticalmfg/Europe-West/Production-InduTech/Final-Assembly";

        unsTreeMakerTestFactory(
            (outputs: Map<string, Task.Output<any>>) => {
                outputs.get("raw").emit({ "value": rawData });
                outputs.get("iotEvent").emit({ "value": iotEvent });
                outputs.get("activate").emit(true);
            },
            (changes: Task.Changes) => {
                if (changes["error"]) {
                    done(new Error(`Task emitted error: ${changes["error"].currentValue}`));
                    return;
                }
                if (changes["dataOut"]) {
                    const result: { topic: string; raw: any }[] = changes["dataOut"].currentValue;

                    // --- event/name and raw ---
                    const eventNameEntry = result.find(r => r.topic.endsWith("/event/name"));
                    chai.expect(eventNameEntry).to.not.be.undefined;
                    chai.expect(eventNameEntry.topic).to.equal(`${resourceBase}/event/name`);
                    chai.expect(eventNameEntry.raw).to.equal('"TestEvent"');

                    const rawEntry = result.find(r => r.topic.endsWith("/raw"));
                    chai.expect(rawEntry).to.not.be.undefined;
                    chai.expect(rawEntry.topic).to.equal(`${resourceBase}/raw`);

                    // --- Header fields (under event/) ---
                    const headerCorrelationIdEntry = result.find(r =>
                        r.topic === `${resourceBase}/event/CorrelationId`
                    );
                    chai.expect(headerCorrelationIdEntry).to.not.be.undefined;
                    chai.expect(headerCorrelationIdEntry.raw).to.equal('"2602030000000002611"');

                    // --- Hierarchy nodes (using assetidentifier) ---
                    const enterpriseIdEntry = result.find(r =>
                        r.topic === "MachineMakers/node/assetidentifier/assetid"
                    );
                    chai.expect(enterpriseIdEntry).to.not.be.undefined;
                    chai.expect(enterpriseIdEntry.raw).to.equal('"2601301526490000002"');

                    // --- Area node ---
                    const areaNameEntry = result.find(r =>
                        r.topic === `${areaBase}/node/assetidentifier/assetname`
                    );
                    chai.expect(areaNameEntry).to.not.be.undefined;
                    chai.expect(areaNameEntry.raw).to.equal('"Final Assembly"');

                    const areaTypeEntry = result.find(r =>
                        r.topic === `${areaBase}/mes/Type`
                    );
                    chai.expect(areaTypeEntry).to.not.be.undefined;
                    chai.expect(areaTypeEntry.raw).to.equal('"Production"');

                    // --- Resource node ---
                    const resourceIdEntry = result.find(r =>
                        r.topic === `${resourceBase}/node/assetidentifier/assetid`
                    );
                    chai.expect(resourceIdEntry).to.not.be.undefined;
                    chai.expect(resourceIdEntry.raw).to.equal('"2601301526490000052"');

                    // --- Resource mes fields ---
                    const systemStateEntry = result.find(r =>
                        r.topic === `${resourceBase}/mes/SystemState`
                    );
                    chai.expect(systemStateEntry).to.not.be.undefined;
                    chai.expect(systemStateEntry.raw).to.equal('"Up"');

                    const semiE10StateEntry = result.find(r =>
                        r.topic === `${resourceBase}/mes/SEMIE10State`
                    );
                    chai.expect(semiE10StateEntry).to.not.be.undefined;
                    chai.expect(semiE10StateEntry.raw).to.equal('"Productive"');

                    // Arrays should be emitted as-is
                    const stateNamesEntry = result.find(r =>
                        r.topic === `${resourceBase}/mes/StateNames`
                    );
                    chai.expect(stateNamesEntry).to.not.be.undefined;
                    chai.expect(stateNamesEntry.raw).to.deep.equal(["Basic", "SEMI-E10", "ExcludeFromScheduling", "Color"]);

                    // --- Previous/Resource (under mes/Previous/) ---
                    const prevSemiE10StateEntry = result.find(r =>
                        r.topic === `${resourceBase}/mes/Previous/SEMIE10State`
                    );
                    chai.expect(prevSemiE10StateEntry).to.not.be.undefined;
                    chai.expect(prevSemiE10StateEntry.raw).to.equal('"Standby"');

                    // --- Previous/Area (mapped topic, uses assetidentifier) ---
                    const prevAreaNameEntry = result.find(r =>
                        r.topic === `${areaBase}/node/Previous/assetidentifier/assetname`
                    );
                    chai.expect(prevAreaNameEntry).to.not.be.undefined;
                    chai.expect(prevAreaNameEntry.raw).to.equal('"Final Assembly"');

                    const prevAreaTypeEntry = result.find(r =>
                        r.topic === `${areaBase}/mes/Previous/Type`
                    );
                    chai.expect(prevAreaTypeEntry).to.not.be.undefined;
                    chai.expect(prevAreaTypeEntry.raw).to.equal('"Production"');

                    // Verify total count of entries
                    chai.expect(result).to.have.lengthOf(45);

                    done();
                }
            }
        );

        done();
    });

    it("should emit success and dataOut with correct topics for metrics event", (done) => {
        const rawData = metricsEvent;
        const iotEvent = createIotEvent("path\\to\\TestEvent");

        const resourceBase = "MachineMakers/criticalmfg/Europe-West/Production-InduTech/Fabrication/FOAM-PREP";

        unsTreeMakerTestFactory(
            (outputs: Map<string, Task.Output<any>>) => {
                outputs.get("raw").emit({ "value": rawData });
                outputs.get("iotEvent").emit({ "value": iotEvent });
                outputs.get("activate").emit(true);
            },
            (changes: Task.Changes) => {
                if (changes["error"]) {
                    done(new Error(`Task emitted error: ${changes["error"].currentValue}`));
                    return;
                }
                if (changes["dataOut"]) {
                    const result: { topic: string; raw: any }[] = changes["dataOut"].currentValue;

                    // --- event/name and raw ---
                    const eventNameEntry = result.find(r => r.topic.endsWith("/event/name"));
                    chai.expect(eventNameEntry).to.not.be.undefined;
                    chai.expect(eventNameEntry.topic).to.equal(`${resourceBase}/event/name`);
                    chai.expect(eventNameEntry.raw).to.equal('"TestEvent"');

                    const rawEntry = result.find(r => r.topic.endsWith("/raw"));
                    chai.expect(rawEntry).to.not.be.undefined;
                    chai.expect(rawEntry.topic).to.equal(`${resourceBase}/raw`);

                    // Verify total count of entries
                    chai.expect(result).to.have.lengthOf(44);

                    done();
                }
            }
        );

        done();
    });

    const dataCollectionLightEvent = {
        "Header": {
            "CorrelationId": "2602030000000002829",
            "DateTime": "2026-02-03T18:56:28.083",
            "Application": "CDMBuilder",
            "Service": "PostDataCollectionPoints",
            "Operation": "Post",
            "CDMVersion": "11.2.0",
            "StartDateTime": "2026-02-03T18:56:25.260"
        },
        "Enterprise": {
            "UID": "2601301526490000002",
            "Name": "MachineMakers",
            "AdditionalProperties": null
        },
        "Site": {
            "UID": "2601301526490000002",
            "Name": "Europe-West",
            "AdditionalProperties": null
        },
        "Facility": {
            "UID": "2601301526490000001",
            "Name": "Production InduTech",
            "AdditionalProperties": null
        },
        "Area": {
            "UID": "2601301526490000002",
            "Name": "Fabrication",
            "AdditionalProperties": null
        },
        "Flow": {
            "UID": "2601301526490000044",
            "Name": "Fabrication_Metal Plate",
            "MajorRevision": "A",
            "MinorRevision": "1",
            "AdditionalProperties": null
        },
        "Step": {
            "UID": "2601301526490000010",
            "Name": "PLATE COLORING",
            "AdditionalProperties": null
        },
        "Material": {
            "UID": "2602030000000000001",
            "DateEnteredStep": "2026-02-03T18:56:07.487",
            "Name": "Lot-RTU-FRONT C-35e04190-929d-4e8e-9c7c-353bdc7e8ed1",
            "PrimaryQty": 8.00000000,
            "PrimaryUnits": "Unit-",
            "SecondaryQty": null,
            "SecondaryUnits": null,
            "SubMaterialsPrimaryQty": 0.00000000,
            "SubMaterialsSecondaryQty": null,
            "SubMaterialCount": 0,
            "FlowPath": "Fabrication_Metal Plate:A:1/Fabrication_Paint Colours:A:4/PLATE COLORING:1",
            "Form": "Lot",
            "AdditionalProperties": null
        },
        "Product": {
            "UID": "2601301526490000093",
            "Name": "RTU-FRONT C",
            "MajorRevision": "A",
            "MinorRevision": "2",
            "AdditionalProperties": null
        },
        "DataCollection": {
            "UID": "2601301526490000003",
            "Name": "Painting Data Collection",
            "Description": null,
            "MaterialOperation": "TrackIn",
            "InstanceName": "Painting Data Collection-000000003",
            "ExecutionMode": "LongRunning",
            "AdditionalProperties": null
        },
        "Parameter": {
            "Name": "Paint Thickness - Left Side",
            "Description": null,
            "Instrument": "Paint Thickness Gauge 0002",
            "Unit": "μm",
            "DataType": "Decimal",
            "ReadingSample": "Sample 1",
            "ReadingNames": [
                ""
            ],
            "ReadingNumbers": [
                1
            ],
            "ReadingValues": [
                "120.18"
            ],
            "AdditionalProperties": null
        }
    };

    const materialOperationLightEvent = {

        "Header": {
            "CorrelationId": "2602040000010002731",
            "DateTime": "2026-02-04T17:52:24.693",
            "Application": "CDMBuilder",
            "Service": "ComplexDispatchAndTrackInMaterials",
            "Operation": "AutomaticAssemble",
            "CDMVersion": "11.2.0",
            "StartDateTime": "2026-02-04T17:52:24.497"
        },
        "Enterprise": {
            "UID": "2601301526490000002",
            "Name": "MachineMakers",
            "AdditionalProperties": null
        },
        "Site": {
            "UID": "2601301526490000002",
            "Name": "Europe-West",
            "AdditionalProperties": null
        },
        "Facility": {
            "UID": "2601301526490000001",
            "Name": "Production InduTech",
            "AdditionalProperties": null
        },
        "Area": {
            "UID": "2601301526490000002",
            "Name": "Fabrication",
            "AdditionalProperties": null
        },
        "Step": {
            "UID": "2601301526490000010",
            "Name": "PLATE COLORING",
            "AdditionalProperties": null
        },
        "Resource": {
            "UID": "2601301526490000036",
            "Name": "COLORING#01",
            "ResourceType": null,
            "Model": "Hithuy%CL",
            "AdditionalProperties": null
        },
        "Previous": {
            "Step": {
                "UID": "2601301526490000010",
                "Name": "PLATE COLORING",
                "AdditionalProperties": null
            },
            "Material": {
                "DateEnteredFacility": "2026-02-04T17:51:59.287",
                "DateEnteredStep": "2026-02-04T17:52:18.477",
                "PrimaryQty": 3.00000000,
                "PrimaryUnits": "Unit-",
                "SecondaryQty": null,
                "SecondaryUnits": null,
                "SubMaterialsPrimaryQty": 0.00000000,
                "SubMaterialsSecondaryQty": null,
                "SubMaterialCount": 0,
                "FlowPath": "Fabrication_Metal Plate:A:1/Fabrication_Paint Colours:A:4/PLATE COLORING:1",
                "Form": "Lot",
                "ReworkCount": 0,
                "HoldCount": 0,
                "AdditionalProperties": null
            },
            "Product": {
                "UID": "2601301526490000093",
                "Name": "RTU-FRONT C",
                "MajorRevision": "A",
                "MinorRevision": "2",
                "Type": "Production",
                "AdditionalProperties": null
            },
            "Flow": {
                "UID": "2601301526490000044",
                "Name": "Fabrication_Metal Plate",
                "MajorRevision": "A",
                "MinorRevision": "1",
                "Type": "Production",
                "AdditionalProperties": null
            },
            "Area": {
                "UID": "2601301526490000002",
                "Name": "Fabrication",
                "AdditionalProperties": null
            }
        },
        "Material": {
            "UID": "2602040000010000008",
            "DateEnteredFacility": "2026-02-04T17:51:59.287",
            "DateEnteredStep": "2026-02-04T17:52:18.477",
            "Name": "Lot-RTU-FRONT C-33bea68a-f48e-4853-8d00-8ffc4bb91166",
            "Type": "Production",
            "PrimaryQty": 3.00000000,
            "PrimaryUnits": "Unit-",
            "SecondaryQty": null,
            "SecondaryUnits": null,
            "SubMaterialsPrimaryQty": 0.00000000,
            "SubMaterialsSecondaryQty": null,
            "SubMaterialCount": 0,
            "FlowPath": "Fabrication_Metal Plate:A:1/Fabrication_Paint Colours:A:4/PLATE COLORING:1",
            "Form": "Lot",
            "ReworkCount": 0,
            "HoldCount": 0,
            "CreatedOn": "2026-02-04T17:51:59.323",
            "CreatedBy": "2601301526490000002",
            "ModifiedOn": "2026-02-04T17:52:24.637",
            "ModifiedBy": "2601301526490000002",
            "Attributes": {
                "Names": null,
                "Values": null
            },
            "AdditionalProperties": null
        },
        "Product": {
            "UID": "2601301526490000093",
            "Name": "RTU-FRONT C",
            "MajorRevision": "A",
            "MinorRevision": "2",
            "Type": "Production",
            "AdditionalProperties": null
        },
        "Flow": {
            "UID": "2601301526490000044",
            "Name": "Fabrication_Metal Plate",
            "MajorRevision": "A",
            "MinorRevision": "1",
            "Type": "Production",
            "AdditionalProperties": null
        }
    };

    const resourceStateChangeLightEvent = {
        "Header": {
            "CorrelationId": "2602030000000002611",
            "DateTime": "2026-02-03T17:55:44.863",
            "Application": "CDMBuilder",
            "Service": "ComplexLogResourceEvent",
            "Operation": "LogEvent",
            "CDMVersion": "11.2.0",
            "StartDateTime": "2026-02-03T17:55:44.837"
        },
        "Enterprise": {
            "UID": "2601301526490000002",
            "Name": "MachineMakers",
            "AdditionalProperties": null
        },
        "Site": {
            "UID": "2601301526490000002",
            "Name": "Europe-West",
            "AdditionalProperties": null
        },
        "Facility": {
            "UID": "2601301526490000001",
            "Name": "Production InduTech",
            "AdditionalProperties": null
        },
        "Area": {
            "UID": "2601301526490000003",
            "Name": "Final Assembly",
            "Type": "Production",
            "AdditionalProperties": null
        },
        "Resource": {
            "UID": "2601301526490000052",
            "Name": "BAY0",
            "ResourceType": null,
            "Model": null,
            "Description": null,
            "UniversalState": "Active",
            "Type": "Process",
            "ParentResources": [],
            "OpenCorrectiveMAOsCount": 0,
            "Lanes": [],
            "Manufacturer": null,
            "Class": "Process",
            "SystemState": "Up",
            "StateNames": [
                "Basic",
                "SEMI-E10",
                "ExcludeFromScheduling",
                "Color"
            ],
            "StateValues": [
                "Up",
                "Productive",
                "False",
                "#00ff00"
            ],
            "SEMIE10State": "Productive",
            "CreatedOn": "2026-01-30T17:23:45.113",
            "CreatedBy": "2601301520510000001",
            "ModifiedOn": "2026-02-03T17:55:44.840",
            "ModifiedBy": "2601301526490000002",
            "ControlState": "Off-Line",
            "AdditionalProperties": null
        },
        "Previous": {
            "Resource": {
                "SystemState": "Up",
                "StateNames": [
                    "Basic",
                    "SEMI-E10",
                    "ExcludeFromScheduling",
                    "Color"
                ],
                "StateValues": [
                    "Up",
                    "Standby",
                    "False",
                    "#ffff00"
                ],
                "SEMIE10State": "Standby",
                "LastModifiedOn": "2026-02-03T17:55:34.357",
                "LastModifiedBy": "2601301526490000002",
                "AdditionalProperties": null
            },
            "Area": {
                "UID": "2601301526490000003",
                "Name": "Final Assembly",
                "Type": "Production",
                "AdditionalProperties": null
            }
        }
    };

    const metricsEvent = {
        "Key": "availability",
        "Value": "100",
        "Enterprise": { "Name": "MachineMakers" },
        "Site": { "Name": "Europe-West" },
        "Facility": { "Name": "Production InduTech" },
        "Area": { "Name": "Fabrication" },
        "Resource": { "Name": "FOAM PREP" }
    };

    const dataCollectionEventDefinition = {
        "$id": "1",
        "$type": "Cmf.Foundation.BusinessOrchestration.GenericServiceManagement.OutputObjects.GetObjectByIdOutput, Cmf.Foundation.BusinessOrchestration",
        "Instance": {
            "$id": "2",
            "$type": "Cmf.Foundation.BusinessObjects.IoTEventDefinition, Cmf.Foundation.BusinessObjects",
            "IoTSchema": {
                "$id": "3",
                "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                "IsShared": false,
                "Attributes": {
                    "$typeCMF": "CMFMap",
                    "CMFMapData": []
                },
                "CreatedBy": "System",
                "Schema": "{\"$schema\":\"http://json-schema.org/draft-04/schema#\",\"type\":\"object\",\"required\":[\"Header\",\"Enterprise\",\"Site\",\"Facility\",\"Material\",\"Area\",\"Flow\",\"Step\",\"Product\"],\"properties\":{\"Header\":{\"$ref\":\"#/definitions/Header\"},\"Enterprise\":{\"$ref\":\"#/definitions/Enterprise\"},\"Site\":{\"$ref\":\"#/definitions/Site\"},\"Facility\":{\"$ref\":\"#/definitions/Facility\"},\"Material\":{\"$ref\":\"#/definitions/Material\"},\"ParentMaterial\":{\"$ref\":\"#/definitions/ParentMaterial\"},\"Area\":{\"$ref\":\"#/definitions/Area\"},\"Resource\":{\"$ref\":\"#/definitions/Resource\"},\"ParentResource\":{\"$ref\":\"#/definitions/ParentResource\"},\"Flow\":{\"$ref\":\"#/definitions/Flow\"},\"Step\":{\"$ref\":\"#/definitions/Step\"},\"Product\":{\"$ref\":\"#/definitions/Product\"},\"ProductGroup\":{\"$ref\":\"#/definitions/ProductGroup\"},\"ProductionOrder\":{\"$ref\":\"#/definitions/ProductionOrder\"},\"Calendar\":{\"$ref\":\"#/definitions/Calendar\"},\"DataCollection\":{\"$ref\":\"#/definitions/DataCollection\"},\"BillOfMaterials\":{\"$ref\":\"#/definitions/BillOfMaterials\"},\"BillOfTools\":{\"$ref\":\"#/definitions/BillOfTools\"},\"Recipe\":{\"$ref\":\"#/definitions/Recipe\"},\"Employee\":{\"$ref\":\"#/definitions/Employee\"},\"Attributes\":{\"$ref\":\"#/definitions/Attributes\"},\"Comments\":{\"type\":\"string\"},\"Previous\":{\"$ref\":\"#/definitions/Previous\"},\"Tools\":{\"type\":\"array\",\"items\":{\"type\":\"object\",\"required\":[\"UID\"],\"properties\":{\"UID\":{\"type\":\"string\"},\"Name\":{\"type\":\"string\"},\"Position\":{\"type\":\"integer\"},\"Type\":{\"type\":\"string\"}}}}},\"definitions\":{\"Header\":{\"type\":\"object\",\"required\":[\"CorrelationId\",\"Operation\",\"DateTime\",\"StartDateTime\",\"Application\",\"CDMVersion\"],\"properties\":{\"CorrelationId\":{\"type\":\"string\"},\"Operation\":{\"type\":\"string\"},\"DateTime\":{\"type\":\"string\",\"format\":\"date-time\",\"pattern\":\"^(?<year>-?(?:[1-9][0-9]*)?[0-9]{4})-(?<month>1[0-2]|0[1-9])-(?<day>3[01]|0[1-9]|[12][0-9])T(?<hour>2[0-3]|[01][0-9]):(?<minute>[0-5][0-9]):(?<second>[0-5][0-9])(?<ms>\\\\.[0-9]+)?(?<timezone>Z|[+-](?:[0-9][0-9]):[0-9][0-9])$\"},\"StartDateTime\":{\"type\":\"string\",\"format\":\"date-time\",\"pattern\":\"^(?<year>-?(?:[1-9][0-9]*)?[0-9]{4})-(?<month>1[0-2]|0[1-9])-(?<day>3[01]|0[1-9]|[12][0-9])T(?<hour>2[0-3]|[01][0-9]):(?<minute>[0-5][0-9]):(?<second>[0-5][0-9])(?<ms>\\\\.[0-9]+)?(?<timezone>Z|[+-](?:[0-9][0-9]):[0-9][0-9])$\"},\"Application\":{\"type\":\"string\"},\"CDMVersion\":{\"type\":\"string\"},\"Service\":{\"type\":\"string\"},\"DataGroupRefs\":{\"type\":\"array\",\"items\":{\"type\":\"string\"}},\"DataGroups\":{\"type\":\"array\",\"items\":{\"type\":\"string\"}}}},\"Enterprise\":{\"type\":\"object\",\"required\":[\"UID\",\"Name\"],\"properties\":{\"UID\":{\"type\":\"string\"},\"Name\":{\"type\":\"string\"},\"DisplayOrder\":{\"type\":\"integer\"}}},\"Site\":{\"type\":\"object\",\"required\":[\"UID\",\"Name\"],\"properties\":{\"UID\":{\"type\":\"string\"},\"Name\":{\"type\":\"string\"},\"DisplayOrder\":{\"type\":\"integer\"}}},\"Facility\":{\"type\":\"object\",\"required\":[\"UID\",\"Name\"],\"properties\":{\"UID\":{\"type\":\"string\"},\"Name\":{\"type\":\"string\"},\"DisplayOrder\":{\"type\":\"integer\"}}},\"Material\":{\"type\":\"object\",\"required\":[\"UID\",\"Name\",\"CreatedOn\",\"CreatedBy\",\"ModifiedOn\",\"ModifiedBy\",\"Type\",\"DateEnteredStep\",\"Form\",\"FlowPath\",\"PrimaryQty\",\"PrimaryUnits\"],\"properties\":{\"UID\":{\"type\":\"string\"},\"Name\":{\"type\":\"string\"},\"CreatedOn\":{\"type\":\"string\",\"format\":\"date-time\",\"pattern\":\"^(?<year>-?(?:[1-9][0-9]*)?[0-9]{4})-(?<month>1[0-2]|0[1-9])-(?<day>3[01]|0[1-9]|[12][0-9])T(?<hour>2[0-3]|[01][0-9]):(?<minute>[0-5][0-9]):(?<second>[0-5][0-9])(?<ms>\\\\.[0-9]+)?(?<timezone>Z|[+-](?:[0-9][0-9]):[0-9][0-9])$\"},\"CreatedBy\":{\"type\":\"string\"},\"ModifiedOn\":{\"type\":\"string\",\"format\":\"date-time\",\"pattern\":\"^(?<year>-?(?:[1-9][0-9]*)?[0-9]{4})-(?<month>1[0-2]|0[1-9])-(?<day>3[01]|0[1-9]|[12][0-9])T(?<hour>2[0-3]|[01][0-9]):(?<minute>[0-5][0-9]):(?<second>[0-5][0-9])(?<ms>\\\\.[0-9]+)?(?<timezone>Z|[+-](?:[0-9][0-9]):[0-9][0-9])$\"},\"ModifiedBy\":{\"type\":\"string\"},\"Type\":{\"type\":\"string\"},\"DateEnteredStep\":{\"type\":\"string\",\"format\":\"date-time\",\"pattern\":\"^(?<year>-?(?:[1-9][0-9]*)?[0-9]{4})-(?<month>1[0-2]|0[1-9])-(?<day>3[01]|0[1-9]|[12][0-9])T(?<hour>2[0-3]|[01][0-9]):(?<minute>[0-5][0-9]):(?<second>[0-5][0-9])(?<ms>\\\\.[0-9]+)?(?<timezone>Z|[+-](?:[0-9][0-9]):[0-9][0-9])$\"},\"Form\":{\"type\":\"string\"},\"FlowPath\":{\"type\":\"string\"},\"LogicalFlowPath\":{\"type\":\"string\"},\"PrimaryQty\":{\"type\":\"number\"},\"PrimaryUnits\":{\"type\":\"string\"},\"SecondaryQty\":{\"type\":\"number\"},\"SecondaryUnits\":{\"type\":\"string\"},\"SubMaterialsPrimaryQty\":{\"type\":\"number\"},\"SubMaterialsSecondaryQty\":{\"type\":\"number\"},\"SubMaterialCount\":{\"type\":\"integer\"},\"ProcessingState\":{\"type\":\"string\"},\"ReworkCount\":{\"type\":\"integer\"},\"HoldCount\":{\"type\":\"integer\"},\"IdealTimePerUnitInSecs\":{\"type\":\"number\"},\"ReferenceTimePerUnitInSecs\":{\"type\":\"number\"},\"DateEnteredFacility\":{\"type\":\"string\",\"format\":\"date-time\",\"pattern\":\"^(?<year>-?(?:[1-9][0-9]*)?[0-9]{4})-(?<month>1[0-2]|0[1-9])-(?<day>3[01]|0[1-9]|[12][0-9])T(?<hour>2[0-3]|[01][0-9]):(?<minute>[0-5][0-9]):(?<second>[0-5][0-9])(?<ms>\\\\.[0-9]+)?(?<timezone>Z|[+-](?:[0-9][0-9]):[0-9][0-9])$\"}}},\"ParentMaterial\":{\"type\":\"object\",\"required\":[\"UID\",\"Name\",\"CreatedOn\",\"CreatedBy\",\"ModifiedOn\",\"ModifiedBy\",\"Type\",\"DateEnteredStep\",\"Form\",\"FlowPath\",\"PrimaryQty\",\"PrimaryUnits\"],\"properties\":{\"UID\":{\"type\":\"string\"},\"Name\":{\"type\":\"string\"},\"CreatedOn\":{\"type\":\"string\",\"format\":\"date-time\",\"pattern\":\"^(?<year>-?(?:[1-9][0-9]*)?[0-9]{4})-(?<month>1[0-2]|0[1-9])-(?<day>3[01]|0[1-9]|[12][0-9])T(?<hour>2[0-3]|[01][0-9]):(?<minute>[0-5][0-9]):(?<second>[0-5][0-9])(?<ms>\\\\.[0-9]+)?(?<timezone>Z|[+-](?:[0-9][0-9]):[0-9][0-9])$\"},\"CreatedBy\":{\"type\":\"string\"},\"ModifiedOn\":{\"type\":\"string\",\"format\":\"date-time\",\"pattern\":\"^(?<year>-?(?:[1-9][0-9]*)?[0-9]{4})-(?<month>1[0-2]|0[1-9])-(?<day>3[01]|0[1-9]|[12][0-9])T(?<hour>2[0-3]|[01][0-9]):(?<minute>[0-5][0-9]):(?<second>[0-5][0-9])(?<ms>\\\\.[0-9]+)?(?<timezone>Z|[+-](?:[0-9][0-9]):[0-9][0-9])$\"},\"ModifiedBy\":{\"type\":\"string\"},\"Type\":{\"type\":\"string\"},\"DateEnteredStep\":{\"type\":\"string\",\"format\":\"date-time\",\"pattern\":\"^(?<year>-?(?:[1-9][0-9]*)?[0-9]{4})-(?<month>1[0-2]|0[1-9])-(?<day>3[01]|0[1-9]|[12][0-9])T(?<hour>2[0-3]|[01][0-9]):(?<minute>[0-5][0-9]):(?<second>[0-5][0-9])(?<ms>\\\\.[0-9]+)?(?<timezone>Z|[+-](?:[0-9][0-9]):[0-9][0-9])$\"},\"Form\":{\"type\":\"string\"},\"FlowPath\":{\"type\":\"string\"},\"LogicalFlowPath\":{\"type\":\"string\"},\"PrimaryQty\":{\"type\":\"number\"},\"PrimaryUnits\":{\"type\":\"string\"},\"SecondaryQty\":{\"type\":\"number\"},\"SecondaryUnits\":{\"type\":\"string\"},\"SubMaterialsPrimaryQty\":{\"type\":\"number\"},\"SubMaterialsSecondaryQty\":{\"type\":\"number\"},\"SubMaterialCount\":{\"type\":\"integer\"},\"ProcessingState\":{\"type\":\"string\"},\"ReworkCount\":{\"type\":\"integer\"},\"HoldCount\":{\"type\":\"integer\"}}},\"Area\":{\"type\":\"object\",\"required\":[\"UID\",\"Name\"],\"properties\":{\"UID\":{\"type\":\"string\"},\"Name\":{\"type\":\"string\"},\"DisplayOrder\":{\"type\":\"integer\"},\"Type\":{\"type\":\"string\"}}},\"Resource\":{\"type\":\"object\",\"required\":[\"UID\",\"Name\"],\"properties\":{\"UID\":{\"type\":\"string\"},\"Name\":{\"type\":\"string\"},\"DisplayOrder\":{\"type\":\"integer\"},\"ResourceType\":{\"type\":\"string\"},\"Position\":{\"type\":\"integer\"},\"Model\":{\"type\":\"string\"},\"Service\":{\"type\":\"string\"}}},\"ParentResource\":{\"type\":\"object\",\"required\":[\"UID\",\"Name\"],\"properties\":{\"UID\":{\"type\":\"string\"},\"Name\":{\"type\":\"string\"}}},\"Flow\":{\"type\":\"object\",\"required\":[\"UID\",\"Name\"],\"properties\":{\"UID\":{\"type\":\"string\"},\"Name\":{\"type\":\"string\"},\"MajorRevision\":{\"type\":\"string\"},\"MinorRevision\":{\"type\":\"string\"},\"Type\":{\"type\":\"string\"}}},\"Step\":{\"type\":\"object\",\"required\":[\"UID\",\"Name\"],\"properties\":{\"UID\":{\"type\":\"string\"},\"Name\":{\"type\":\"string\"},\"DisplayOrder\":{\"type\":\"integer\"},\"Type\":{\"type\":\"string\"}}},\"Product\":{\"type\":\"object\",\"required\":[\"UID\",\"Name\"],\"properties\":{\"UID\":{\"type\":\"string\"},\"Name\":{\"type\":\"string\"},\"MajorRevision\":{\"type\":\"string\"},\"MinorRevision\":{\"type\":\"string\"},\"Type\":{\"type\":\"string\"},\"Description\":{\"type\":\"string\"}}},\"ProductGroup\":{\"type\":\"object\",\"required\":[\"UID\",\"Name\"],\"properties\":{\"UID\":{\"type\":\"string\"},\"Name\":{\"type\":\"string\"},\"MajorRevision\":{\"type\":\"string\"},\"MinorRevision\":{\"type\":\"string\"},\"Type\":{\"type\":\"string\"}}},\"ProductionOrder\":{\"type\":\"object\",\"required\":[\"UID\",\"Name\",\"Quantity\",\"Units\",\"DueDate\"],\"properties\":{\"UID\":{\"type\":\"string\"},\"Name\":{\"type\":\"string\"},\"Quantity\":{\"type\":\"number\"},\"Units\":{\"type\":\"string\"},\"DueDate\":{\"type\":\"string\",\"format\":\"date-time\",\"pattern\":\"^(?<year>-?(?:[1-9][0-9]*)?[0-9]{4})-(?<month>1[0-2]|0[1-9])-(?<day>3[01]|0[1-9]|[12][0-9])T(?<hour>2[0-3]|[01][0-9]):(?<minute>[0-5][0-9]):(?<second>[0-5][0-9])(?<ms>\\\\.[0-9]+)?(?<timezone>Z|[+-](?:[0-9][0-9]):[0-9][0-9])$\"},\"PlannedStartDate\":{\"type\":\"string\",\"format\":\"date-time\",\"pattern\":\"^(?<year>-?(?:[1-9][0-9]*)?[0-9]{4})-(?<month>1[0-2]|0[1-9])-(?<day>3[01]|0[1-9]|[12][0-9])T(?<hour>2[0-3]|[01][0-9]):(?<minute>[0-5][0-9]):(?<second>[0-5][0-9])(?<ms>\\\\.[0-9]+)?(?<timezone>Z|[+-](?:[0-9][0-9]):[0-9][0-9])$\"},\"PlannedEndDate\":{\"type\":\"string\",\"format\":\"date-time\",\"pattern\":\"^(?<year>-?(?:[1-9][0-9]*)?[0-9]{4})-(?<month>1[0-2]|0[1-9])-(?<day>3[01]|0[1-9]|[12][0-9])T(?<hour>2[0-3]|[01][0-9]):(?<minute>[0-5][0-9]):(?<second>[0-5][0-9])(?<ms>\\\\.[0-9]+)?(?<timezone>Z|[+-](?:[0-9][0-9]):[0-9][0-9])$\"},\"OrderNumber\":{\"type\":\"string\"}}},\"Calendar\":{\"type\":\"object\",\"required\":[\"Calendar\",\"CD\",\"Timezone\",\"FY\",\"FQ\",\"FM\",\"FW\"],\"properties\":{\"Calendar\":{\"type\":\"string\"},\"CD\":{\"type\":\"string\"},\"Timezone\":{\"type\":\"string\"},\"TZToUTCInMin\":{\"type\":\"integer\"},\"FY\":{\"type\":\"integer\"},\"FQ\":{\"type\":\"integer\"},\"FM\":{\"type\":\"integer\"},\"FW\":{\"type\":\"integer\"},\"Shift\":{\"$ref\":\"#/definitions/Calendar/definitions/Shift\"}},\"definitions\":{\"Shift\":{\"type\":\"object\",\"required\":[\"ShiftDefinitionName\",\"Name\",\"StartTime\",\"EndTime\"],\"properties\":{\"ShiftDefinitionName\":{\"type\":\"string\"},\"Name\":{\"type\":\"string\"},\"StartTime\":{\"type\":\"string\",\"format\":\"date-time\",\"pattern\":\"^(?<year>-?(?:[1-9][0-9]*)?[0-9]{4})-(?<month>1[0-2]|0[1-9])-(?<day>3[01]|0[1-9]|[12][0-9])T(?<hour>2[0-3]|[01][0-9]):(?<minute>[0-5][0-9]):(?<second>[0-5][0-9])(?<ms>\\\\.[0-9]+)?(?<timezone>Z|[+-](?:[0-9][0-9]):[0-9][0-9])$\"},\"EndTime\":{\"type\":\"string\",\"format\":\"date-time\",\"pattern\":\"^(?<year>-?(?:[1-9][0-9]*)?[0-9]{4})-(?<month>1[0-2]|0[1-9])-(?<day>3[01]|0[1-9]|[12][0-9])T(?<hour>2[0-3]|[01][0-9]):(?<minute>[0-5][0-9]):(?<second>[0-5][0-9])(?<ms>\\\\.[0-9]+)?(?<timezone>Z|[+-](?:[0-9][0-9]):[0-9][0-9])$\"}}}}},\"DataCollection\":{\"type\":\"object\",\"required\":[\"UID\",\"Name\"],\"properties\":{\"UID\":{\"type\":\"string\"},\"Name\":{\"type\":\"string\"},\"MajorRevision\":{\"type\":\"string\"},\"MinorRevision\":{\"type\":\"string\"}}},\"BillOfMaterials\":{\"type\":\"object\",\"required\":[\"UID\",\"Name\"],\"properties\":{\"UID\":{\"type\":\"string\"},\"Name\":{\"type\":\"string\"},\"MajorRevision\":{\"type\":\"string\"},\"MinorRevision\":{\"type\":\"string\"}}},\"BillOfTools\":{\"type\":\"object\",\"required\":[\"UID\",\"Name\"],\"properties\":{\"UID\":{\"type\":\"string\"},\"Name\":{\"type\":\"string\"},\"MajorRevision\":{\"type\":\"string\"},\"MinorRevision\":{\"type\":\"string\"}}},\"Recipe\":{\"type\":\"object\",\"required\":[\"UID\",\"Name\"],\"properties\":{\"UID\":{\"type\":\"string\"},\"Name\":{\"type\":\"string\"},\"MajorRevision\":{\"type\":\"string\"},\"MinorRevision\":{\"type\":\"string\"}}},\"Employee\":{\"type\":\"object\",\"required\":[\"UID\",\"Name\"],\"properties\":{\"UID\":{\"type\":\"string\"},\"Name\":{\"type\":\"string\"},\"Number\":{\"type\":\"string\"},\"Team\":{\"type\":\"string\"}}},\"Attributes\":{\"type\":\"object\",\"required\":[\"Names\",\"Values\"],\"properties\":{\"Names\":{\"type\":\"array\",\"items\":{\"type\":\"string\"}},\"Values\":{\"type\":\"array\",\"items\":{\"type\":\"string\"}}}},\"Previous\":{\"type\":\"object\",\"properties\":{\"Step\":{\"$ref\":\"#/definitions/Previous/definitions/Step\"},\"Material\":{\"$ref\":\"#/definitions/Previous/definitions/Material\"},\"Product\":{\"$ref\":\"#/definitions/Previous/definitions/Product\"},\"Flow\":{\"$ref\":\"#/definitions/Previous/definitions/Flow\"}},\"definitions\":{\"Step\":{\"type\":\"object\",\"required\":[\"UID\",\"Name\"],\"properties\":{\"UID\":{\"type\":\"string\"},\"Name\":{\"type\":\"string\"}}},\"Material\":{\"type\":\"object\",\"required\":[\"DateEnteredStep\",\"PrimaryQty\",\"PrimaryUnits\",\"FlowPath\",\"Form\"],\"properties\":{\"DateEnteredFacility\":{\"type\":\"string\",\"format\":\"date-time\",\"pattern\":\"^(?<year>-?(?:[1-9][0-9]*)?[0-9]{4})-(?<month>1[0-2]|0[1-9])-(?<day>3[01]|0[1-9]|[12][0-9])T(?<hour>2[0-3]|[01][0-9]):(?<minute>[0-5][0-9]):(?<second>[0-5][0-9])(?<ms>\\\\.[0-9]+)?(?<timezone>Z|[+-](?:[0-9][0-9]):[0-9][0-9])$\"},\"DateEnteredStep\":{\"type\":\"string\",\"format\":\"date-time\",\"pattern\":\"^(?<year>-?(?:[1-9][0-9]*)?[0-9]{4})-(?<month>1[0-2]|0[1-9])-(?<day>3[01]|0[1-9]|[12][0-9])T(?<hour>2[0-3]|[01][0-9]):(?<minute>[0-5][0-9]):(?<second>[0-5][0-9])(?<ms>\\\\.[0-9]+)?(?<timezone>Z|[+-](?:[0-9][0-9]):[0-9][0-9])$\"},\"PrimaryQty\":{\"type\":\"number\"},\"PrimaryUnits\":{\"type\":\"string\"},\"SecondaryQty\":{\"type\":\"number\"},\"SecondaryUnits\":{\"type\":\"string\"},\"SubMaterialsPrimaryQty\":{\"type\":\"number\"},\"SubMaterialsSecondaryQty\":{\"type\":\"number\"},\"SubMaterialCount\":{\"type\":\"integer\"},\"FlowPath\":{\"type\":\"string\"},\"Form\":{\"type\":\"string\"},\"ReworkCount\":{\"type\":\"integer\"},\"HoldCount\":{\"type\":\"integer\"}}},\"Product\":{\"type\":\"object\",\"required\":[\"UID\",\"Name\"],\"properties\":{\"UID\":{\"type\":\"string\"},\"Name\":{\"type\":\"string\"},\"MajorRevision\":{\"type\":\"string\"},\"MinorRevision\":{\"type\":\"string\"},\"Type\":{\"type\":\"string\"}}},\"Flow\":{\"type\":\"object\",\"required\":[\"UID\",\"Name\"],\"properties\":{\"UID\":{\"type\":\"string\"},\"Name\":{\"type\":\"string\"},\"MajorRevision\":{\"type\":\"string\"},\"MinorRevision\":{\"type\":\"string\"},\"Type\":{\"type\":\"string\"}}}}}}}",
                "CreatedOn": "2026-01-30T16:29:18.533+00:00",
                "SchemaProperties": [
                    {
                        "$id": "4",
                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                        "DataType": 10,
                        "Attributes": {
                            "$typeCMF": "CMFMap",
                            "CMFMapData": []
                        },
                        "CreatedBy": "System",
                        "Description": "Header",
                        "CreatedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsTemplate": false,
                        "Id": "2601301626030000675",
                        "Name": "Header",
                        "LastOperationHistorySeq": "630",
                        "FriendlyName": "Header",
                        "LastServiceHistoryId": "2601301626030000266",
                        "IoTSchema": {
                            "$id": "5",
                            "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                            "IsShared": false,
                            "Attributes": {
                                "$typeCMF": "CMFMap",
                                "CMFMapData": []
                            },
                            "CreatedOn": "0001-01-01T00:00:00+00:00",
                            "IsTemplate": false,
                            "Id": "2601301626030000088",
                            "LastOperationHistorySeq": "0",
                            "LastServiceHistoryId": "0",
                            "LockType": 0,
                            "ModifiedOn": "0001-01-01T00:00:00+00:00",
                            "ObjectLocked": false,
                            "UniversalState": 0
                        },
                        "LockType": 0,
                        "IndexOrder": 0,
                        "IoTSchemaReference": {
                            "$id": "6",
                            "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                            "IsShared": false,
                            "Attributes": {
                                "$typeCMF": "CMFMap",
                                "CMFMapData": []
                            },
                            "CreatedBy": "System",
                            "CreatedOn": "2026-01-30T16:29:18.547+00:00",
                            "SchemaProperties": [
                                {
                                    "$id": "7",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.55+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000500",
                                    "Name": "CorrelationId",
                                    "LastOperationHistorySeq": "354",
                                    "FriendlyName": "CorrelationId",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$id": "8",
                                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                                        "IsShared": false,
                                        "Attributes": {
                                            "$typeCMF": "CMFMap",
                                            "CMFMapData": []
                                        },
                                        "CreatedOn": "0001-01-01T00:00:00+00:00",
                                        "IsTemplate": false,
                                        "Id": "2601301626030000089",
                                        "LastOperationHistorySeq": "0",
                                        "LastServiceHistoryId": "0",
                                        "LockType": 0,
                                        "ModifiedOn": "0001-01-01T00:00:00+00:00",
                                        "ObjectLocked": false,
                                        "UniversalState": 0
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.55+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "9",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.55+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000501",
                                    "Name": "Operation",
                                    "LastOperationHistorySeq": "354",
                                    "FriendlyName": "Operation",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "8"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 7,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.55+00:00",
                                    "IsIndexed": true,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "10",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 2,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.55+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000502",
                                    "Name": "DateTime",
                                    "LastOperationHistorySeq": "354",
                                    "FriendlyName": "DateTime",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "8"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 8,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.55+00:00",
                                    "IsIndexed": true,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "11",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 2,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.55+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000503",
                                    "Name": "StartDateTime",
                                    "LastOperationHistorySeq": "354",
                                    "FriendlyName": "StartDateTime",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "8"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.55+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "12",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.55+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000504",
                                    "Name": "Application",
                                    "LastOperationHistorySeq": "354",
                                    "FriendlyName": "Application",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "8"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.55+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "13",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.55+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000505",
                                    "Name": "CDMVersion",
                                    "LastOperationHistorySeq": "354",
                                    "FriendlyName": "CDMVersion",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "8"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.55+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "14",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.55+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000506",
                                    "Name": "Service",
                                    "LastOperationHistorySeq": "354",
                                    "FriendlyName": "Service",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "8"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.55+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "15",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.55+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000507",
                                    "Name": "DataGroupRefs",
                                    "LastOperationHistorySeq": "354",
                                    "FriendlyName": "DataGroupRefs",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "8"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": true,
                                    "ModifiedOn": "2026-01-30T16:29:18.55+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "16",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.55+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000508",
                                    "Name": "DataGroups",
                                    "LastOperationHistorySeq": "354",
                                    "FriendlyName": "DataGroups",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "8"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": true,
                                    "ModifiedOn": "2026-01-30T16:29:18.55+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                }
                            ],
                            "IsTemplate": false,
                            "Id": "2601301626030000089",
                            "Name": "Header_17581887177472468",
                            "LastOperationHistorySeq": "352",
                            "LastServiceHistoryId": "2601301626030000266",
                            "LockType": 0,
                            "ModifiedBy": "System",
                            "ModifiedOn": "2026-01-30T16:29:18.547+00:00",
                            "ObjectLocked": false,
                            "UniversalState": 2
                        },
                        "ModifiedBy": "System",
                        "IsArray": false,
                        "ModifiedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsIndexed": false,
                        "ObjectLocked": false,
                        "IsRequired": true,
                        "UniversalState": 2,
                        "Order": 1,
                        "IsUserIdentifier": false
                    },
                    {
                        "$id": "17",
                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                        "DataType": 10,
                        "Attributes": {
                            "$typeCMF": "CMFMap",
                            "CMFMapData": []
                        },
                        "CreatedBy": "System",
                        "CreatedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsTemplate": false,
                        "Id": "2601301626030000676",
                        "Name": "Enterprise",
                        "LastOperationHistorySeq": "630",
                        "FriendlyName": "Enterprise",
                        "LastServiceHistoryId": "2601301626030000266",
                        "IoTSchema": {
                            "$ref": "5"
                        },
                        "LockType": 0,
                        "IndexOrder": 0,
                        "IoTSchemaReference": {
                            "$id": "18",
                            "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                            "IsShared": false,
                            "Attributes": {
                                "$typeCMF": "CMFMap",
                                "CMFMapData": []
                            },
                            "CreatedBy": "System",
                            "CreatedOn": "2026-01-30T16:29:18.563+00:00",
                            "SchemaProperties": [
                                {
                                    "$id": "19",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.567+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000509",
                                    "Name": "UID",
                                    "LastOperationHistorySeq": "363",
                                    "FriendlyName": "UID",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$id": "20",
                                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                                        "IsShared": false,
                                        "Attributes": {
                                            "$typeCMF": "CMFMap",
                                            "CMFMapData": []
                                        },
                                        "CreatedOn": "0001-01-01T00:00:00+00:00",
                                        "IsTemplate": false,
                                        "Id": "2601301626030000090",
                                        "LastOperationHistorySeq": "0",
                                        "LastServiceHistoryId": "0",
                                        "LockType": 0,
                                        "ModifiedOn": "0001-01-01T00:00:00+00:00",
                                        "ObjectLocked": false,
                                        "UniversalState": 0
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.567+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "21",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.567+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000510",
                                    "Name": "Name",
                                    "LastOperationHistorySeq": "363",
                                    "FriendlyName": "Name",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "20"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 1,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.567+00:00",
                                    "IsIndexed": true,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "22",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 5,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.567+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000511",
                                    "Name": "DisplayOrder",
                                    "LastOperationHistorySeq": "363",
                                    "FriendlyName": "DisplayOrder",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "20"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.567+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                }
                            ],
                            "IsTemplate": false,
                            "Id": "2601301626030000090",
                            "Name": "Enterprise_17581887206167622",
                            "LastOperationHistorySeq": "361",
                            "LastServiceHistoryId": "2601301626030000266",
                            "LockType": 0,
                            "ModifiedBy": "System",
                            "ModifiedOn": "2026-01-30T16:29:18.563+00:00",
                            "ObjectLocked": false,
                            "UniversalState": 2
                        },
                        "ModifiedBy": "System",
                        "IsArray": false,
                        "ModifiedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsIndexed": false,
                        "ObjectLocked": false,
                        "IsRequired": true,
                        "UniversalState": 2,
                        "Order": 1,
                        "IsUserIdentifier": false
                    },
                    {
                        "$id": "23",
                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                        "DataType": 10,
                        "Attributes": {
                            "$typeCMF": "CMFMap",
                            "CMFMapData": []
                        },
                        "CreatedBy": "System",
                        "CreatedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsTemplate": false,
                        "Id": "2601301626030000677",
                        "Name": "Site",
                        "LastOperationHistorySeq": "630",
                        "FriendlyName": "Site",
                        "LastServiceHistoryId": "2601301626030000266",
                        "IoTSchema": {
                            "$ref": "5"
                        },
                        "LockType": 0,
                        "IndexOrder": 0,
                        "IoTSchemaReference": {
                            "$id": "24",
                            "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                            "IsShared": false,
                            "Attributes": {
                                "$typeCMF": "CMFMap",
                                "CMFMapData": []
                            },
                            "CreatedBy": "System",
                            "CreatedOn": "2026-01-30T16:29:18.577+00:00",
                            "SchemaProperties": [
                                {
                                    "$id": "25",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.587+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000512",
                                    "Name": "UID",
                                    "LastOperationHistorySeq": "372",
                                    "FriendlyName": "UID",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$id": "26",
                                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                                        "IsShared": false,
                                        "Attributes": {
                                            "$typeCMF": "CMFMap",
                                            "CMFMapData": []
                                        },
                                        "CreatedOn": "0001-01-01T00:00:00+00:00",
                                        "IsTemplate": false,
                                        "Id": "2601301626030000091",
                                        "LastOperationHistorySeq": "0",
                                        "LastServiceHistoryId": "0",
                                        "LockType": 0,
                                        "ModifiedOn": "0001-01-01T00:00:00+00:00",
                                        "ObjectLocked": false,
                                        "UniversalState": 0
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.587+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "27",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.587+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000513",
                                    "Name": "Name",
                                    "LastOperationHistorySeq": "372",
                                    "FriendlyName": "Name",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "26"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 2,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.587+00:00",
                                    "IsIndexed": true,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "28",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 5,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.587+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000514",
                                    "Name": "DisplayOrder",
                                    "LastOperationHistorySeq": "372",
                                    "FriendlyName": "DisplayOrder",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "26"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.587+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                }
                            ],
                            "IsTemplate": false,
                            "Id": "2601301626030000091",
                            "Name": "Site_17581887244733312",
                            "LastOperationHistorySeq": "370",
                            "LastServiceHistoryId": "2601301626030000266",
                            "LockType": 0,
                            "ModifiedBy": "System",
                            "ModifiedOn": "2026-01-30T16:29:18.577+00:00",
                            "ObjectLocked": false,
                            "UniversalState": 2
                        },
                        "ModifiedBy": "System",
                        "IsArray": false,
                        "ModifiedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsIndexed": false,
                        "ObjectLocked": false,
                        "IsRequired": true,
                        "UniversalState": 2,
                        "Order": 1,
                        "IsUserIdentifier": false
                    },
                    {
                        "$id": "29",
                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                        "DataType": 10,
                        "Attributes": {
                            "$typeCMF": "CMFMap",
                            "CMFMapData": []
                        },
                        "CreatedBy": "System",
                        "CreatedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsTemplate": false,
                        "Id": "2601301626030000678",
                        "Name": "Facility",
                        "LastOperationHistorySeq": "630",
                        "FriendlyName": "Facility",
                        "LastServiceHistoryId": "2601301626030000266",
                        "IoTSchema": {
                            "$ref": "5"
                        },
                        "LockType": 0,
                        "IndexOrder": 0,
                        "IoTSchemaReference": {
                            "$id": "30",
                            "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                            "IsShared": false,
                            "Attributes": {
                                "$typeCMF": "CMFMap",
                                "CMFMapData": []
                            },
                            "CreatedBy": "System",
                            "CreatedOn": "2026-01-30T16:29:18.597+00:00",
                            "SchemaProperties": [
                                {
                                    "$id": "31",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.6+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000515",
                                    "Name": "UID",
                                    "LastOperationHistorySeq": "381",
                                    "FriendlyName": "UID",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$id": "32",
                                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                                        "IsShared": false,
                                        "Attributes": {
                                            "$typeCMF": "CMFMap",
                                            "CMFMapData": []
                                        },
                                        "CreatedOn": "0001-01-01T00:00:00+00:00",
                                        "IsTemplate": false,
                                        "Id": "2601301626030000092",
                                        "LastOperationHistorySeq": "0",
                                        "LastServiceHistoryId": "0",
                                        "LockType": 0,
                                        "ModifiedOn": "0001-01-01T00:00:00+00:00",
                                        "ObjectLocked": false,
                                        "UniversalState": 0
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.6+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "33",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.6+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000516",
                                    "Name": "Name",
                                    "LastOperationHistorySeq": "381",
                                    "FriendlyName": "Name",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "32"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 3,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.6+00:00",
                                    "IsIndexed": true,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "34",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 5,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.6+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000517",
                                    "Name": "DisplayOrder",
                                    "LastOperationHistorySeq": "381",
                                    "FriendlyName": "DisplayOrder",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "32"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.6+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                }
                            ],
                            "IsTemplate": false,
                            "Id": "2601301626030000092",
                            "Name": "Facility_17581887266627302",
                            "LastOperationHistorySeq": "379",
                            "LastServiceHistoryId": "2601301626030000266",
                            "LockType": 0,
                            "ModifiedBy": "System",
                            "ModifiedOn": "2026-01-30T16:29:18.597+00:00",
                            "ObjectLocked": false,
                            "UniversalState": 2
                        },
                        "ModifiedBy": "System",
                        "IsArray": false,
                        "ModifiedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsIndexed": false,
                        "ObjectLocked": false,
                        "IsRequired": true,
                        "UniversalState": 2,
                        "Order": 1,
                        "IsUserIdentifier": false
                    },
                    {
                        "$id": "35",
                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                        "DataType": 10,
                        "Attributes": {
                            "$typeCMF": "CMFMap",
                            "CMFMapData": []
                        },
                        "CreatedBy": "System",
                        "CreatedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsTemplate": false,
                        "Id": "2601301626030000679",
                        "Name": "Material",
                        "LastOperationHistorySeq": "630",
                        "FriendlyName": "Material",
                        "LastServiceHistoryId": "2601301626030000266",
                        "IoTSchema": {
                            "$ref": "5"
                        },
                        "LockType": 0,
                        "IndexOrder": 0,
                        "IoTSchemaReference": {
                            "$id": "36",
                            "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                            "IsShared": false,
                            "Attributes": {
                                "$typeCMF": "CMFMap",
                                "CMFMapData": []
                            },
                            "CreatedBy": "System",
                            "CreatedOn": "2026-01-30T16:29:18.61+00:00",
                            "SchemaProperties": [
                                {
                                    "$id": "37",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000518",
                                    "Name": "UID",
                                    "LastOperationHistorySeq": "390",
                                    "FriendlyName": "UID",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$id": "38",
                                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                                        "IsShared": false,
                                        "Attributes": {
                                            "$typeCMF": "CMFMap",
                                            "CMFMapData": []
                                        },
                                        "CreatedOn": "0001-01-01T00:00:00+00:00",
                                        "IsTemplate": false,
                                        "Id": "2601301626030000093",
                                        "LastOperationHistorySeq": "0",
                                        "LastServiceHistoryId": "0",
                                        "LockType": 0,
                                        "ModifiedOn": "0001-01-01T00:00:00+00:00",
                                        "ObjectLocked": false,
                                        "UniversalState": 0
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "39",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000519",
                                    "Name": "Name",
                                    "LastOperationHistorySeq": "390",
                                    "FriendlyName": "Name",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "38"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 6,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsIndexed": true,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "40",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 2,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000520",
                                    "Name": "CreatedOn",
                                    "LastOperationHistorySeq": "390",
                                    "FriendlyName": "CreatedOn",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "38"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "41",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000521",
                                    "Name": "CreatedBy",
                                    "LastOperationHistorySeq": "390",
                                    "FriendlyName": "CreatedBy",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "38"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": true
                                },
                                {
                                    "$id": "42",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 2,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000522",
                                    "Name": "ModifiedOn",
                                    "LastOperationHistorySeq": "390",
                                    "FriendlyName": "ModifiedOn",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "38"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "43",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000523",
                                    "Name": "ModifiedBy",
                                    "LastOperationHistorySeq": "390",
                                    "FriendlyName": "ModifiedBy",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "38"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": true
                                },
                                {
                                    "$id": "44",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000524",
                                    "Name": "Type",
                                    "LastOperationHistorySeq": "390",
                                    "FriendlyName": "Type",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "38"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "45",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 2,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000525",
                                    "Name": "DateEnteredStep",
                                    "LastOperationHistorySeq": "390",
                                    "FriendlyName": "DateEnteredStep",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "38"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "46",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000526",
                                    "Name": "Form",
                                    "LastOperationHistorySeq": "390",
                                    "FriendlyName": "Form",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "38"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "47",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000527",
                                    "Name": "FlowPath",
                                    "LastOperationHistorySeq": "390",
                                    "FriendlyName": "FlowPath",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "38"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "48",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000528",
                                    "Name": "LogicalFlowPath",
                                    "LastOperationHistorySeq": "390",
                                    "FriendlyName": "LogicalFlowPath",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "38"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "49",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 1,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000529",
                                    "Name": "PrimaryQty",
                                    "LastOperationHistorySeq": "390",
                                    "FriendlyName": "PrimaryQty",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "38"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "50",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000530",
                                    "Name": "PrimaryUnits",
                                    "LastOperationHistorySeq": "390",
                                    "FriendlyName": "PrimaryUnits",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "38"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "51",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 1,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000531",
                                    "Name": "SecondaryQty",
                                    "LastOperationHistorySeq": "390",
                                    "FriendlyName": "SecondaryQty",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "38"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "52",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000532",
                                    "Name": "SecondaryUnits",
                                    "LastOperationHistorySeq": "390",
                                    "FriendlyName": "SecondaryUnits",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "38"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "53",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 1,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000533",
                                    "Name": "SubMaterialsPrimaryQty",
                                    "LastOperationHistorySeq": "390",
                                    "FriendlyName": "SubMaterialsPrimaryQty",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "38"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "54",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 1,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000534",
                                    "Name": "SubMaterialsSecondaryQty",
                                    "LastOperationHistorySeq": "390",
                                    "FriendlyName": "SubMaterialsSecondaryQty",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "38"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "55",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 5,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000535",
                                    "Name": "SubMaterialCount",
                                    "LastOperationHistorySeq": "390",
                                    "FriendlyName": "SubMaterialCount",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "38"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "56",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000536",
                                    "Name": "ProcessingState",
                                    "LastOperationHistorySeq": "390",
                                    "FriendlyName": "ProcessingState",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "38"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "57",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 5,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000537",
                                    "Name": "ReworkCount",
                                    "LastOperationHistorySeq": "390",
                                    "FriendlyName": "ReworkCount",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "38"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "58",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 5,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000538",
                                    "Name": "HoldCount",
                                    "LastOperationHistorySeq": "390",
                                    "FriendlyName": "HoldCount",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "38"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "59",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 1,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000539",
                                    "Name": "IdealTimePerUnitInSecs",
                                    "LastOperationHistorySeq": "390",
                                    "FriendlyName": "IdealTimePerUnitInSecs",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "38"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "60",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 1,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000540",
                                    "Name": "ReferenceTimePerUnitInSecs",
                                    "LastOperationHistorySeq": "390",
                                    "FriendlyName": "ReferenceTimePerUnitInSecs",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "38"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "61",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 2,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000541",
                                    "Name": "DateEnteredFacility",
                                    "LastOperationHistorySeq": "390",
                                    "FriendlyName": "DateEnteredFacility",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "38"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.62+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                }
                            ],
                            "IsTemplate": false,
                            "Id": "2601301626030000093",
                            "Name": "Material_17581887283376692",
                            "LastOperationHistorySeq": "388",
                            "LastServiceHistoryId": "2601301626030000266",
                            "LockType": 0,
                            "ModifiedBy": "System",
                            "ModifiedOn": "2026-01-30T16:29:18.61+00:00",
                            "ObjectLocked": false,
                            "UniversalState": 2
                        },
                        "ModifiedBy": "System",
                        "IsArray": false,
                        "ModifiedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsIndexed": false,
                        "ObjectLocked": false,
                        "IsRequired": true,
                        "UniversalState": 2,
                        "Order": 1,
                        "IsUserIdentifier": false
                    },
                    {
                        "$id": "62",
                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                        "DataType": 10,
                        "Attributes": {
                            "$typeCMF": "CMFMap",
                            "CMFMapData": []
                        },
                        "CreatedBy": "System",
                        "CreatedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsTemplate": false,
                        "Id": "2601301626030000680",
                        "Name": "ParentMaterial",
                        "LastOperationHistorySeq": "630",
                        "FriendlyName": "ParentMaterial",
                        "LastServiceHistoryId": "2601301626030000266",
                        "IoTSchema": {
                            "$ref": "5"
                        },
                        "LockType": 0,
                        "IndexOrder": 0,
                        "IoTSchemaReference": {
                            "$id": "63",
                            "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                            "IsShared": false,
                            "Attributes": {
                                "$typeCMF": "CMFMap",
                                "CMFMapData": []
                            },
                            "CreatedBy": "System",
                            "CreatedOn": "2026-01-30T16:29:18.633+00:00",
                            "SchemaProperties": [
                                {
                                    "$id": "64",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000542",
                                    "Name": "UID",
                                    "LastOperationHistorySeq": "399",
                                    "FriendlyName": "UID",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$id": "65",
                                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                                        "IsShared": false,
                                        "Attributes": {
                                            "$typeCMF": "CMFMap",
                                            "CMFMapData": []
                                        },
                                        "CreatedOn": "0001-01-01T00:00:00+00:00",
                                        "IsTemplate": false,
                                        "Id": "2601301626030000094",
                                        "LastOperationHistorySeq": "0",
                                        "LastServiceHistoryId": "0",
                                        "LockType": 0,
                                        "ModifiedOn": "0001-01-01T00:00:00+00:00",
                                        "ObjectLocked": false,
                                        "UniversalState": 0
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "66",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000543",
                                    "Name": "Name",
                                    "LastOperationHistorySeq": "399",
                                    "FriendlyName": "Name",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "65"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "67",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 2,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000544",
                                    "Name": "CreatedOn",
                                    "LastOperationHistorySeq": "399",
                                    "FriendlyName": "CreatedOn",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "65"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "68",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000545",
                                    "Name": "CreatedBy",
                                    "LastOperationHistorySeq": "399",
                                    "FriendlyName": "CreatedBy",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "65"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": true
                                },
                                {
                                    "$id": "69",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 2,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000546",
                                    "Name": "ModifiedOn",
                                    "LastOperationHistorySeq": "399",
                                    "FriendlyName": "ModifiedOn",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "65"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "70",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000547",
                                    "Name": "ModifiedBy",
                                    "LastOperationHistorySeq": "399",
                                    "FriendlyName": "ModifiedBy",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "65"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": true
                                },
                                {
                                    "$id": "71",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000548",
                                    "Name": "Type",
                                    "LastOperationHistorySeq": "399",
                                    "FriendlyName": "Type",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "65"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "72",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 2,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000549",
                                    "Name": "DateEnteredStep",
                                    "LastOperationHistorySeq": "399",
                                    "FriendlyName": "DateEnteredStep",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "65"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "73",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000550",
                                    "Name": "Form",
                                    "LastOperationHistorySeq": "399",
                                    "FriendlyName": "Form",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "65"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "74",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000551",
                                    "Name": "FlowPath",
                                    "LastOperationHistorySeq": "399",
                                    "FriendlyName": "FlowPath",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "65"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "75",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000552",
                                    "Name": "LogicalFlowPath",
                                    "LastOperationHistorySeq": "399",
                                    "FriendlyName": "LogicalFlowPath",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "65"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "76",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 1,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000553",
                                    "Name": "PrimaryQty",
                                    "LastOperationHistorySeq": "399",
                                    "FriendlyName": "PrimaryQty",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "65"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "77",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000554",
                                    "Name": "PrimaryUnits",
                                    "LastOperationHistorySeq": "399",
                                    "FriendlyName": "PrimaryUnits",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "65"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "78",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 1,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000555",
                                    "Name": "SecondaryQty",
                                    "LastOperationHistorySeq": "399",
                                    "FriendlyName": "SecondaryQty",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "65"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "79",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000556",
                                    "Name": "SecondaryUnits",
                                    "LastOperationHistorySeq": "399",
                                    "FriendlyName": "SecondaryUnits",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "65"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "80",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 1,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000557",
                                    "Name": "SubMaterialsPrimaryQty",
                                    "LastOperationHistorySeq": "399",
                                    "FriendlyName": "SubMaterialsPrimaryQty",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "65"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "81",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 1,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000558",
                                    "Name": "SubMaterialsSecondaryQty",
                                    "LastOperationHistorySeq": "399",
                                    "FriendlyName": "SubMaterialsSecondaryQty",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "65"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "82",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 5,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000559",
                                    "Name": "SubMaterialCount",
                                    "LastOperationHistorySeq": "399",
                                    "FriendlyName": "SubMaterialCount",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "65"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "83",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000560",
                                    "Name": "ProcessingState",
                                    "LastOperationHistorySeq": "399",
                                    "FriendlyName": "ProcessingState",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "65"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "84",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 5,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000561",
                                    "Name": "ReworkCount",
                                    "LastOperationHistorySeq": "399",
                                    "FriendlyName": "ReworkCount",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "65"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "85",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 5,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000562",
                                    "Name": "HoldCount",
                                    "LastOperationHistorySeq": "399",
                                    "FriendlyName": "HoldCount",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "65"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.64+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                }
                            ],
                            "IsTemplate": false,
                            "Id": "2601301626030000094",
                            "Name": "ParentMaterial_17581887301129531",
                            "LastOperationHistorySeq": "397",
                            "LastServiceHistoryId": "2601301626030000266",
                            "LockType": 0,
                            "ModifiedBy": "System",
                            "ModifiedOn": "2026-01-30T16:29:18.633+00:00",
                            "ObjectLocked": false,
                            "UniversalState": 2
                        },
                        "ModifiedBy": "System",
                        "IsArray": false,
                        "ModifiedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsIndexed": false,
                        "ObjectLocked": false,
                        "IsRequired": false,
                        "UniversalState": 2,
                        "Order": 1,
                        "IsUserIdentifier": false
                    },
                    {
                        "$id": "86",
                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                        "DataType": 10,
                        "Attributes": {
                            "$typeCMF": "CMFMap",
                            "CMFMapData": []
                        },
                        "CreatedBy": "System",
                        "CreatedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsTemplate": false,
                        "Id": "2601301626030000681",
                        "Name": "Area",
                        "LastOperationHistorySeq": "630",
                        "FriendlyName": "Area",
                        "LastServiceHistoryId": "2601301626030000266",
                        "IoTSchema": {
                            "$ref": "5"
                        },
                        "LockType": 0,
                        "IndexOrder": 0,
                        "IoTSchemaReference": {
                            "$id": "87",
                            "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                            "IsShared": false,
                            "Attributes": {
                                "$typeCMF": "CMFMap",
                                "CMFMapData": []
                            },
                            "CreatedBy": "System",
                            "CreatedOn": "2026-01-30T16:29:18.653+00:00",
                            "SchemaProperties": [
                                {
                                    "$id": "88",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.66+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000563",
                                    "Name": "UID",
                                    "LastOperationHistorySeq": "408",
                                    "FriendlyName": "UID",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$id": "89",
                                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                                        "IsShared": false,
                                        "Attributes": {
                                            "$typeCMF": "CMFMap",
                                            "CMFMapData": []
                                        },
                                        "CreatedOn": "0001-01-01T00:00:00+00:00",
                                        "IsTemplate": false,
                                        "Id": "2601301626030000095",
                                        "LastOperationHistorySeq": "0",
                                        "LastServiceHistoryId": "0",
                                        "LockType": 0,
                                        "ModifiedOn": "0001-01-01T00:00:00+00:00",
                                        "ObjectLocked": false,
                                        "UniversalState": 0
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.66+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "90",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.66+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000564",
                                    "Name": "Name",
                                    "LastOperationHistorySeq": "408",
                                    "FriendlyName": "Name",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "89"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 4,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.66+00:00",
                                    "IsIndexed": true,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "91",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 5,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.66+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000565",
                                    "Name": "DisplayOrder",
                                    "LastOperationHistorySeq": "408",
                                    "FriendlyName": "DisplayOrder",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "89"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.66+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "92",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.66+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000566",
                                    "Name": "Type",
                                    "LastOperationHistorySeq": "408",
                                    "FriendlyName": "Type",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "89"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.66+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                }
                            ],
                            "IsTemplate": false,
                            "Id": "2601301626030000095",
                            "Name": "Area_17581887317720045",
                            "LastOperationHistorySeq": "406",
                            "LastServiceHistoryId": "2601301626030000266",
                            "LockType": 0,
                            "ModifiedBy": "System",
                            "ModifiedOn": "2026-01-30T16:29:18.653+00:00",
                            "ObjectLocked": false,
                            "UniversalState": 2
                        },
                        "ModifiedBy": "System",
                        "IsArray": false,
                        "ModifiedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsIndexed": false,
                        "ObjectLocked": false,
                        "IsRequired": true,
                        "UniversalState": 2,
                        "Order": 1,
                        "IsUserIdentifier": false
                    },
                    {
                        "$id": "93",
                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                        "DataType": 10,
                        "Attributes": {
                            "$typeCMF": "CMFMap",
                            "CMFMapData": []
                        },
                        "CreatedBy": "System",
                        "CreatedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsTemplate": false,
                        "Id": "2601301626030000682",
                        "Name": "Resource",
                        "LastOperationHistorySeq": "630",
                        "FriendlyName": "Resource",
                        "LastServiceHistoryId": "2601301626030000266",
                        "IoTSchema": {
                            "$ref": "5"
                        },
                        "LockType": 0,
                        "IndexOrder": 0,
                        "IoTSchemaReference": {
                            "$id": "94",
                            "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                            "IsShared": false,
                            "Attributes": {
                                "$typeCMF": "CMFMap",
                                "CMFMapData": []
                            },
                            "CreatedBy": "System",
                            "CreatedOn": "2026-01-30T16:29:18.67+00:00",
                            "SchemaProperties": [
                                {
                                    "$id": "95",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.677+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000567",
                                    "Name": "UID",
                                    "LastOperationHistorySeq": "417",
                                    "FriendlyName": "UID",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$id": "96",
                                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                                        "IsShared": false,
                                        "Attributes": {
                                            "$typeCMF": "CMFMap",
                                            "CMFMapData": []
                                        },
                                        "CreatedOn": "0001-01-01T00:00:00+00:00",
                                        "IsTemplate": false,
                                        "Id": "2601301626030000096",
                                        "LastOperationHistorySeq": "0",
                                        "LastServiceHistoryId": "0",
                                        "LockType": 0,
                                        "ModifiedOn": "0001-01-01T00:00:00+00:00",
                                        "ObjectLocked": false,
                                        "UniversalState": 0
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.677+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "97",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.677+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000568",
                                    "Name": "Name",
                                    "LastOperationHistorySeq": "417",
                                    "FriendlyName": "Name",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "96"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.677+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "98",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 5,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.677+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000569",
                                    "Name": "DisplayOrder",
                                    "LastOperationHistorySeq": "417",
                                    "FriendlyName": "DisplayOrder",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "96"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.677+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "99",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.677+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000570",
                                    "Name": "ResourceType",
                                    "LastOperationHistorySeq": "417",
                                    "FriendlyName": "ResourceType",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "96"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.677+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "100",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 5,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.677+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000571",
                                    "Name": "Position",
                                    "LastOperationHistorySeq": "417",
                                    "FriendlyName": "Position",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "96"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.677+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "101",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.677+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000572",
                                    "Name": "Model",
                                    "LastOperationHistorySeq": "417",
                                    "FriendlyName": "Model",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "96"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.677+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "102",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.677+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000573",
                                    "Name": "Service",
                                    "LastOperationHistorySeq": "417",
                                    "FriendlyName": "Service",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "96"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.677+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                }
                            ],
                            "IsTemplate": false,
                            "Id": "2601301626030000096",
                            "Name": "Resource_17581887335275129",
                            "LastOperationHistorySeq": "415",
                            "LastServiceHistoryId": "2601301626030000266",
                            "LockType": 0,
                            "ModifiedBy": "System",
                            "ModifiedOn": "2026-01-30T16:29:18.67+00:00",
                            "ObjectLocked": false,
                            "UniversalState": 2
                        },
                        "ModifiedBy": "System",
                        "IsArray": false,
                        "ModifiedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsIndexed": false,
                        "ObjectLocked": false,
                        "IsRequired": false,
                        "UniversalState": 2,
                        "Order": 1,
                        "IsUserIdentifier": false
                    },
                    {
                        "$id": "103",
                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                        "DataType": 10,
                        "Attributes": {
                            "$typeCMF": "CMFMap",
                            "CMFMapData": []
                        },
                        "CreatedBy": "System",
                        "CreatedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsTemplate": false,
                        "Id": "2601301626030000683",
                        "Name": "ParentResource",
                        "LastOperationHistorySeq": "630",
                        "FriendlyName": "ParentResource",
                        "LastServiceHistoryId": "2601301626030000266",
                        "IoTSchema": {
                            "$ref": "5"
                        },
                        "LockType": 0,
                        "IndexOrder": 0,
                        "IoTSchemaReference": {
                            "$id": "104",
                            "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                            "IsShared": false,
                            "Attributes": {
                                "$typeCMF": "CMFMap",
                                "CMFMapData": []
                            },
                            "CreatedBy": "System",
                            "CreatedOn": "2026-01-30T16:29:18.687+00:00",
                            "SchemaProperties": [
                                {
                                    "$id": "105",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.69+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000574",
                                    "Name": "UID",
                                    "LastOperationHistorySeq": "426",
                                    "FriendlyName": "UID",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$id": "106",
                                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                                        "IsShared": false,
                                        "Attributes": {
                                            "$typeCMF": "CMFMap",
                                            "CMFMapData": []
                                        },
                                        "CreatedOn": "0001-01-01T00:00:00+00:00",
                                        "IsTemplate": false,
                                        "Id": "2601301626030000097",
                                        "LastOperationHistorySeq": "0",
                                        "LastServiceHistoryId": "0",
                                        "LockType": 0,
                                        "ModifiedOn": "0001-01-01T00:00:00+00:00",
                                        "ObjectLocked": false,
                                        "UniversalState": 0
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.69+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "107",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.69+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000575",
                                    "Name": "Name",
                                    "LastOperationHistorySeq": "426",
                                    "FriendlyName": "Name",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "106"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.69+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                }
                            ],
                            "IsTemplate": false,
                            "Id": "2601301626030000097",
                            "Name": "ParentResource_17581887346149603",
                            "LastOperationHistorySeq": "424",
                            "LastServiceHistoryId": "2601301626030000266",
                            "LockType": 0,
                            "ModifiedBy": "System",
                            "ModifiedOn": "2026-01-30T16:29:18.687+00:00",
                            "ObjectLocked": false,
                            "UniversalState": 2
                        },
                        "ModifiedBy": "System",
                        "IsArray": false,
                        "ModifiedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsIndexed": false,
                        "ObjectLocked": false,
                        "IsRequired": false,
                        "UniversalState": 2,
                        "Order": 1,
                        "IsUserIdentifier": false
                    },
                    {
                        "$id": "108",
                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                        "DataType": 10,
                        "Attributes": {
                            "$typeCMF": "CMFMap",
                            "CMFMapData": []
                        },
                        "CreatedBy": "System",
                        "CreatedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsTemplate": false,
                        "Id": "2601301626030000684",
                        "Name": "Flow",
                        "LastOperationHistorySeq": "630",
                        "FriendlyName": "Flow",
                        "LastServiceHistoryId": "2601301626030000266",
                        "IoTSchema": {
                            "$ref": "5"
                        },
                        "LockType": 0,
                        "IndexOrder": 0,
                        "IoTSchemaReference": {
                            "$id": "109",
                            "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                            "IsShared": false,
                            "Attributes": {
                                "$typeCMF": "CMFMap",
                                "CMFMapData": []
                            },
                            "CreatedBy": "System",
                            "CreatedOn": "2026-01-30T16:29:18.7+00:00",
                            "SchemaProperties": [
                                {
                                    "$id": "110",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.703+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000576",
                                    "Name": "UID",
                                    "LastOperationHistorySeq": "435",
                                    "FriendlyName": "UID",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$id": "111",
                                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                                        "IsShared": false,
                                        "Attributes": {
                                            "$typeCMF": "CMFMap",
                                            "CMFMapData": []
                                        },
                                        "CreatedOn": "0001-01-01T00:00:00+00:00",
                                        "IsTemplate": false,
                                        "Id": "2601301626030000098",
                                        "LastOperationHistorySeq": "0",
                                        "LastServiceHistoryId": "0",
                                        "LockType": 0,
                                        "ModifiedOn": "0001-01-01T00:00:00+00:00",
                                        "ObjectLocked": false,
                                        "UniversalState": 0
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.703+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "112",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.703+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000577",
                                    "Name": "Name",
                                    "LastOperationHistorySeq": "435",
                                    "FriendlyName": "Name",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "111"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.703+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "113",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.703+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000578",
                                    "Name": "MajorRevision",
                                    "LastOperationHistorySeq": "435",
                                    "FriendlyName": "MajorRevision",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "111"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.703+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "114",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.703+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000579",
                                    "Name": "MinorRevision",
                                    "LastOperationHistorySeq": "435",
                                    "FriendlyName": "MinorRevision",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "111"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.703+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "115",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.703+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000580",
                                    "Name": "Type",
                                    "LastOperationHistorySeq": "435",
                                    "FriendlyName": "Type",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "111"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.703+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                }
                            ],
                            "IsTemplate": false,
                            "Id": "2601301626030000098",
                            "Name": "Flow_17581887359481219",
                            "LastOperationHistorySeq": "433",
                            "LastServiceHistoryId": "2601301626030000266",
                            "LockType": 0,
                            "ModifiedBy": "System",
                            "ModifiedOn": "2026-01-30T16:29:18.7+00:00",
                            "ObjectLocked": false,
                            "UniversalState": 2
                        },
                        "ModifiedBy": "System",
                        "IsArray": false,
                        "ModifiedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsIndexed": false,
                        "ObjectLocked": false,
                        "IsRequired": true,
                        "UniversalState": 2,
                        "Order": 1,
                        "IsUserIdentifier": false
                    },
                    {
                        "$id": "116",
                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                        "DataType": 10,
                        "Attributes": {
                            "$typeCMF": "CMFMap",
                            "CMFMapData": []
                        },
                        "CreatedBy": "System",
                        "CreatedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsTemplate": false,
                        "Id": "2601301626030000685",
                        "Name": "Step",
                        "LastOperationHistorySeq": "630",
                        "FriendlyName": "Step",
                        "LastServiceHistoryId": "2601301626030000266",
                        "IoTSchema": {
                            "$ref": "5"
                        },
                        "LockType": 0,
                        "IndexOrder": 0,
                        "IoTSchemaReference": {
                            "$id": "117",
                            "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                            "IsShared": false,
                            "Attributes": {
                                "$typeCMF": "CMFMap",
                                "CMFMapData": []
                            },
                            "CreatedBy": "System",
                            "CreatedOn": "2026-01-30T16:29:18.717+00:00",
                            "SchemaProperties": [
                                {
                                    "$id": "118",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.72+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000581",
                                    "Name": "UID",
                                    "LastOperationHistorySeq": "444",
                                    "FriendlyName": "UID",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$id": "119",
                                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                                        "IsShared": false,
                                        "Attributes": {
                                            "$typeCMF": "CMFMap",
                                            "CMFMapData": []
                                        },
                                        "CreatedOn": "0001-01-01T00:00:00+00:00",
                                        "IsTemplate": false,
                                        "Id": "2601301626030000099",
                                        "LastOperationHistorySeq": "0",
                                        "LastServiceHistoryId": "0",
                                        "LockType": 0,
                                        "ModifiedOn": "0001-01-01T00:00:00+00:00",
                                        "ObjectLocked": false,
                                        "UniversalState": 0
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.72+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "120",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.72+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000582",
                                    "Name": "Name",
                                    "LastOperationHistorySeq": "444",
                                    "FriendlyName": "Name",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "119"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 5,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.72+00:00",
                                    "IsIndexed": true,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "121",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 5,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.72+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000583",
                                    "Name": "DisplayOrder",
                                    "LastOperationHistorySeq": "444",
                                    "FriendlyName": "DisplayOrder",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "119"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.72+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "122",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.72+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000584",
                                    "Name": "Type",
                                    "LastOperationHistorySeq": "444",
                                    "FriendlyName": "Type",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "119"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.72+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                }
                            ],
                            "IsTemplate": false,
                            "Id": "2601301626030000099",
                            "Name": "Step_17581887371334410",
                            "LastOperationHistorySeq": "442",
                            "LastServiceHistoryId": "2601301626030000266",
                            "LockType": 0,
                            "ModifiedBy": "System",
                            "ModifiedOn": "2026-01-30T16:29:18.717+00:00",
                            "ObjectLocked": false,
                            "UniversalState": 2
                        },
                        "ModifiedBy": "System",
                        "IsArray": false,
                        "ModifiedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsIndexed": false,
                        "ObjectLocked": false,
                        "IsRequired": true,
                        "UniversalState": 2,
                        "Order": 1,
                        "IsUserIdentifier": false
                    },
                    {
                        "$id": "123",
                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                        "DataType": 10,
                        "Attributes": {
                            "$typeCMF": "CMFMap",
                            "CMFMapData": []
                        },
                        "CreatedBy": "System",
                        "CreatedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsTemplate": false,
                        "Id": "2601301626030000686",
                        "Name": "Product",
                        "LastOperationHistorySeq": "630",
                        "FriendlyName": "Product",
                        "LastServiceHistoryId": "2601301626030000266",
                        "IoTSchema": {
                            "$ref": "5"
                        },
                        "LockType": 0,
                        "IndexOrder": 0,
                        "IoTSchemaReference": {
                            "$id": "124",
                            "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                            "IsShared": false,
                            "Attributes": {
                                "$typeCMF": "CMFMap",
                                "CMFMapData": []
                            },
                            "CreatedBy": "System",
                            "CreatedOn": "2026-01-30T16:29:18.733+00:00",
                            "SchemaProperties": [
                                {
                                    "$id": "125",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.737+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000585",
                                    "Name": "UID",
                                    "LastOperationHistorySeq": "453",
                                    "FriendlyName": "UID",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$id": "126",
                                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                                        "IsShared": false,
                                        "Attributes": {
                                            "$typeCMF": "CMFMap",
                                            "CMFMapData": []
                                        },
                                        "CreatedOn": "0001-01-01T00:00:00+00:00",
                                        "IsTemplate": false,
                                        "Id": "2601301626030000100",
                                        "LastOperationHistorySeq": "0",
                                        "LastServiceHistoryId": "0",
                                        "LockType": 0,
                                        "ModifiedOn": "0001-01-01T00:00:00+00:00",
                                        "ObjectLocked": false,
                                        "UniversalState": 0
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.737+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "127",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.737+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000586",
                                    "Name": "Name",
                                    "LastOperationHistorySeq": "453",
                                    "FriendlyName": "Name",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "126"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.737+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "128",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.737+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000587",
                                    "Name": "MajorRevision",
                                    "LastOperationHistorySeq": "453",
                                    "FriendlyName": "MajorRevision",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "126"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.737+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "129",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.737+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000588",
                                    "Name": "MinorRevision",
                                    "LastOperationHistorySeq": "453",
                                    "FriendlyName": "MinorRevision",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "126"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.737+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "130",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.737+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000589",
                                    "Name": "Type",
                                    "LastOperationHistorySeq": "453",
                                    "FriendlyName": "Type",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "126"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.737+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "131",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.737+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000590",
                                    "Name": "Description",
                                    "LastOperationHistorySeq": "453",
                                    "FriendlyName": "Description",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "126"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.737+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                }
                            ],
                            "IsTemplate": false,
                            "Id": "2601301626030000100",
                            "Name": "Product_17581887382659513",
                            "LastOperationHistorySeq": "451",
                            "LastServiceHistoryId": "2601301626030000266",
                            "LockType": 0,
                            "ModifiedBy": "System",
                            "ModifiedOn": "2026-01-30T16:29:18.733+00:00",
                            "ObjectLocked": false,
                            "UniversalState": 2
                        },
                        "ModifiedBy": "System",
                        "IsArray": false,
                        "ModifiedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsIndexed": false,
                        "ObjectLocked": false,
                        "IsRequired": true,
                        "UniversalState": 2,
                        "Order": 1,
                        "IsUserIdentifier": false
                    },
                    {
                        "$id": "132",
                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                        "DataType": 10,
                        "Attributes": {
                            "$typeCMF": "CMFMap",
                            "CMFMapData": []
                        },
                        "CreatedBy": "System",
                        "CreatedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsTemplate": false,
                        "Id": "2601301626030000687",
                        "Name": "ProductGroup",
                        "LastOperationHistorySeq": "630",
                        "FriendlyName": "ProductGroup",
                        "LastServiceHistoryId": "2601301626030000266",
                        "IoTSchema": {
                            "$ref": "5"
                        },
                        "LockType": 0,
                        "IndexOrder": 0,
                        "IoTSchemaReference": {
                            "$id": "133",
                            "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                            "IsShared": false,
                            "Attributes": {
                                "$typeCMF": "CMFMap",
                                "CMFMapData": []
                            },
                            "CreatedBy": "System",
                            "CreatedOn": "2026-01-30T16:29:18.747+00:00",
                            "SchemaProperties": [
                                {
                                    "$id": "134",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.753+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000591",
                                    "Name": "UID",
                                    "LastOperationHistorySeq": "462",
                                    "FriendlyName": "UID",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$id": "135",
                                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                                        "IsShared": false,
                                        "Attributes": {
                                            "$typeCMF": "CMFMap",
                                            "CMFMapData": []
                                        },
                                        "CreatedOn": "0001-01-01T00:00:00+00:00",
                                        "IsTemplate": false,
                                        "Id": "2601301626030000101",
                                        "LastOperationHistorySeq": "0",
                                        "LastServiceHistoryId": "0",
                                        "LockType": 0,
                                        "ModifiedOn": "0001-01-01T00:00:00+00:00",
                                        "ObjectLocked": false,
                                        "UniversalState": 0
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.753+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "136",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.753+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000592",
                                    "Name": "Name",
                                    "LastOperationHistorySeq": "462",
                                    "FriendlyName": "Name",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "135"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.753+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "137",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.753+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000593",
                                    "Name": "MajorRevision",
                                    "LastOperationHistorySeq": "462",
                                    "FriendlyName": "MajorRevision",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "135"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.753+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "138",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.753+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000594",
                                    "Name": "MinorRevision",
                                    "LastOperationHistorySeq": "462",
                                    "FriendlyName": "MinorRevision",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "135"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.753+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "139",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.753+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000595",
                                    "Name": "Type",
                                    "LastOperationHistorySeq": "462",
                                    "FriendlyName": "Type",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "135"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.753+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                }
                            ],
                            "IsTemplate": false,
                            "Id": "2601301626030000101",
                            "Name": "ProductGroup_17581887404637490",
                            "LastOperationHistorySeq": "460",
                            "LastServiceHistoryId": "2601301626030000266",
                            "LockType": 0,
                            "ModifiedBy": "System",
                            "ModifiedOn": "2026-01-30T16:29:18.747+00:00",
                            "ObjectLocked": false,
                            "UniversalState": 2
                        },
                        "ModifiedBy": "System",
                        "IsArray": false,
                        "ModifiedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsIndexed": false,
                        "ObjectLocked": false,
                        "IsRequired": false,
                        "UniversalState": 2,
                        "Order": 1,
                        "IsUserIdentifier": false
                    },
                    {
                        "$id": "140",
                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                        "DataType": 10,
                        "Attributes": {
                            "$typeCMF": "CMFMap",
                            "CMFMapData": []
                        },
                        "CreatedBy": "System",
                        "CreatedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsTemplate": false,
                        "Id": "2601301626030000688",
                        "Name": "ProductionOrder",
                        "LastOperationHistorySeq": "630",
                        "FriendlyName": "ProductionOrder",
                        "LastServiceHistoryId": "2601301626030000266",
                        "IoTSchema": {
                            "$ref": "5"
                        },
                        "LockType": 0,
                        "IndexOrder": 0,
                        "IoTSchemaReference": {
                            "$id": "141",
                            "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                            "IsShared": false,
                            "Attributes": {
                                "$typeCMF": "CMFMap",
                                "CMFMapData": []
                            },
                            "CreatedBy": "System",
                            "CreatedOn": "2026-01-30T16:29:18.763+00:00",
                            "SchemaProperties": [
                                {
                                    "$id": "142",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.77+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000596",
                                    "Name": "UID",
                                    "LastOperationHistorySeq": "471",
                                    "FriendlyName": "UID",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$id": "143",
                                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                                        "IsShared": false,
                                        "Attributes": {
                                            "$typeCMF": "CMFMap",
                                            "CMFMapData": []
                                        },
                                        "CreatedOn": "0001-01-01T00:00:00+00:00",
                                        "IsTemplate": false,
                                        "Id": "2601301626030000102",
                                        "LastOperationHistorySeq": "0",
                                        "LastServiceHistoryId": "0",
                                        "LockType": 0,
                                        "ModifiedOn": "0001-01-01T00:00:00+00:00",
                                        "ObjectLocked": false,
                                        "UniversalState": 0
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.77+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "144",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.77+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000597",
                                    "Name": "Name",
                                    "LastOperationHistorySeq": "471",
                                    "FriendlyName": "Name",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "143"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.77+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "145",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 1,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.77+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000598",
                                    "Name": "Quantity",
                                    "LastOperationHistorySeq": "471",
                                    "FriendlyName": "Quantity",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "143"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.77+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "146",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.77+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000599",
                                    "Name": "Units",
                                    "LastOperationHistorySeq": "471",
                                    "FriendlyName": "Units",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "143"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.77+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "147",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 2,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.77+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000600",
                                    "Name": "DueDate",
                                    "LastOperationHistorySeq": "471",
                                    "FriendlyName": "DueDate",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "143"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.77+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "148",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 2,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.77+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000601",
                                    "Name": "PlannedStartDate",
                                    "LastOperationHistorySeq": "471",
                                    "FriendlyName": "PlannedStartDate",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "143"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.77+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "149",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 2,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.77+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000602",
                                    "Name": "PlannedEndDate",
                                    "LastOperationHistorySeq": "471",
                                    "FriendlyName": "PlannedEndDate",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "143"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.77+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "150",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.77+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000603",
                                    "Name": "OrderNumber",
                                    "LastOperationHistorySeq": "471",
                                    "FriendlyName": "OrderNumber",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "143"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.77+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                }
                            ],
                            "IsTemplate": false,
                            "Id": "2601301626030000102",
                            "Name": "ProductionOrder_17581887425102022",
                            "LastOperationHistorySeq": "469",
                            "LastServiceHistoryId": "2601301626030000266",
                            "LockType": 0,
                            "ModifiedBy": "System",
                            "ModifiedOn": "2026-01-30T16:29:18.763+00:00",
                            "ObjectLocked": false,
                            "UniversalState": 2
                        },
                        "ModifiedBy": "System",
                        "IsArray": false,
                        "ModifiedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsIndexed": false,
                        "ObjectLocked": false,
                        "IsRequired": false,
                        "UniversalState": 2,
                        "Order": 1,
                        "IsUserIdentifier": false
                    },
                    {
                        "$id": "151",
                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                        "DataType": 10,
                        "Attributes": {
                            "$typeCMF": "CMFMap",
                            "CMFMapData": []
                        },
                        "CreatedBy": "System",
                        "CreatedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsTemplate": false,
                        "Id": "2601301626030000689",
                        "Name": "Calendar",
                        "LastOperationHistorySeq": "630",
                        "FriendlyName": "Calendar",
                        "LastServiceHistoryId": "2601301626030000266",
                        "IoTSchema": {
                            "$ref": "5"
                        },
                        "LockType": 0,
                        "IndexOrder": 0,
                        "IoTSchemaReference": {
                            "$id": "152",
                            "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                            "IsShared": false,
                            "Attributes": {
                                "$typeCMF": "CMFMap",
                                "CMFMapData": []
                            },
                            "CreatedBy": "System",
                            "Schema": "{\"$schema\":\"http://json-schema.org/draft-04/schema#\",\"type\":\"object\",\"required\":[\"Calendar\",\"CD\",\"Timezone\",\"FY\",\"FQ\",\"FM\",\"FW\"],\"properties\":{\"Calendar\":{\"type\":\"string\"},\"CD\":{\"type\":\"string\"},\"Timezone\":{\"type\":\"string\"},\"TZToUTCInMin\":{\"type\":\"integer\"},\"FY\":{\"type\":\"integer\"},\"FQ\":{\"type\":\"integer\"},\"FM\":{\"type\":\"integer\"},\"FW\":{\"type\":\"integer\"},\"Shift\":{\"$ref\":\"#/definitions/Shift\"}},\"definitions\":{\"Shift\":{\"type\":\"object\",\"required\":[\"ShiftDefinitionName\",\"Name\",\"StartTime\",\"EndTime\"],\"properties\":{\"ShiftDefinitionName\":{\"type\":\"string\"},\"Name\":{\"type\":\"string\"},\"StartTime\":{\"type\":\"string\",\"format\":\"date-time\",\"pattern\":\"^(?<year>-?(?:[1-9][0-9]*)?[0-9]{4})-(?<month>1[0-2]|0[1-9])-(?<day>3[01]|0[1-9]|[12][0-9])T(?<hour>2[0-3]|[01][0-9]):(?<minute>[0-5][0-9]):(?<second>[0-5][0-9])(?<ms>\\\\.[0-9]+)?(?<timezone>Z|[+-](?:[0-9][0-9]):[0-9][0-9])$\"},\"EndTime\":{\"type\":\"string\",\"format\":\"date-time\",\"pattern\":\"^(?<year>-?(?:[1-9][0-9]*)?[0-9]{4})-(?<month>1[0-2]|0[1-9])-(?<day>3[01]|0[1-9]|[12][0-9])T(?<hour>2[0-3]|[01][0-9]):(?<minute>[0-5][0-9]):(?<second>[0-5][0-9])(?<ms>\\\\.[0-9]+)?(?<timezone>Z|[+-](?:[0-9][0-9]):[0-9][0-9])$\"}}}}}",
                            "CreatedOn": "2026-01-30T16:29:18.78+00:00",
                            "SchemaProperties": [
                                {
                                    "$id": "153",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.8+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000608",
                                    "Name": "Calendar",
                                    "LastOperationHistorySeq": "489",
                                    "FriendlyName": "Calendar",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$id": "154",
                                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                                        "IsShared": false,
                                        "Attributes": {
                                            "$typeCMF": "CMFMap",
                                            "CMFMapData": []
                                        },
                                        "CreatedOn": "0001-01-01T00:00:00+00:00",
                                        "IsTemplate": false,
                                        "Id": "2601301626030000103",
                                        "LastOperationHistorySeq": "0",
                                        "LastServiceHistoryId": "0",
                                        "LockType": 0,
                                        "ModifiedOn": "0001-01-01T00:00:00+00:00",
                                        "ObjectLocked": false,
                                        "UniversalState": 0
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.8+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "155",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.8+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000609",
                                    "Name": "CD",
                                    "LastOperationHistorySeq": "489",
                                    "FriendlyName": "CD",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "154"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.8+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "156",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.8+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000610",
                                    "Name": "Timezone",
                                    "LastOperationHistorySeq": "489",
                                    "FriendlyName": "Timezone",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "154"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.8+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "157",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 5,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.8+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000611",
                                    "Name": "TZToUTCInMin",
                                    "LastOperationHistorySeq": "489",
                                    "FriendlyName": "TZToUTCInMin",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "154"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.8+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "158",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 5,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.8+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000612",
                                    "Name": "FY",
                                    "LastOperationHistorySeq": "489",
                                    "FriendlyName": "FY",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "154"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.8+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "159",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 5,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.8+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000613",
                                    "Name": "FQ",
                                    "LastOperationHistorySeq": "489",
                                    "FriendlyName": "FQ",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "154"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.8+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "160",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 5,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.8+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000614",
                                    "Name": "FM",
                                    "LastOperationHistorySeq": "489",
                                    "FriendlyName": "FM",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "154"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.8+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "161",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 5,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.8+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000615",
                                    "Name": "FW",
                                    "LastOperationHistorySeq": "489",
                                    "FriendlyName": "FW",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "154"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.8+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "162",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 10,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.8+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000616",
                                    "Name": "Shift",
                                    "LastOperationHistorySeq": "489",
                                    "FriendlyName": "Shift",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "154"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "IoTSchemaReference": {
                                        "$id": "163",
                                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                                        "IsShared": false,
                                        "Attributes": {
                                            "$typeCMF": "CMFMap",
                                            "CMFMapData": []
                                        },
                                        "CreatedBy": "System",
                                        "CreatedOn": "2026-01-30T16:29:18.79+00:00",
                                        "SchemaProperties": [
                                            {
                                                "$id": "164",
                                                "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                                "DataType": 4,
                                                "Attributes": {
                                                    "$typeCMF": "CMFMap",
                                                    "CMFMapData": []
                                                },
                                                "CreatedBy": "System",
                                                "CreatedOn": "2026-01-30T16:29:18.793+00:00",
                                                "IsTemplate": false,
                                                "Id": "2601301626030000604",
                                                "Name": "ShiftDefinitionName",
                                                "LastOperationHistorySeq": "483",
                                                "FriendlyName": "ShiftDefinitionName",
                                                "LastServiceHistoryId": "2601301626030000266",
                                                "IoTSchema": {
                                                    "$id": "165",
                                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                                                    "IsShared": false,
                                                    "Attributes": {
                                                        "$typeCMF": "CMFMap",
                                                        "CMFMapData": []
                                                    },
                                                    "CreatedOn": "0001-01-01T00:00:00+00:00",
                                                    "IsTemplate": false,
                                                    "Id": "2601301626030000104",
                                                    "LastOperationHistorySeq": "0",
                                                    "LastServiceHistoryId": "0",
                                                    "LockType": 0,
                                                    "ModifiedOn": "0001-01-01T00:00:00+00:00",
                                                    "ObjectLocked": false,
                                                    "UniversalState": 0
                                                },
                                                "LockType": 0,
                                                "IndexOrder": 0,
                                                "ModifiedBy": "System",
                                                "IsArray": false,
                                                "ModifiedOn": "2026-01-30T16:29:18.793+00:00",
                                                "IsIndexed": false,
                                                "ObjectLocked": false,
                                                "IsRequired": true,
                                                "UniversalState": 2,
                                                "Order": 1,
                                                "IsUserIdentifier": false
                                            },
                                            {
                                                "$id": "166",
                                                "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                                "DataType": 4,
                                                "Attributes": {
                                                    "$typeCMF": "CMFMap",
                                                    "CMFMapData": []
                                                },
                                                "CreatedBy": "System",
                                                "CreatedOn": "2026-01-30T16:29:18.793+00:00",
                                                "IsTemplate": false,
                                                "Id": "2601301626030000605",
                                                "Name": "Name",
                                                "LastOperationHistorySeq": "483",
                                                "FriendlyName": "Name",
                                                "LastServiceHistoryId": "2601301626030000266",
                                                "IoTSchema": {
                                                    "$ref": "165"
                                                },
                                                "LockType": 0,
                                                "IndexOrder": 0,
                                                "ModifiedBy": "System",
                                                "IsArray": false,
                                                "ModifiedOn": "2026-01-30T16:29:18.793+00:00",
                                                "IsIndexed": false,
                                                "ObjectLocked": false,
                                                "IsRequired": true,
                                                "UniversalState": 2,
                                                "Order": 1,
                                                "IsUserIdentifier": false
                                            },
                                            {
                                                "$id": "167",
                                                "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                                "DataType": 2,
                                                "Attributes": {
                                                    "$typeCMF": "CMFMap",
                                                    "CMFMapData": []
                                                },
                                                "CreatedBy": "System",
                                                "CreatedOn": "2026-01-30T16:29:18.793+00:00",
                                                "IsTemplate": false,
                                                "Id": "2601301626030000606",
                                                "Name": "StartTime",
                                                "LastOperationHistorySeq": "483",
                                                "FriendlyName": "StartTime",
                                                "LastServiceHistoryId": "2601301626030000266",
                                                "IoTSchema": {
                                                    "$ref": "165"
                                                },
                                                "LockType": 0,
                                                "IndexOrder": 0,
                                                "ModifiedBy": "System",
                                                "IsArray": false,
                                                "ModifiedOn": "2026-01-30T16:29:18.793+00:00",
                                                "IsIndexed": false,
                                                "ObjectLocked": false,
                                                "IsRequired": true,
                                                "UniversalState": 2,
                                                "Order": 1,
                                                "IsUserIdentifier": false
                                            },
                                            {
                                                "$id": "168",
                                                "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                                "DataType": 2,
                                                "Attributes": {
                                                    "$typeCMF": "CMFMap",
                                                    "CMFMapData": []
                                                },
                                                "CreatedBy": "System",
                                                "CreatedOn": "2026-01-30T16:29:18.793+00:00",
                                                "IsTemplate": false,
                                                "Id": "2601301626030000607",
                                                "Name": "EndTime",
                                                "LastOperationHistorySeq": "483",
                                                "FriendlyName": "EndTime",
                                                "LastServiceHistoryId": "2601301626030000266",
                                                "IoTSchema": {
                                                    "$ref": "165"
                                                },
                                                "LockType": 0,
                                                "IndexOrder": 0,
                                                "ModifiedBy": "System",
                                                "IsArray": false,
                                                "ModifiedOn": "2026-01-30T16:29:18.793+00:00",
                                                "IsIndexed": false,
                                                "ObjectLocked": false,
                                                "IsRequired": true,
                                                "UniversalState": 2,
                                                "Order": 1,
                                                "IsUserIdentifier": false
                                            }
                                        ],
                                        "IsTemplate": false,
                                        "Id": "2601301626030000104",
                                        "Name": "Shift_17581887461131723",
                                        "LastOperationHistorySeq": "481",
                                        "LastServiceHistoryId": "2601301626030000266",
                                        "LockType": 0,
                                        "ModifiedBy": "System",
                                        "ModifiedOn": "2026-01-30T16:29:18.79+00:00",
                                        "ObjectLocked": false,
                                        "UniversalState": 2
                                    },
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.8+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                }
                            ],
                            "IsTemplate": false,
                            "Id": "2601301626030000103",
                            "Name": "Calendar_17581887450215571",
                            "LastOperationHistorySeq": "478",
                            "LastServiceHistoryId": "2601301626030000266",
                            "LockType": 0,
                            "ModifiedBy": "System",
                            "ModifiedOn": "2026-01-30T16:29:18.78+00:00",
                            "ObjectLocked": false,
                            "UniversalState": 2
                        },
                        "ModifiedBy": "System",
                        "IsArray": false,
                        "ModifiedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsIndexed": false,
                        "ObjectLocked": false,
                        "IsRequired": false,
                        "UniversalState": 2,
                        "Order": 1,
                        "IsUserIdentifier": false
                    },
                    {
                        "$id": "169",
                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                        "DataType": 10,
                        "Attributes": {
                            "$typeCMF": "CMFMap",
                            "CMFMapData": []
                        },
                        "CreatedBy": "System",
                        "CreatedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsTemplate": false,
                        "Id": "2601301626030000690",
                        "Name": "DataCollection",
                        "LastOperationHistorySeq": "630",
                        "FriendlyName": "DataCollection",
                        "LastServiceHistoryId": "2601301626030000266",
                        "IoTSchema": {
                            "$ref": "5"
                        },
                        "LockType": 0,
                        "IndexOrder": 0,
                        "IoTSchemaReference": {
                            "$id": "170",
                            "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                            "IsShared": false,
                            "Attributes": {
                                "$typeCMF": "CMFMap",
                                "CMFMapData": []
                            },
                            "CreatedBy": "System",
                            "CreatedOn": "2026-01-30T16:29:18.833+00:00",
                            "SchemaProperties": [
                                {
                                    "$id": "171",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.84+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000617",
                                    "Name": "UID",
                                    "LastOperationHistorySeq": "503",
                                    "FriendlyName": "UID",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$id": "172",
                                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                                        "IsShared": false,
                                        "Attributes": {
                                            "$typeCMF": "CMFMap",
                                            "CMFMapData": []
                                        },
                                        "CreatedOn": "0001-01-01T00:00:00+00:00",
                                        "IsTemplate": false,
                                        "Id": "2601301626030000105",
                                        "LastOperationHistorySeq": "0",
                                        "LastServiceHistoryId": "0",
                                        "LockType": 0,
                                        "ModifiedOn": "0001-01-01T00:00:00+00:00",
                                        "ObjectLocked": false,
                                        "UniversalState": 0
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.84+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "173",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.84+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000618",
                                    "Name": "Name",
                                    "LastOperationHistorySeq": "503",
                                    "FriendlyName": "Name",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "172"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.84+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "174",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.84+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000619",
                                    "Name": "MajorRevision",
                                    "LastOperationHistorySeq": "503",
                                    "FriendlyName": "MajorRevision",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "172"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.84+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "175",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.84+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000620",
                                    "Name": "MinorRevision",
                                    "LastOperationHistorySeq": "503",
                                    "FriendlyName": "MinorRevision",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "172"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.84+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                }
                            ],
                            "IsTemplate": false,
                            "Id": "2601301626030000105",
                            "Name": "DataCollection_17581887484514703",
                            "LastOperationHistorySeq": "501",
                            "LastServiceHistoryId": "2601301626030000266",
                            "LockType": 0,
                            "ModifiedBy": "System",
                            "ModifiedOn": "2026-01-30T16:29:18.833+00:00",
                            "ObjectLocked": false,
                            "UniversalState": 2
                        },
                        "ModifiedBy": "System",
                        "IsArray": false,
                        "ModifiedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsIndexed": false,
                        "ObjectLocked": false,
                        "IsRequired": false,
                        "UniversalState": 2,
                        "Order": 1,
                        "IsUserIdentifier": false
                    },
                    {
                        "$id": "176",
                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                        "DataType": 10,
                        "Attributes": {
                            "$typeCMF": "CMFMap",
                            "CMFMapData": []
                        },
                        "CreatedBy": "System",
                        "CreatedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsTemplate": false,
                        "Id": "2601301626030000691",
                        "Name": "BillOfMaterials",
                        "LastOperationHistorySeq": "630",
                        "FriendlyName": "BillOfMaterials",
                        "LastServiceHistoryId": "2601301626030000266",
                        "IoTSchema": {
                            "$ref": "5"
                        },
                        "LockType": 0,
                        "IndexOrder": 0,
                        "IoTSchemaReference": {
                            "$id": "177",
                            "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                            "IsShared": false,
                            "Attributes": {
                                "$typeCMF": "CMFMap",
                                "CMFMapData": []
                            },
                            "CreatedBy": "System",
                            "CreatedOn": "2026-01-30T16:29:18.85+00:00",
                            "SchemaProperties": [
                                {
                                    "$id": "178",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.853+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000621",
                                    "Name": "UID",
                                    "LastOperationHistorySeq": "512",
                                    "FriendlyName": "UID",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$id": "179",
                                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                                        "IsShared": false,
                                        "Attributes": {
                                            "$typeCMF": "CMFMap",
                                            "CMFMapData": []
                                        },
                                        "CreatedOn": "0001-01-01T00:00:00+00:00",
                                        "IsTemplate": false,
                                        "Id": "2601301626030000106",
                                        "LastOperationHistorySeq": "0",
                                        "LastServiceHistoryId": "0",
                                        "LockType": 0,
                                        "ModifiedOn": "0001-01-01T00:00:00+00:00",
                                        "ObjectLocked": false,
                                        "UniversalState": 0
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.853+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "180",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.853+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000622",
                                    "Name": "Name",
                                    "LastOperationHistorySeq": "512",
                                    "FriendlyName": "Name",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "179"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.853+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "181",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.853+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000623",
                                    "Name": "MajorRevision",
                                    "LastOperationHistorySeq": "512",
                                    "FriendlyName": "MajorRevision",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "179"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.853+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "182",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.853+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000624",
                                    "Name": "MinorRevision",
                                    "LastOperationHistorySeq": "512",
                                    "FriendlyName": "MinorRevision",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "179"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.853+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                }
                            ],
                            "IsTemplate": false,
                            "Id": "2601301626030000106",
                            "Name": "BillOfMaterials_17581887498615397",
                            "LastOperationHistorySeq": "510",
                            "LastServiceHistoryId": "2601301626030000266",
                            "LockType": 0,
                            "ModifiedBy": "System",
                            "ModifiedOn": "2026-01-30T16:29:18.85+00:00",
                            "ObjectLocked": false,
                            "UniversalState": 2
                        },
                        "ModifiedBy": "System",
                        "IsArray": false,
                        "ModifiedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsIndexed": false,
                        "ObjectLocked": false,
                        "IsRequired": false,
                        "UniversalState": 2,
                        "Order": 1,
                        "IsUserIdentifier": false
                    },
                    {
                        "$id": "183",
                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                        "DataType": 10,
                        "Attributes": {
                            "$typeCMF": "CMFMap",
                            "CMFMapData": []
                        },
                        "CreatedBy": "System",
                        "CreatedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsTemplate": false,
                        "Id": "2601301626030000692",
                        "Name": "BillOfTools",
                        "LastOperationHistorySeq": "630",
                        "FriendlyName": "BillOfTools",
                        "LastServiceHistoryId": "2601301626030000266",
                        "IoTSchema": {
                            "$ref": "5"
                        },
                        "LockType": 0,
                        "IndexOrder": 0,
                        "IoTSchemaReference": {
                            "$id": "184",
                            "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                            "IsShared": false,
                            "Attributes": {
                                "$typeCMF": "CMFMap",
                                "CMFMapData": []
                            },
                            "CreatedBy": "System",
                            "CreatedOn": "2026-01-30T16:29:18.863+00:00",
                            "SchemaProperties": [
                                {
                                    "$id": "185",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.87+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000625",
                                    "Name": "UID",
                                    "LastOperationHistorySeq": "521",
                                    "FriendlyName": "UID",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$id": "186",
                                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                                        "IsShared": false,
                                        "Attributes": {
                                            "$typeCMF": "CMFMap",
                                            "CMFMapData": []
                                        },
                                        "CreatedOn": "0001-01-01T00:00:00+00:00",
                                        "IsTemplate": false,
                                        "Id": "2601301626030000107",
                                        "LastOperationHistorySeq": "0",
                                        "LastServiceHistoryId": "0",
                                        "LockType": 0,
                                        "ModifiedOn": "0001-01-01T00:00:00+00:00",
                                        "ObjectLocked": false,
                                        "UniversalState": 0
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.87+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "187",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.87+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000626",
                                    "Name": "Name",
                                    "LastOperationHistorySeq": "521",
                                    "FriendlyName": "Name",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "186"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.87+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "188",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.87+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000627",
                                    "Name": "MajorRevision",
                                    "LastOperationHistorySeq": "521",
                                    "FriendlyName": "MajorRevision",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "186"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.87+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "189",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.87+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000628",
                                    "Name": "MinorRevision",
                                    "LastOperationHistorySeq": "521",
                                    "FriendlyName": "MinorRevision",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "186"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.87+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                }
                            ],
                            "IsTemplate": false,
                            "Id": "2601301626030000107",
                            "Name": "BillOfTools_17581887516029981",
                            "LastOperationHistorySeq": "519",
                            "LastServiceHistoryId": "2601301626030000266",
                            "LockType": 0,
                            "ModifiedBy": "System",
                            "ModifiedOn": "2026-01-30T16:29:18.863+00:00",
                            "ObjectLocked": false,
                            "UniversalState": 2
                        },
                        "ModifiedBy": "System",
                        "IsArray": false,
                        "ModifiedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsIndexed": false,
                        "ObjectLocked": false,
                        "IsRequired": false,
                        "UniversalState": 2,
                        "Order": 1,
                        "IsUserIdentifier": false
                    },
                    {
                        "$id": "190",
                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                        "DataType": 10,
                        "Attributes": {
                            "$typeCMF": "CMFMap",
                            "CMFMapData": []
                        },
                        "CreatedBy": "System",
                        "CreatedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsTemplate": false,
                        "Id": "2601301626030000693",
                        "Name": "Recipe",
                        "LastOperationHistorySeq": "630",
                        "FriendlyName": "Recipe",
                        "LastServiceHistoryId": "2601301626030000266",
                        "IoTSchema": {
                            "$ref": "5"
                        },
                        "LockType": 0,
                        "IndexOrder": 0,
                        "IoTSchemaReference": {
                            "$id": "191",
                            "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                            "IsShared": false,
                            "Attributes": {
                                "$typeCMF": "CMFMap",
                                "CMFMapData": []
                            },
                            "CreatedBy": "System",
                            "CreatedOn": "2026-01-30T16:29:18.88+00:00",
                            "SchemaProperties": [
                                {
                                    "$id": "192",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.883+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000629",
                                    "Name": "UID",
                                    "LastOperationHistorySeq": "530",
                                    "FriendlyName": "UID",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$id": "193",
                                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                                        "IsShared": false,
                                        "Attributes": {
                                            "$typeCMF": "CMFMap",
                                            "CMFMapData": []
                                        },
                                        "CreatedOn": "0001-01-01T00:00:00+00:00",
                                        "IsTemplate": false,
                                        "Id": "2601301626030000108",
                                        "LastOperationHistorySeq": "0",
                                        "LastServiceHistoryId": "0",
                                        "LockType": 0,
                                        "ModifiedOn": "0001-01-01T00:00:00+00:00",
                                        "ObjectLocked": false,
                                        "UniversalState": 0
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.883+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "194",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.883+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000630",
                                    "Name": "Name",
                                    "LastOperationHistorySeq": "530",
                                    "FriendlyName": "Name",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "193"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.883+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "195",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.883+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000631",
                                    "Name": "MajorRevision",
                                    "LastOperationHistorySeq": "530",
                                    "FriendlyName": "MajorRevision",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "193"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.883+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "196",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.883+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000632",
                                    "Name": "MinorRevision",
                                    "LastOperationHistorySeq": "530",
                                    "FriendlyName": "MinorRevision",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "193"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.883+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                }
                            ],
                            "IsTemplate": false,
                            "Id": "2601301626030000108",
                            "Name": "Recipe_17581887529102184",
                            "LastOperationHistorySeq": "528",
                            "LastServiceHistoryId": "2601301626030000266",
                            "LockType": 0,
                            "ModifiedBy": "System",
                            "ModifiedOn": "2026-01-30T16:29:18.88+00:00",
                            "ObjectLocked": false,
                            "UniversalState": 2
                        },
                        "ModifiedBy": "System",
                        "IsArray": false,
                        "ModifiedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsIndexed": false,
                        "ObjectLocked": false,
                        "IsRequired": false,
                        "UniversalState": 2,
                        "Order": 1,
                        "IsUserIdentifier": false
                    },
                    {
                        "$id": "197",
                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                        "DataType": 10,
                        "Attributes": {
                            "$typeCMF": "CMFMap",
                            "CMFMapData": []
                        },
                        "CreatedBy": "System",
                        "CreatedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsTemplate": false,
                        "Id": "2601301626030000694",
                        "Name": "Employee",
                        "LastOperationHistorySeq": "630",
                        "FriendlyName": "Employee",
                        "LastServiceHistoryId": "2601301626030000266",
                        "IoTSchema": {
                            "$ref": "5"
                        },
                        "LockType": 0,
                        "IndexOrder": 0,
                        "IoTSchemaReference": {
                            "$id": "198",
                            "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                            "IsShared": false,
                            "Attributes": {
                                "$typeCMF": "CMFMap",
                                "CMFMapData": []
                            },
                            "CreatedBy": "System",
                            "CreatedOn": "2026-01-30T16:29:18.897+00:00",
                            "SchemaProperties": [
                                {
                                    "$id": "199",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.903+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000633",
                                    "Name": "UID",
                                    "LastOperationHistorySeq": "539",
                                    "FriendlyName": "UID",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$id": "200",
                                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                                        "IsShared": false,
                                        "Attributes": {
                                            "$typeCMF": "CMFMap",
                                            "CMFMapData": []
                                        },
                                        "CreatedOn": "0001-01-01T00:00:00+00:00",
                                        "IsTemplate": false,
                                        "Id": "2601301626030000109",
                                        "LastOperationHistorySeq": "0",
                                        "LastServiceHistoryId": "0",
                                        "LockType": 0,
                                        "ModifiedOn": "0001-01-01T00:00:00+00:00",
                                        "ObjectLocked": false,
                                        "UniversalState": 0
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.903+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "201",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.903+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000634",
                                    "Name": "Name",
                                    "LastOperationHistorySeq": "539",
                                    "FriendlyName": "Name",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "200"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.903+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "202",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.903+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000635",
                                    "Name": "Number",
                                    "LastOperationHistorySeq": "539",
                                    "FriendlyName": "Number",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "200"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.903+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "203",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.903+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000636",
                                    "Name": "Team",
                                    "LastOperationHistorySeq": "539",
                                    "FriendlyName": "Team",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "200"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:18.903+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                }
                            ],
                            "IsTemplate": false,
                            "Id": "2601301626030000109",
                            "Name": "Employee_17581887540579205",
                            "LastOperationHistorySeq": "537",
                            "LastServiceHistoryId": "2601301626030000266",
                            "LockType": 0,
                            "ModifiedBy": "System",
                            "ModifiedOn": "2026-01-30T16:29:18.897+00:00",
                            "ObjectLocked": false,
                            "UniversalState": 2
                        },
                        "ModifiedBy": "System",
                        "IsArray": false,
                        "ModifiedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsIndexed": false,
                        "ObjectLocked": false,
                        "IsRequired": false,
                        "UniversalState": 2,
                        "Order": 1,
                        "IsUserIdentifier": false
                    },
                    {
                        "$id": "204",
                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                        "DataType": 10,
                        "Attributes": {
                            "$typeCMF": "CMFMap",
                            "CMFMapData": []
                        },
                        "CreatedBy": "System",
                        "CreatedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsTemplate": false,
                        "Id": "2601301626030000695",
                        "Name": "Attributes",
                        "LastOperationHistorySeq": "630",
                        "FriendlyName": "Attributes",
                        "LastServiceHistoryId": "2601301626030000266",
                        "IoTSchema": {
                            "$ref": "5"
                        },
                        "LockType": 0,
                        "IndexOrder": 0,
                        "IoTSchemaReference": {
                            "$id": "205",
                            "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                            "IsShared": false,
                            "Attributes": {
                                "$typeCMF": "CMFMap",
                                "CMFMapData": []
                            },
                            "CreatedBy": "System",
                            "CreatedOn": "2026-01-30T16:29:18.913+00:00",
                            "SchemaProperties": [
                                {
                                    "$id": "206",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.92+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000637",
                                    "Name": "Names",
                                    "LastOperationHistorySeq": "548",
                                    "FriendlyName": "Names",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$id": "207",
                                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                                        "IsShared": false,
                                        "Attributes": {
                                            "$typeCMF": "CMFMap",
                                            "CMFMapData": []
                                        },
                                        "CreatedOn": "0001-01-01T00:00:00+00:00",
                                        "IsTemplate": false,
                                        "Id": "2601301626030000110",
                                        "LastOperationHistorySeq": "0",
                                        "LastServiceHistoryId": "0",
                                        "LockType": 0,
                                        "ModifiedOn": "0001-01-01T00:00:00+00:00",
                                        "ObjectLocked": false,
                                        "UniversalState": 0
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": true,
                                    "ModifiedOn": "2026-01-30T16:29:18.92+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "208",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:18.92+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000638",
                                    "Name": "Values",
                                    "LastOperationHistorySeq": "548",
                                    "FriendlyName": "Values",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "207"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": true,
                                    "ModifiedOn": "2026-01-30T16:29:18.92+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                }
                            ],
                            "IsTemplate": false,
                            "Id": "2601301626030000110",
                            "Name": "Attributes_17581887553947635",
                            "LastOperationHistorySeq": "546",
                            "LastServiceHistoryId": "2601301626030000266",
                            "LockType": 0,
                            "ModifiedBy": "System",
                            "ModifiedOn": "2026-01-30T16:29:18.913+00:00",
                            "ObjectLocked": false,
                            "UniversalState": 2
                        },
                        "ModifiedBy": "System",
                        "IsArray": false,
                        "ModifiedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsIndexed": false,
                        "ObjectLocked": false,
                        "IsRequired": false,
                        "UniversalState": 2,
                        "Order": 1,
                        "IsUserIdentifier": false
                    },
                    {
                        "$id": "209",
                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                        "DataType": 4,
                        "Attributes": {
                            "$typeCMF": "CMFMap",
                            "CMFMapData": []
                        },
                        "CreatedBy": "System",
                        "CreatedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsTemplate": false,
                        "Id": "2601301626030000696",
                        "Name": "Comments",
                        "LastOperationHistorySeq": "630",
                        "FriendlyName": "Comments",
                        "LastServiceHistoryId": "2601301626030000266",
                        "IoTSchema": {
                            "$ref": "5"
                        },
                        "LockType": 0,
                        "IndexOrder": 0,
                        "ModifiedBy": "System",
                        "IsArray": false,
                        "ModifiedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsIndexed": false,
                        "ObjectLocked": false,
                        "IsRequired": false,
                        "UniversalState": 2,
                        "Order": 1,
                        "IsUserIdentifier": false
                    },
                    {
                        "$id": "210",
                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                        "DataType": 10,
                        "Attributes": {
                            "$typeCMF": "CMFMap",
                            "CMFMapData": []
                        },
                        "CreatedBy": "System",
                        "CreatedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsTemplate": false,
                        "Id": "2601301626030000697",
                        "Name": "Previous",
                        "LastOperationHistorySeq": "630",
                        "FriendlyName": "Previous",
                        "LastServiceHistoryId": "2601301626030000266",
                        "IoTSchema": {
                            "$ref": "5"
                        },
                        "LockType": 0,
                        "IndexOrder": 0,
                        "IoTSchemaReference": {
                            "$id": "211",
                            "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                            "IsShared": false,
                            "Attributes": {
                                "$typeCMF": "CMFMap",
                                "CMFMapData": []
                            },
                            "CreatedBy": "System",
                            "Schema": "{\"$schema\":\"http://json-schema.org/draft-04/schema#\",\"type\":\"object\",\"properties\":{\"Step\":{\"$ref\":\"#/definitions/Step\"},\"Material\":{\"$ref\":\"#/definitions/Material\"},\"Product\":{\"$ref\":\"#/definitions/Product\"},\"Flow\":{\"$ref\":\"#/definitions/Flow\"}},\"definitions\":{\"Step\":{\"type\":\"object\",\"required\":[\"UID\",\"Name\"],\"properties\":{\"UID\":{\"type\":\"string\"},\"Name\":{\"type\":\"string\"}}},\"Material\":{\"type\":\"object\",\"required\":[\"DateEnteredStep\",\"PrimaryQty\",\"PrimaryUnits\",\"FlowPath\",\"Form\"],\"properties\":{\"DateEnteredFacility\":{\"type\":\"string\",\"format\":\"date-time\",\"pattern\":\"^(?<year>-?(?:[1-9][0-9]*)?[0-9]{4})-(?<month>1[0-2]|0[1-9])-(?<day>3[01]|0[1-9]|[12][0-9])T(?<hour>2[0-3]|[01][0-9]):(?<minute>[0-5][0-9]):(?<second>[0-5][0-9])(?<ms>\\\\.[0-9]+)?(?<timezone>Z|[+-](?:[0-9][0-9]):[0-9][0-9])$\"},\"DateEnteredStep\":{\"type\":\"string\",\"format\":\"date-time\",\"pattern\":\"^(?<year>-?(?:[1-9][0-9]*)?[0-9]{4})-(?<month>1[0-2]|0[1-9])-(?<day>3[01]|0[1-9]|[12][0-9])T(?<hour>2[0-3]|[01][0-9]):(?<minute>[0-5][0-9]):(?<second>[0-5][0-9])(?<ms>\\\\.[0-9]+)?(?<timezone>Z|[+-](?:[0-9][0-9]):[0-9][0-9])$\"},\"PrimaryQty\":{\"type\":\"number\"},\"PrimaryUnits\":{\"type\":\"string\"},\"SecondaryQty\":{\"type\":\"number\"},\"SecondaryUnits\":{\"type\":\"string\"},\"SubMaterialsPrimaryQty\":{\"type\":\"number\"},\"SubMaterialsSecondaryQty\":{\"type\":\"number\"},\"SubMaterialCount\":{\"type\":\"integer\"},\"FlowPath\":{\"type\":\"string\"},\"Form\":{\"type\":\"string\"},\"ReworkCount\":{\"type\":\"integer\"},\"HoldCount\":{\"type\":\"integer\"}}},\"Product\":{\"type\":\"object\",\"required\":[\"UID\",\"Name\"],\"properties\":{\"UID\":{\"type\":\"string\"},\"Name\":{\"type\":\"string\"},\"MajorRevision\":{\"type\":\"string\"},\"MinorRevision\":{\"type\":\"string\"},\"Type\":{\"type\":\"string\"}}},\"Flow\":{\"type\":\"object\",\"required\":[\"UID\",\"Name\"],\"properties\":{\"UID\":{\"type\":\"string\"},\"Name\":{\"type\":\"string\"},\"MajorRevision\":{\"type\":\"string\"},\"MinorRevision\":{\"type\":\"string\"},\"Type\":{\"type\":\"string\"}}}}}",
                            "CreatedOn": "2026-01-30T16:29:18.93+00:00",
                            "SchemaProperties": [
                                {
                                    "$id": "212",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 10,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:19.013+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000666",
                                    "Name": "Step",
                                    "LastOperationHistorySeq": "602",
                                    "FriendlyName": "Step",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$id": "213",
                                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                                        "IsShared": false,
                                        "Attributes": {
                                            "$typeCMF": "CMFMap",
                                            "CMFMapData": []
                                        },
                                        "CreatedOn": "0001-01-01T00:00:00+00:00",
                                        "IsTemplate": false,
                                        "Id": "2601301626030000111",
                                        "LastOperationHistorySeq": "0",
                                        "LastServiceHistoryId": "0",
                                        "LockType": 0,
                                        "ModifiedOn": "0001-01-01T00:00:00+00:00",
                                        "ObjectLocked": false,
                                        "UniversalState": 0
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "IoTSchemaReference": {
                                        "$id": "214",
                                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                                        "IsShared": false,
                                        "Attributes": {
                                            "$typeCMF": "CMFMap",
                                            "CMFMapData": []
                                        },
                                        "CreatedBy": "System",
                                        "CreatedOn": "2026-01-30T16:29:18.94+00:00",
                                        "SchemaProperties": [
                                            {
                                                "$id": "215",
                                                "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                                "DataType": 4,
                                                "Attributes": {
                                                    "$typeCMF": "CMFMap",
                                                    "CMFMapData": []
                                                },
                                                "CreatedBy": "System",
                                                "CreatedOn": "2026-01-30T16:29:18.943+00:00",
                                                "IsTemplate": false,
                                                "Id": "2601301626030000639",
                                                "Name": "UID",
                                                "LastOperationHistorySeq": "560",
                                                "FriendlyName": "UID",
                                                "LastServiceHistoryId": "2601301626030000266",
                                                "IoTSchema": {
                                                    "$id": "216",
                                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                                                    "IsShared": false,
                                                    "Attributes": {
                                                        "$typeCMF": "CMFMap",
                                                        "CMFMapData": []
                                                    },
                                                    "CreatedOn": "0001-01-01T00:00:00+00:00",
                                                    "IsTemplate": false,
                                                    "Id": "2601301626030000112",
                                                    "LastOperationHistorySeq": "0",
                                                    "LastServiceHistoryId": "0",
                                                    "LockType": 0,
                                                    "ModifiedOn": "0001-01-01T00:00:00+00:00",
                                                    "ObjectLocked": false,
                                                    "UniversalState": 0
                                                },
                                                "LockType": 0,
                                                "IndexOrder": 0,
                                                "ModifiedBy": "System",
                                                "IsArray": false,
                                                "ModifiedOn": "2026-01-30T16:29:18.943+00:00",
                                                "IsIndexed": false,
                                                "ObjectLocked": false,
                                                "IsRequired": true,
                                                "UniversalState": 2,
                                                "Order": 1,
                                                "IsUserIdentifier": false
                                            },
                                            {
                                                "$id": "217",
                                                "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                                "DataType": 4,
                                                "Attributes": {
                                                    "$typeCMF": "CMFMap",
                                                    "CMFMapData": []
                                                },
                                                "CreatedBy": "System",
                                                "CreatedOn": "2026-01-30T16:29:18.943+00:00",
                                                "IsTemplate": false,
                                                "Id": "2601301626030000640",
                                                "Name": "Name",
                                                "LastOperationHistorySeq": "560",
                                                "FriendlyName": "Name",
                                                "LastServiceHistoryId": "2601301626030000266",
                                                "IoTSchema": {
                                                    "$ref": "216"
                                                },
                                                "LockType": 0,
                                                "IndexOrder": 0,
                                                "ModifiedBy": "System",
                                                "IsArray": false,
                                                "ModifiedOn": "2026-01-30T16:29:18.943+00:00",
                                                "IsIndexed": false,
                                                "ObjectLocked": false,
                                                "IsRequired": true,
                                                "UniversalState": 2,
                                                "Order": 1,
                                                "IsUserIdentifier": false
                                            }
                                        ],
                                        "IsTemplate": false,
                                        "Id": "2601301626030000112",
                                        "Name": "Step_17581887600252849",
                                        "LastOperationHistorySeq": "558",
                                        "LastServiceHistoryId": "2601301626030000266",
                                        "LockType": 0,
                                        "ModifiedBy": "System",
                                        "ModifiedOn": "2026-01-30T16:29:18.94+00:00",
                                        "ObjectLocked": false,
                                        "UniversalState": 2
                                    },
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:19.013+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "218",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 10,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:19.013+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000667",
                                    "Name": "Material",
                                    "LastOperationHistorySeq": "602",
                                    "FriendlyName": "Material",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "213"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "IoTSchemaReference": {
                                        "$id": "219",
                                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                                        "IsShared": false,
                                        "Attributes": {
                                            "$typeCMF": "CMFMap",
                                            "CMFMapData": []
                                        },
                                        "CreatedBy": "System",
                                        "CreatedOn": "2026-01-30T16:29:18.953+00:00",
                                        "SchemaProperties": [
                                            {
                                                "$id": "220",
                                                "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                                "DataType": 2,
                                                "Attributes": {
                                                    "$typeCMF": "CMFMap",
                                                    "CMFMapData": []
                                                },
                                                "CreatedBy": "System",
                                                "CreatedOn": "2026-01-30T16:29:18.957+00:00",
                                                "IsTemplate": false,
                                                "Id": "2601301626030000641",
                                                "Name": "DateEnteredFacility",
                                                "LastOperationHistorySeq": "569",
                                                "FriendlyName": "DateEnteredFacility",
                                                "LastServiceHistoryId": "2601301626030000266",
                                                "IoTSchema": {
                                                    "$id": "221",
                                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                                                    "IsShared": false,
                                                    "Attributes": {
                                                        "$typeCMF": "CMFMap",
                                                        "CMFMapData": []
                                                    },
                                                    "CreatedOn": "0001-01-01T00:00:00+00:00",
                                                    "IsTemplate": false,
                                                    "Id": "2601301626030000113",
                                                    "LastOperationHistorySeq": "0",
                                                    "LastServiceHistoryId": "0",
                                                    "LockType": 0,
                                                    "ModifiedOn": "0001-01-01T00:00:00+00:00",
                                                    "ObjectLocked": false,
                                                    "UniversalState": 0
                                                },
                                                "LockType": 0,
                                                "IndexOrder": 0,
                                                "ModifiedBy": "System",
                                                "IsArray": false,
                                                "ModifiedOn": "2026-01-30T16:29:18.957+00:00",
                                                "IsIndexed": false,
                                                "ObjectLocked": false,
                                                "IsRequired": false,
                                                "UniversalState": 2,
                                                "Order": 1,
                                                "IsUserIdentifier": false
                                            },
                                            {
                                                "$id": "222",
                                                "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                                "DataType": 2,
                                                "Attributes": {
                                                    "$typeCMF": "CMFMap",
                                                    "CMFMapData": []
                                                },
                                                "CreatedBy": "System",
                                                "CreatedOn": "2026-01-30T16:29:18.957+00:00",
                                                "IsTemplate": false,
                                                "Id": "2601301626030000642",
                                                "Name": "DateEnteredStep",
                                                "LastOperationHistorySeq": "569",
                                                "FriendlyName": "DateEnteredStep",
                                                "LastServiceHistoryId": "2601301626030000266",
                                                "IoTSchema": {
                                                    "$ref": "221"
                                                },
                                                "LockType": 0,
                                                "IndexOrder": 0,
                                                "ModifiedBy": "System",
                                                "IsArray": false,
                                                "ModifiedOn": "2026-01-30T16:29:18.957+00:00",
                                                "IsIndexed": false,
                                                "ObjectLocked": false,
                                                "IsRequired": true,
                                                "UniversalState": 2,
                                                "Order": 1,
                                                "IsUserIdentifier": false
                                            },
                                            {
                                                "$id": "223",
                                                "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                                "DataType": 1,
                                                "Attributes": {
                                                    "$typeCMF": "CMFMap",
                                                    "CMFMapData": []
                                                },
                                                "CreatedBy": "System",
                                                "CreatedOn": "2026-01-30T16:29:18.957+00:00",
                                                "IsTemplate": false,
                                                "Id": "2601301626030000643",
                                                "Name": "PrimaryQty",
                                                "LastOperationHistorySeq": "569",
                                                "FriendlyName": "PrimaryQty",
                                                "LastServiceHistoryId": "2601301626030000266",
                                                "IoTSchema": {
                                                    "$ref": "221"
                                                },
                                                "LockType": 0,
                                                "IndexOrder": 0,
                                                "ModifiedBy": "System",
                                                "IsArray": false,
                                                "ModifiedOn": "2026-01-30T16:29:18.957+00:00",
                                                "IsIndexed": false,
                                                "ObjectLocked": false,
                                                "IsRequired": true,
                                                "UniversalState": 2,
                                                "Order": 1,
                                                "IsUserIdentifier": false
                                            },
                                            {
                                                "$id": "224",
                                                "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                                "DataType": 4,
                                                "Attributes": {
                                                    "$typeCMF": "CMFMap",
                                                    "CMFMapData": []
                                                },
                                                "CreatedBy": "System",
                                                "CreatedOn": "2026-01-30T16:29:18.957+00:00",
                                                "IsTemplate": false,
                                                "Id": "2601301626030000644",
                                                "Name": "PrimaryUnits",
                                                "LastOperationHistorySeq": "569",
                                                "FriendlyName": "PrimaryUnits",
                                                "LastServiceHistoryId": "2601301626030000266",
                                                "IoTSchema": {
                                                    "$ref": "221"
                                                },
                                                "LockType": 0,
                                                "IndexOrder": 0,
                                                "ModifiedBy": "System",
                                                "IsArray": false,
                                                "ModifiedOn": "2026-01-30T16:29:18.957+00:00",
                                                "IsIndexed": false,
                                                "ObjectLocked": false,
                                                "IsRequired": true,
                                                "UniversalState": 2,
                                                "Order": 1,
                                                "IsUserIdentifier": false
                                            },
                                            {
                                                "$id": "225",
                                                "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                                "DataType": 1,
                                                "Attributes": {
                                                    "$typeCMF": "CMFMap",
                                                    "CMFMapData": []
                                                },
                                                "CreatedBy": "System",
                                                "CreatedOn": "2026-01-30T16:29:18.957+00:00",
                                                "IsTemplate": false,
                                                "Id": "2601301626030000645",
                                                "Name": "SecondaryQty",
                                                "LastOperationHistorySeq": "569",
                                                "FriendlyName": "SecondaryQty",
                                                "LastServiceHistoryId": "2601301626030000266",
                                                "IoTSchema": {
                                                    "$ref": "221"
                                                },
                                                "LockType": 0,
                                                "IndexOrder": 0,
                                                "ModifiedBy": "System",
                                                "IsArray": false,
                                                "ModifiedOn": "2026-01-30T16:29:18.957+00:00",
                                                "IsIndexed": false,
                                                "ObjectLocked": false,
                                                "IsRequired": false,
                                                "UniversalState": 2,
                                                "Order": 1,
                                                "IsUserIdentifier": false
                                            },
                                            {
                                                "$id": "226",
                                                "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                                "DataType": 4,
                                                "Attributes": {
                                                    "$typeCMF": "CMFMap",
                                                    "CMFMapData": []
                                                },
                                                "CreatedBy": "System",
                                                "CreatedOn": "2026-01-30T16:29:18.957+00:00",
                                                "IsTemplate": false,
                                                "Id": "2601301626030000646",
                                                "Name": "SecondaryUnits",
                                                "LastOperationHistorySeq": "569",
                                                "FriendlyName": "SecondaryUnits",
                                                "LastServiceHistoryId": "2601301626030000266",
                                                "IoTSchema": {
                                                    "$ref": "221"
                                                },
                                                "LockType": 0,
                                                "IndexOrder": 0,
                                                "ModifiedBy": "System",
                                                "IsArray": false,
                                                "ModifiedOn": "2026-01-30T16:29:18.957+00:00",
                                                "IsIndexed": false,
                                                "ObjectLocked": false,
                                                "IsRequired": false,
                                                "UniversalState": 2,
                                                "Order": 1,
                                                "IsUserIdentifier": false
                                            },
                                            {
                                                "$id": "227",
                                                "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                                "DataType": 1,
                                                "Attributes": {
                                                    "$typeCMF": "CMFMap",
                                                    "CMFMapData": []
                                                },
                                                "CreatedBy": "System",
                                                "CreatedOn": "2026-01-30T16:29:18.957+00:00",
                                                "IsTemplate": false,
                                                "Id": "2601301626030000647",
                                                "Name": "SubMaterialsPrimaryQty",
                                                "LastOperationHistorySeq": "569",
                                                "FriendlyName": "SubMaterialsPrimaryQty",
                                                "LastServiceHistoryId": "2601301626030000266",
                                                "IoTSchema": {
                                                    "$ref": "221"
                                                },
                                                "LockType": 0,
                                                "IndexOrder": 0,
                                                "ModifiedBy": "System",
                                                "IsArray": false,
                                                "ModifiedOn": "2026-01-30T16:29:18.957+00:00",
                                                "IsIndexed": false,
                                                "ObjectLocked": false,
                                                "IsRequired": false,
                                                "UniversalState": 2,
                                                "Order": 1,
                                                "IsUserIdentifier": false
                                            },
                                            {
                                                "$id": "228",
                                                "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                                "DataType": 1,
                                                "Attributes": {
                                                    "$typeCMF": "CMFMap",
                                                    "CMFMapData": []
                                                },
                                                "CreatedBy": "System",
                                                "CreatedOn": "2026-01-30T16:29:18.957+00:00",
                                                "IsTemplate": false,
                                                "Id": "2601301626030000648",
                                                "Name": "SubMaterialsSecondaryQty",
                                                "LastOperationHistorySeq": "569",
                                                "FriendlyName": "SubMaterialsSecondaryQty",
                                                "LastServiceHistoryId": "2601301626030000266",
                                                "IoTSchema": {
                                                    "$ref": "221"
                                                },
                                                "LockType": 0,
                                                "IndexOrder": 0,
                                                "ModifiedBy": "System",
                                                "IsArray": false,
                                                "ModifiedOn": "2026-01-30T16:29:18.957+00:00",
                                                "IsIndexed": false,
                                                "ObjectLocked": false,
                                                "IsRequired": false,
                                                "UniversalState": 2,
                                                "Order": 1,
                                                "IsUserIdentifier": false
                                            },
                                            {
                                                "$id": "229",
                                                "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                                "DataType": 5,
                                                "Attributes": {
                                                    "$typeCMF": "CMFMap",
                                                    "CMFMapData": []
                                                },
                                                "CreatedBy": "System",
                                                "CreatedOn": "2026-01-30T16:29:18.957+00:00",
                                                "IsTemplate": false,
                                                "Id": "2601301626030000649",
                                                "Name": "SubMaterialCount",
                                                "LastOperationHistorySeq": "569",
                                                "FriendlyName": "SubMaterialCount",
                                                "LastServiceHistoryId": "2601301626030000266",
                                                "IoTSchema": {
                                                    "$ref": "221"
                                                },
                                                "LockType": 0,
                                                "IndexOrder": 0,
                                                "ModifiedBy": "System",
                                                "IsArray": false,
                                                "ModifiedOn": "2026-01-30T16:29:18.957+00:00",
                                                "IsIndexed": false,
                                                "ObjectLocked": false,
                                                "IsRequired": false,
                                                "UniversalState": 2,
                                                "Order": 1,
                                                "IsUserIdentifier": false
                                            },
                                            {
                                                "$id": "230",
                                                "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                                "DataType": 4,
                                                "Attributes": {
                                                    "$typeCMF": "CMFMap",
                                                    "CMFMapData": []
                                                },
                                                "CreatedBy": "System",
                                                "CreatedOn": "2026-01-30T16:29:18.957+00:00",
                                                "IsTemplate": false,
                                                "Id": "2601301626030000650",
                                                "Name": "FlowPath",
                                                "LastOperationHistorySeq": "569",
                                                "FriendlyName": "FlowPath",
                                                "LastServiceHistoryId": "2601301626030000266",
                                                "IoTSchema": {
                                                    "$ref": "221"
                                                },
                                                "LockType": 0,
                                                "IndexOrder": 0,
                                                "ModifiedBy": "System",
                                                "IsArray": false,
                                                "ModifiedOn": "2026-01-30T16:29:18.957+00:00",
                                                "IsIndexed": false,
                                                "ObjectLocked": false,
                                                "IsRequired": true,
                                                "UniversalState": 2,
                                                "Order": 1,
                                                "IsUserIdentifier": false
                                            },
                                            {
                                                "$id": "231",
                                                "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                                "DataType": 4,
                                                "Attributes": {
                                                    "$typeCMF": "CMFMap",
                                                    "CMFMapData": []
                                                },
                                                "CreatedBy": "System",
                                                "CreatedOn": "2026-01-30T16:29:18.957+00:00",
                                                "IsTemplate": false,
                                                "Id": "2601301626030000651",
                                                "Name": "Form",
                                                "LastOperationHistorySeq": "569",
                                                "FriendlyName": "Form",
                                                "LastServiceHistoryId": "2601301626030000266",
                                                "IoTSchema": {
                                                    "$ref": "221"
                                                },
                                                "LockType": 0,
                                                "IndexOrder": 0,
                                                "ModifiedBy": "System",
                                                "IsArray": false,
                                                "ModifiedOn": "2026-01-30T16:29:18.957+00:00",
                                                "IsIndexed": false,
                                                "ObjectLocked": false,
                                                "IsRequired": true,
                                                "UniversalState": 2,
                                                "Order": 1,
                                                "IsUserIdentifier": false
                                            },
                                            {
                                                "$id": "232",
                                                "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                                "DataType": 5,
                                                "Attributes": {
                                                    "$typeCMF": "CMFMap",
                                                    "CMFMapData": []
                                                },
                                                "CreatedBy": "System",
                                                "CreatedOn": "2026-01-30T16:29:18.957+00:00",
                                                "IsTemplate": false,
                                                "Id": "2601301626030000652",
                                                "Name": "ReworkCount",
                                                "LastOperationHistorySeq": "569",
                                                "FriendlyName": "ReworkCount",
                                                "LastServiceHistoryId": "2601301626030000266",
                                                "IoTSchema": {
                                                    "$ref": "221"
                                                },
                                                "LockType": 0,
                                                "IndexOrder": 0,
                                                "ModifiedBy": "System",
                                                "IsArray": false,
                                                "ModifiedOn": "2026-01-30T16:29:18.957+00:00",
                                                "IsIndexed": false,
                                                "ObjectLocked": false,
                                                "IsRequired": false,
                                                "UniversalState": 2,
                                                "Order": 1,
                                                "IsUserIdentifier": false
                                            },
                                            {
                                                "$id": "233",
                                                "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                                "DataType": 5,
                                                "Attributes": {
                                                    "$typeCMF": "CMFMap",
                                                    "CMFMapData": []
                                                },
                                                "CreatedBy": "System",
                                                "CreatedOn": "2026-01-30T16:29:18.957+00:00",
                                                "IsTemplate": false,
                                                "Id": "2601301626030000653",
                                                "Name": "HoldCount",
                                                "LastOperationHistorySeq": "569",
                                                "FriendlyName": "HoldCount",
                                                "LastServiceHistoryId": "2601301626030000266",
                                                "IoTSchema": {
                                                    "$ref": "221"
                                                },
                                                "LockType": 0,
                                                "IndexOrder": 0,
                                                "ModifiedBy": "System",
                                                "IsArray": false,
                                                "ModifiedOn": "2026-01-30T16:29:18.957+00:00",
                                                "IsIndexed": false,
                                                "ObjectLocked": false,
                                                "IsRequired": false,
                                                "UniversalState": 2,
                                                "Order": 1,
                                                "IsUserIdentifier": false
                                            }
                                        ],
                                        "IsTemplate": false,
                                        "Id": "2601301626030000113",
                                        "Name": "Material_17581887603445158",
                                        "LastOperationHistorySeq": "567",
                                        "LastServiceHistoryId": "2601301626030000266",
                                        "LockType": 0,
                                        "ModifiedBy": "System",
                                        "ModifiedOn": "2026-01-30T16:29:18.953+00:00",
                                        "ObjectLocked": false,
                                        "UniversalState": 2
                                    },
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:19.013+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "234",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 10,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:19.013+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000668",
                                    "Name": "Product",
                                    "LastOperationHistorySeq": "602",
                                    "FriendlyName": "Product",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "213"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "IoTSchemaReference": {
                                        "$id": "235",
                                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                                        "IsShared": false,
                                        "Attributes": {
                                            "$typeCMF": "CMFMap",
                                            "CMFMapData": []
                                        },
                                        "CreatedBy": "System",
                                        "CreatedOn": "2026-01-30T16:29:18.97+00:00",
                                        "SchemaProperties": [
                                            {
                                                "$id": "236",
                                                "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                                "DataType": 4,
                                                "Attributes": {
                                                    "$typeCMF": "CMFMap",
                                                    "CMFMapData": []
                                                },
                                                "CreatedBy": "System",
                                                "CreatedOn": "2026-01-30T16:29:18.973+00:00",
                                                "IsTemplate": false,
                                                "Id": "2601301626030000654",
                                                "Name": "UID",
                                                "LastOperationHistorySeq": "578",
                                                "FriendlyName": "UID",
                                                "LastServiceHistoryId": "2601301626030000266",
                                                "IoTSchema": {
                                                    "$id": "237",
                                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                                                    "IsShared": false,
                                                    "Attributes": {
                                                        "$typeCMF": "CMFMap",
                                                        "CMFMapData": []
                                                    },
                                                    "CreatedOn": "0001-01-01T00:00:00+00:00",
                                                    "IsTemplate": false,
                                                    "Id": "2601301626030000114",
                                                    "LastOperationHistorySeq": "0",
                                                    "LastServiceHistoryId": "0",
                                                    "LockType": 0,
                                                    "ModifiedOn": "0001-01-01T00:00:00+00:00",
                                                    "ObjectLocked": false,
                                                    "UniversalState": 0
                                                },
                                                "LockType": 0,
                                                "IndexOrder": 0,
                                                "ModifiedBy": "System",
                                                "IsArray": false,
                                                "ModifiedOn": "2026-01-30T16:29:18.973+00:00",
                                                "IsIndexed": false,
                                                "ObjectLocked": false,
                                                "IsRequired": true,
                                                "UniversalState": 2,
                                                "Order": 1,
                                                "IsUserIdentifier": false
                                            },
                                            {
                                                "$id": "238",
                                                "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                                "DataType": 4,
                                                "Attributes": {
                                                    "$typeCMF": "CMFMap",
                                                    "CMFMapData": []
                                                },
                                                "CreatedBy": "System",
                                                "CreatedOn": "2026-01-30T16:29:18.973+00:00",
                                                "IsTemplate": false,
                                                "Id": "2601301626030000655",
                                                "Name": "Name",
                                                "LastOperationHistorySeq": "578",
                                                "FriendlyName": "Name",
                                                "LastServiceHistoryId": "2601301626030000266",
                                                "IoTSchema": {
                                                    "$ref": "237"
                                                },
                                                "LockType": 0,
                                                "IndexOrder": 0,
                                                "ModifiedBy": "System",
                                                "IsArray": false,
                                                "ModifiedOn": "2026-01-30T16:29:18.973+00:00",
                                                "IsIndexed": false,
                                                "ObjectLocked": false,
                                                "IsRequired": true,
                                                "UniversalState": 2,
                                                "Order": 1,
                                                "IsUserIdentifier": false
                                            },
                                            {
                                                "$id": "239",
                                                "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                                "DataType": 4,
                                                "Attributes": {
                                                    "$typeCMF": "CMFMap",
                                                    "CMFMapData": []
                                                },
                                                "CreatedBy": "System",
                                                "CreatedOn": "2026-01-30T16:29:18.973+00:00",
                                                "IsTemplate": false,
                                                "Id": "2601301626030000656",
                                                "Name": "MajorRevision",
                                                "LastOperationHistorySeq": "578",
                                                "FriendlyName": "MajorRevision",
                                                "LastServiceHistoryId": "2601301626030000266",
                                                "IoTSchema": {
                                                    "$ref": "237"
                                                },
                                                "LockType": 0,
                                                "IndexOrder": 0,
                                                "ModifiedBy": "System",
                                                "IsArray": false,
                                                "ModifiedOn": "2026-01-30T16:29:18.973+00:00",
                                                "IsIndexed": false,
                                                "ObjectLocked": false,
                                                "IsRequired": false,
                                                "UniversalState": 2,
                                                "Order": 1,
                                                "IsUserIdentifier": false
                                            },
                                            {
                                                "$id": "240",
                                                "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                                "DataType": 4,
                                                "Attributes": {
                                                    "$typeCMF": "CMFMap",
                                                    "CMFMapData": []
                                                },
                                                "CreatedBy": "System",
                                                "CreatedOn": "2026-01-30T16:29:18.973+00:00",
                                                "IsTemplate": false,
                                                "Id": "2601301626030000657",
                                                "Name": "MinorRevision",
                                                "LastOperationHistorySeq": "578",
                                                "FriendlyName": "MinorRevision",
                                                "LastServiceHistoryId": "2601301626030000266",
                                                "IoTSchema": {
                                                    "$ref": "237"
                                                },
                                                "LockType": 0,
                                                "IndexOrder": 0,
                                                "ModifiedBy": "System",
                                                "IsArray": false,
                                                "ModifiedOn": "2026-01-30T16:29:18.973+00:00",
                                                "IsIndexed": false,
                                                "ObjectLocked": false,
                                                "IsRequired": false,
                                                "UniversalState": 2,
                                                "Order": 1,
                                                "IsUserIdentifier": false
                                            },
                                            {
                                                "$id": "241",
                                                "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                                "DataType": 4,
                                                "Attributes": {
                                                    "$typeCMF": "CMFMap",
                                                    "CMFMapData": []
                                                },
                                                "CreatedBy": "System",
                                                "CreatedOn": "2026-01-30T16:29:18.973+00:00",
                                                "IsTemplate": false,
                                                "Id": "2601301626030000658",
                                                "Name": "Type",
                                                "LastOperationHistorySeq": "578",
                                                "FriendlyName": "Type",
                                                "LastServiceHistoryId": "2601301626030000266",
                                                "IoTSchema": {
                                                    "$ref": "237"
                                                },
                                                "LockType": 0,
                                                "IndexOrder": 0,
                                                "ModifiedBy": "System",
                                                "IsArray": false,
                                                "ModifiedOn": "2026-01-30T16:29:18.973+00:00",
                                                "IsIndexed": false,
                                                "ObjectLocked": false,
                                                "IsRequired": false,
                                                "UniversalState": 2,
                                                "Order": 1,
                                                "IsUserIdentifier": false
                                            }
                                        ],
                                        "IsTemplate": false,
                                        "Id": "2601301626030000114",
                                        "Name": "Product_17581887615734471",
                                        "LastOperationHistorySeq": "576",
                                        "LastServiceHistoryId": "2601301626030000266",
                                        "LockType": 0,
                                        "ModifiedBy": "System",
                                        "ModifiedOn": "2026-01-30T16:29:18.97+00:00",
                                        "ObjectLocked": false,
                                        "UniversalState": 2
                                    },
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:19.013+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "242",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 10,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:19.013+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000669",
                                    "Name": "Flow",
                                    "LastOperationHistorySeq": "602",
                                    "FriendlyName": "Flow",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "213"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "IoTSchemaReference": {
                                        "$id": "243",
                                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                                        "IsShared": false,
                                        "Attributes": {
                                            "$typeCMF": "CMFMap",
                                            "CMFMapData": []
                                        },
                                        "CreatedBy": "System",
                                        "CreatedOn": "2026-01-30T16:29:18.987+00:00",
                                        "SchemaProperties": [
                                            {
                                                "$id": "244",
                                                "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                                "DataType": 4,
                                                "Attributes": {
                                                    "$typeCMF": "CMFMap",
                                                    "CMFMapData": []
                                                },
                                                "CreatedBy": "System",
                                                "CreatedOn": "2026-01-30T16:29:18.99+00:00",
                                                "IsTemplate": false,
                                                "Id": "2601301626030000659",
                                                "Name": "UID",
                                                "LastOperationHistorySeq": "587",
                                                "FriendlyName": "UID",
                                                "LastServiceHistoryId": "2601301626030000266",
                                                "IoTSchema": {
                                                    "$id": "245",
                                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                                                    "IsShared": false,
                                                    "Attributes": {
                                                        "$typeCMF": "CMFMap",
                                                        "CMFMapData": []
                                                    },
                                                    "CreatedOn": "0001-01-01T00:00:00+00:00",
                                                    "IsTemplate": false,
                                                    "Id": "2601301626030000115",
                                                    "LastOperationHistorySeq": "0",
                                                    "LastServiceHistoryId": "0",
                                                    "LockType": 0,
                                                    "ModifiedOn": "0001-01-01T00:00:00+00:00",
                                                    "ObjectLocked": false,
                                                    "UniversalState": 0
                                                },
                                                "LockType": 0,
                                                "IndexOrder": 0,
                                                "ModifiedBy": "System",
                                                "IsArray": false,
                                                "ModifiedOn": "2026-01-30T16:29:18.99+00:00",
                                                "IsIndexed": false,
                                                "ObjectLocked": false,
                                                "IsRequired": true,
                                                "UniversalState": 2,
                                                "Order": 1,
                                                "IsUserIdentifier": false
                                            },
                                            {
                                                "$id": "246",
                                                "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                                "DataType": 4,
                                                "Attributes": {
                                                    "$typeCMF": "CMFMap",
                                                    "CMFMapData": []
                                                },
                                                "CreatedBy": "System",
                                                "CreatedOn": "2026-01-30T16:29:18.99+00:00",
                                                "IsTemplate": false,
                                                "Id": "2601301626030000660",
                                                "Name": "Name",
                                                "LastOperationHistorySeq": "587",
                                                "FriendlyName": "Name",
                                                "LastServiceHistoryId": "2601301626030000266",
                                                "IoTSchema": {
                                                    "$ref": "245"
                                                },
                                                "LockType": 0,
                                                "IndexOrder": 0,
                                                "ModifiedBy": "System",
                                                "IsArray": false,
                                                "ModifiedOn": "2026-01-30T16:29:18.99+00:00",
                                                "IsIndexed": false,
                                                "ObjectLocked": false,
                                                "IsRequired": true,
                                                "UniversalState": 2,
                                                "Order": 1,
                                                "IsUserIdentifier": false
                                            },
                                            {
                                                "$id": "247",
                                                "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                                "DataType": 4,
                                                "Attributes": {
                                                    "$typeCMF": "CMFMap",
                                                    "CMFMapData": []
                                                },
                                                "CreatedBy": "System",
                                                "CreatedOn": "2026-01-30T16:29:18.99+00:00",
                                                "IsTemplate": false,
                                                "Id": "2601301626030000661",
                                                "Name": "MajorRevision",
                                                "LastOperationHistorySeq": "587",
                                                "FriendlyName": "MajorRevision",
                                                "LastServiceHistoryId": "2601301626030000266",
                                                "IoTSchema": {
                                                    "$ref": "245"
                                                },
                                                "LockType": 0,
                                                "IndexOrder": 0,
                                                "ModifiedBy": "System",
                                                "IsArray": false,
                                                "ModifiedOn": "2026-01-30T16:29:18.99+00:00",
                                                "IsIndexed": false,
                                                "ObjectLocked": false,
                                                "IsRequired": false,
                                                "UniversalState": 2,
                                                "Order": 1,
                                                "IsUserIdentifier": false
                                            },
                                            {
                                                "$id": "248",
                                                "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                                "DataType": 4,
                                                "Attributes": {
                                                    "$typeCMF": "CMFMap",
                                                    "CMFMapData": []
                                                },
                                                "CreatedBy": "System",
                                                "CreatedOn": "2026-01-30T16:29:18.99+00:00",
                                                "IsTemplate": false,
                                                "Id": "2601301626030000662",
                                                "Name": "MinorRevision",
                                                "LastOperationHistorySeq": "587",
                                                "FriendlyName": "MinorRevision",
                                                "LastServiceHistoryId": "2601301626030000266",
                                                "IoTSchema": {
                                                    "$ref": "245"
                                                },
                                                "LockType": 0,
                                                "IndexOrder": 0,
                                                "ModifiedBy": "System",
                                                "IsArray": false,
                                                "ModifiedOn": "2026-01-30T16:29:18.99+00:00",
                                                "IsIndexed": false,
                                                "ObjectLocked": false,
                                                "IsRequired": false,
                                                "UniversalState": 2,
                                                "Order": 1,
                                                "IsUserIdentifier": false
                                            },
                                            {
                                                "$id": "249",
                                                "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                                "DataType": 4,
                                                "Attributes": {
                                                    "$typeCMF": "CMFMap",
                                                    "CMFMapData": []
                                                },
                                                "CreatedBy": "System",
                                                "CreatedOn": "2026-01-30T16:29:18.99+00:00",
                                                "IsTemplate": false,
                                                "Id": "2601301626030000663",
                                                "Name": "Type",
                                                "LastOperationHistorySeq": "587",
                                                "FriendlyName": "Type",
                                                "LastServiceHistoryId": "2601301626030000266",
                                                "IoTSchema": {
                                                    "$ref": "245"
                                                },
                                                "LockType": 0,
                                                "IndexOrder": 0,
                                                "ModifiedBy": "System",
                                                "IsArray": false,
                                                "ModifiedOn": "2026-01-30T16:29:18.99+00:00",
                                                "IsIndexed": false,
                                                "ObjectLocked": false,
                                                "IsRequired": false,
                                                "UniversalState": 2,
                                                "Order": 1,
                                                "IsUserIdentifier": false
                                            }
                                        ],
                                        "IsTemplate": false,
                                        "Id": "2601301626030000115",
                                        "Name": "Flow_17581887622302088",
                                        "LastOperationHistorySeq": "585",
                                        "LastServiceHistoryId": "2601301626030000266",
                                        "LockType": 0,
                                        "ModifiedBy": "System",
                                        "ModifiedOn": "2026-01-30T16:29:18.987+00:00",
                                        "ObjectLocked": false,
                                        "UniversalState": 2
                                    },
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:19.013+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "250",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 10,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:19.013+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000670",
                                    "Name": "Area",
                                    "LastOperationHistorySeq": "602",
                                    "FriendlyName": "Area",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "213"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "IoTSchemaReference": {
                                        "$id": "251",
                                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                                        "IsShared": false,
                                        "Attributes": {
                                            "$typeCMF": "CMFMap",
                                            "CMFMapData": []
                                        },
                                        "CreatedBy": "System",
                                        "CreatedOn": "2026-01-30T16:29:19+00:00",
                                        "SchemaProperties": [
                                            {
                                                "$id": "252",
                                                "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                                "DataType": 4,
                                                "Attributes": {
                                                    "$typeCMF": "CMFMap",
                                                    "CMFMapData": []
                                                },
                                                "CreatedBy": "System",
                                                "CreatedOn": "2026-01-30T16:29:19.007+00:00",
                                                "IsTemplate": false,
                                                "Id": "2601301626030000664",
                                                "Name": "UID",
                                                "LastOperationHistorySeq": "596",
                                                "FriendlyName": "UID",
                                                "LastServiceHistoryId": "2601301626030000266",
                                                "IoTSchema": {
                                                    "$id": "253",
                                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                                                    "IsShared": false,
                                                    "Attributes": {
                                                        "$typeCMF": "CMFMap",
                                                        "CMFMapData": []
                                                    },
                                                    "CreatedOn": "0001-01-01T00:00:00+00:00",
                                                    "IsTemplate": false,
                                                    "Id": "2601301626030000116",
                                                    "LastOperationHistorySeq": "0",
                                                    "LastServiceHistoryId": "0",
                                                    "LockType": 0,
                                                    "ModifiedOn": "0001-01-01T00:00:00+00:00",
                                                    "ObjectLocked": false,
                                                    "UniversalState": 0
                                                },
                                                "LockType": 0,
                                                "IndexOrder": 0,
                                                "ModifiedBy": "System",
                                                "IsArray": false,
                                                "ModifiedOn": "2026-01-30T16:29:19.007+00:00",
                                                "IsIndexed": false,
                                                "ObjectLocked": false,
                                                "IsRequired": true,
                                                "UniversalState": 2,
                                                "Order": 1,
                                                "IsUserIdentifier": false
                                            },
                                            {
                                                "$id": "254",
                                                "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                                "DataType": 4,
                                                "Attributes": {
                                                    "$typeCMF": "CMFMap",
                                                    "CMFMapData": []
                                                },
                                                "CreatedBy": "System",
                                                "CreatedOn": "2026-01-30T16:29:19.007+00:00",
                                                "IsTemplate": false,
                                                "Id": "2601301626030000665",
                                                "Name": "Name",
                                                "LastOperationHistorySeq": "596",
                                                "FriendlyName": "Name",
                                                "LastServiceHistoryId": "2601301626030000266",
                                                "IoTSchema": {
                                                    "$ref": "253"
                                                },
                                                "LockType": 0,
                                                "IndexOrder": 0,
                                                "ModifiedBy": "System",
                                                "IsArray": false,
                                                "ModifiedOn": "2026-01-30T16:29:19.007+00:00",
                                                "IsIndexed": false,
                                                "ObjectLocked": false,
                                                "IsRequired": true,
                                                "UniversalState": 2,
                                                "Order": 1,
                                                "IsUserIdentifier": false
                                            }
                                        ],
                                        "IsTemplate": false,
                                        "Id": "2601301626030000116",
                                        "Name": "Area_17581887627455126",
                                        "LastOperationHistorySeq": "594",
                                        "LastServiceHistoryId": "2601301626030000266",
                                        "LockType": 0,
                                        "ModifiedBy": "System",
                                        "ModifiedOn": "2026-01-30T16:29:19+00:00",
                                        "ObjectLocked": false,
                                        "UniversalState": 2
                                    },
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:19.013+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                }
                            ],
                            "IsTemplate": false,
                            "Id": "2601301626030000111",
                            "Name": "Previous_17581887598732097",
                            "LastOperationHistorySeq": "555",
                            "LastServiceHistoryId": "2601301626030000266",
                            "LockType": 0,
                            "ModifiedBy": "System",
                            "ModifiedOn": "2026-01-30T16:29:18.93+00:00",
                            "ObjectLocked": false,
                            "UniversalState": 2
                        },
                        "ModifiedBy": "System",
                        "IsArray": false,
                        "ModifiedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsIndexed": false,
                        "ObjectLocked": false,
                        "IsRequired": false,
                        "UniversalState": 2,
                        "Order": 1,
                        "IsUserIdentifier": false
                    },
                    {
                        "$id": "255",
                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                        "DataType": 10,
                        "Attributes": {
                            "$typeCMF": "CMFMap",
                            "CMFMapData": []
                        },
                        "CreatedBy": "System",
                        "CreatedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsTemplate": false,
                        "Id": "2601301626030000698",
                        "Name": "Tools",
                        "LastOperationHistorySeq": "630",
                        "FriendlyName": "Tools",
                        "LastServiceHistoryId": "2601301626030000266",
                        "IoTSchema": {
                            "$ref": "5"
                        },
                        "LockType": 0,
                        "IndexOrder": 0,
                        "IoTSchemaReference": {
                            "$id": "256",
                            "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                            "IsShared": false,
                            "Attributes": {
                                "$typeCMF": "CMFMap",
                                "CMFMapData": []
                            },
                            "CreatedBy": "System",
                            "CreatedOn": "2026-01-30T16:29:19.027+00:00",
                            "SchemaProperties": [
                                {
                                    "$id": "257",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:19.033+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000671",
                                    "Name": "UID",
                                    "LastOperationHistorySeq": "624",
                                    "FriendlyName": "UID",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$id": "258",
                                        "$type": "Cmf.Foundation.BusinessObjects.IoTSchema, Cmf.Foundation.BusinessObjects",
                                        "IsShared": false,
                                        "Attributes": {
                                            "$typeCMF": "CMFMap",
                                            "CMFMapData": []
                                        },
                                        "CreatedOn": "0001-01-01T00:00:00+00:00",
                                        "IsTemplate": false,
                                        "Id": "2601301626030000117",
                                        "LastOperationHistorySeq": "0",
                                        "LastServiceHistoryId": "0",
                                        "LockType": 0,
                                        "ModifiedOn": "0001-01-01T00:00:00+00:00",
                                        "ObjectLocked": false,
                                        "UniversalState": 0
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:19.033+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "259",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:19.033+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000672",
                                    "Name": "Name",
                                    "LastOperationHistorySeq": "624",
                                    "FriendlyName": "Name",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "258"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:19.033+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": true,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "260",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 4,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:19.033+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000673",
                                    "Name": "Type",
                                    "LastOperationHistorySeq": "624",
                                    "FriendlyName": "Type",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "258"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:19.033+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                },
                                {
                                    "$id": "261",
                                    "$type": "Cmf.Foundation.BusinessObjects.IoTSchemaProperty, Cmf.Foundation.BusinessObjects",
                                    "DataType": 5,
                                    "Attributes": {
                                        "$typeCMF": "CMFMap",
                                        "CMFMapData": []
                                    },
                                    "CreatedBy": "System",
                                    "CreatedOn": "2026-01-30T16:29:19.033+00:00",
                                    "IsTemplate": false,
                                    "Id": "2601301626030000674",
                                    "Name": "Position",
                                    "LastOperationHistorySeq": "624",
                                    "FriendlyName": "Position",
                                    "LastServiceHistoryId": "2601301626030000266",
                                    "IoTSchema": {
                                        "$ref": "258"
                                    },
                                    "LockType": 0,
                                    "IndexOrder": 0,
                                    "ModifiedBy": "System",
                                    "IsArray": false,
                                    "ModifiedOn": "2026-01-30T16:29:19.033+00:00",
                                    "IsIndexed": false,
                                    "ObjectLocked": false,
                                    "IsRequired": false,
                                    "UniversalState": 2,
                                    "Order": 1,
                                    "IsUserIdentifier": false
                                }
                            ],
                            "IsTemplate": false,
                            "Id": "2601301626030000117",
                            "Name": "Tools_17581887644305893",
                            "LastOperationHistorySeq": "622",
                            "LastServiceHistoryId": "2601301626030000266",
                            "LockType": 0,
                            "ModifiedBy": "System",
                            "ModifiedOn": "2026-01-30T16:29:19.027+00:00",
                            "ObjectLocked": false,
                            "UniversalState": 2
                        },
                        "ModifiedBy": "System",
                        "IsArray": true,
                        "ModifiedOn": "2026-01-30T16:29:19.04+00:00",
                        "IsIndexed": false,
                        "ObjectLocked": false,
                        "IsRequired": false,
                        "UniversalState": 2,
                        "Order": 1,
                        "IsUserIdentifier": false
                    }
                ],
                "IsTemplate": false,
                "Id": "2601301626030000088",
                "Name": "\\IoTEventDefinitions\\CDM\\Material\\MaterialOperations",
                "LastOperationHistorySeq": "349",
                "LastServiceHistoryId": "2601301626030000266",
                "LockType": 0,
                "ModifiedBy": "System",
                "ModifiedOn": "2026-01-30T16:29:18.533+00:00",
                "ObjectLocked": false,
                "UniversalState": 2
            },
            "Attributes": {
                "$typeCMF": "CMFMap",
                "CMFMapData": []
            },
            "CreatedBy": "System",
            "IsEnabled": true,
            "Description": "Material Operations",
            "CreatedOn": "2026-01-30T16:29:19.05+00:00",
            "TimeToLive": 90,
            "IsTemplate": false,
            "Type": "Any",
            "Scope": 4,
            "Id": "2601301626030000008",
            "CreateDataSet": true,
            "Domain": 1,
            "Name": "MaterialOperations",
            "LastOperationHistorySeq": "345",
            "DataSetRetentionTime": "[{\"OlderThan\": 0, \"Location\": \"Delete\"}]",
            "DuplicatesStrategy": 1,
            "LastServiceHistoryId": "2601301626030000266",
            "Folder": {
                "$id": "262",
                "$type": "Cmf.Foundation.BusinessObjects.Folder, Cmf.Foundation.BusinessObjects",
                "ParentFolder": {
                    "$id": "263",
                    "$type": "Cmf.Foundation.BusinessObjects.Folder, Cmf.Foundation.BusinessObjects",
                    "ParentFolder": {
                        "$id": "264",
                        "$type": "Cmf.Foundation.BusinessObjects.Folder, Cmf.Foundation.BusinessObjects",
                        "Attributes": {
                            "$typeCMF": "CMFMap",
                            "CMFMapData": []
                        },
                        "CreatedOn": "0001-01-01T00:00:00+00:00",
                        "IsSystem": false,
                        "IsTemplate": false,
                        "Id": "2501070040230000014",
                        "LastOperationHistorySeq": "0",
                        "LastServiceHistoryId": "0",
                        "LockType": 0,
                        "ModifiedOn": "0001-01-01T00:00:00+00:00",
                        "ObjectLocked": false,
                        "UniversalState": 0
                    },
                    "Attributes": {
                        "$typeCMF": "CMFMap",
                        "CMFMapData": []
                    },
                    "CreatedBy": "System",
                    "Path": "\\IoTEventDefinitions\\CDM",
                    "Description": "CDM IoTEventDefinitions",
                    "CreatedOn": "2025-01-06T16:41:07.173+00:00",
                    "IsSystem": true,
                    "IsTemplate": false,
                    "Id": "2501070040230000015",
                    "Name": "CDM",
                    "LastOperationHistorySeq": "639049453233600000",
                    "LastServiceHistoryId": "2601251332070000015",
                    "LockType": 0,
                    "ModifiedBy": "System",
                    "ModifiedOn": "2026-01-25T13:42:03.36+00:00",
                    "ObjectLocked": false,
                    "UniversalState": 2
                },
                "Attributes": {
                    "$typeCMF": "CMFMap",
                    "CMFMapData": []
                },
                "CreatedBy": "System",
                "Path": "\\IoTEventDefinitions\\CDM\\Material",
                "Description": "Material IoTEventDefinitions ",
                "CreatedOn": "2025-01-06T16:41:07.173+00:00",
                "IsSystem": true,
                "IsTemplate": false,
                "Id": "2501070040230000018",
                "Name": "Material",
                "LastOperationHistorySeq": "639049453233600000",
                "LastServiceHistoryId": "2601251332070000015",
                "LockType": 0,
                "ModifiedBy": "System",
                "ModifiedOn": "2026-01-25T13:42:03.36+00:00",
                "ObjectLocked": false,
                "UniversalState": 2
            },
            "Topic": "aws-proveit-global_any_cdm_material_materialoperations_raw",
            "HasLightVariant": true,
            "LockType": 0,
            "ModifiedBy": "System",
            "OwnerType": 3,
            "ModifiedOn": "2026-01-30T16:29:19.05+00:00",
            "ObjectLocked": false,
            "UniversalState": 2
        },
        "TotalRows": 0
    };

});
