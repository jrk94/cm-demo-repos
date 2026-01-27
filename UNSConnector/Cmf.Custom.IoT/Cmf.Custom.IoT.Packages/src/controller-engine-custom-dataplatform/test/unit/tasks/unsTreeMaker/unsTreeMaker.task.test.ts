import "reflect-metadata";
import { Task } from "@criticalmanufacturing/connect-iot-controller-engine";
import EngineTestSuite from "@criticalmanufacturing/connect-iot-controller-engine/dist/test";
import * as chai from "chai";

import {
    UnsTreeMakerTask,
} from "../../../../src/tasks/unsTreeMaker/unsTreeMaker.task";

describe("UnsTreeMaker Task tests", () => {

    // eslint-disable-next-line @typescript-eslint/ban-types
    const unsTreeMakerTestFactory = (trigger: Function, validate: Function): void => {

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
        ]);
    };

    /** Helper to create standard iotEvent input */
    const createIotEvent = (eventDefinition: string) => ({
        AppProperties: {
            EventDefinition: eventDefinition
        }
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
                        r.topic === "MachineMakers/criticalmfg/node/assetidentifier/assetid"
                    );
                    chai.expect(enterpriseUIDEntry).to.not.be.undefined;
                    chai.expect(enterpriseUIDEntry.raw).to.equal('"2601301526490000002"');

                    const enterpriseNameEntry = result.find(r =>
                        r.topic === "MachineMakers/criticalmfg/node/assetidentifier/assetname"
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
                    chai.expect(result).to.have.lengthOf(49);

                    done();
                }
            }
        );
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
                    const enterpriseIdEntry = result.find(r =>
                        r.topic === "MachineMakers/criticalmfg/node/assetidentifier/assetid"
                    );
                    chai.expect(enterpriseIdEntry).to.not.be.undefined;
                    chai.expect(enterpriseIdEntry.raw).to.equal('"2601301526490000002"');

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
                    chai.expect(result).to.have.lengthOf(73);

                    done();
                }
            }
        );
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
                        r.topic === "MachineMakers/criticalmfg/node/assetidentifier/assetid"
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
                    chai.expect(result).to.have.lengthOf(44);

                    done();
                }
            }
        );
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
    });
});
