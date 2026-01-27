import "reflect-metadata";
import { Task, System, TYPES, DI } from "@criticalmanufacturing/connect-iot-controller-engine";
import EngineTestSuite from "@criticalmanufacturing/connect-iot-controller-engine/dist/test";
import * as chai from "chai";

import {
    PostMultipleIotEventsTask,
    PostMultipleIotEventsSettings,
    EventOccurrence,
    SETTINGS_DEFAULTS
} from "../../../../src/tasks/postMultipleIotEvents/postMultipleIotEvents.task";
import { DriverProxyMock } from "@criticalmanufacturing/connect-iot-controller-engine/dist/test/mocks/driver-proxy.mock";


describe("PostMultipleIotEvents Task tests", () => {

    /** Helper to create a sample EventOccurrence for testing */
    const createSampleEvent = (eventName: string, propertyName: string, value: any): EventOccurrence => ({
        timestamp: new Date(),
        eventSystemId: "test-system-id",
        eventName: eventName,
        eventDeviceId: "test-device-id",
        propertyValues: [{
            propertyName: propertyName,
            value: value,
            originalValue: value
        }]
    });

    /** Default call handler that simply returns a successful output */
    const defaultCallHandler = async (input: System.LBOS.Cmf.Foundation.BusinessOrchestration.BaseInput): Promise<any> => {
        if (input instanceof System.LBOS.Cmf.Foundation.BusinessOrchestration.DataPlatform.InputObjects.PostMultipleIoTEventsInput) {
            const output = new System.LBOS.Cmf.Foundation.BusinessOrchestration.DataPlatform.OutputObjects.PostMultipleIoTEventsOutput();
            return Promise.resolve(output);
        } else {
            return Promise.reject("Unexpected input type.");
        }
    };

    // eslint-disable-next-line @typescript-eslint/ban-types
    const postMultipleIotEventsTestFactory = (
        settings: PostMultipleIotEventsSettings | undefined,
        trigger: Function,
        validate: Function,
        callHandler: (input: System.LBOS.Cmf.Foundation.BusinessOrchestration.BaseInput) => Promise<any> = defaultCallHandler,
        driverProxy: DriverProxyMock = new DriverProxyMock()
    ): void => {

        const taskDefinition = {
            class: PostMultipleIotEventsTask,
            id: "0",
            settings: (settings || {
                ...SETTINGS_DEFAULTS
            } as PostMultipleIotEventsSettings)
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
                        this["bulkEvents"] = new Task.Output<any>();
                        this._outputs.set("activate", this["activate"]);
                        this._outputs.set("bulkEvents", this["bulkEvents"]);
                    }

                    // Trigger the test
                    async onInit(): Promise<void> {
                        trigger(this._outputs);
                    }

                    // Validate the results
                    async onChanges(changes: Task.Changes): Promise<void> {
                        validate(changes);
                    }
                })
            }
        ], [
            { sourceId: "1", outputName: "activate", targetId: "0", inputName: "activate" },
            { sourceId: "1", outputName: "bulkEvents", targetId: "0", inputName: "bulkEvents" },
            { sourceId: "0", outputName: "success", targetId: "1", inputName: "success" },
            { sourceId: "0", outputName: "error", targetId: "1", inputName: "error" },
        ],
            driverProxy,
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
            });
    };

    /**
     * Test Instructions:
     * - Task 0: PostMultipleIotEvents Task
     * - Task 1: Mock task
     *
     * The mock task provides bulkEvents and activate inputs to PostMultipleIotEvents.
     * PostMultipleIotEvents outputs success/error back to the mock task.
     */

    it("should emit success when activated with valid bulk events (LBOS mode)", (done) => {
        const testEvents = [
            createSampleEvent("TestEvent1", "temperature", 25.5),
            createSampleEvent("TestEvent2", "pressure", 101.3)
        ];

        postMultipleIotEventsTestFactory(
            {
                ...SETTINGS_DEFAULTS,
            },
            (outputs: Map<string, Task.Output<any>>) => {
                // First emit the bulk events data
                outputs.get("bulkEvents").emit(testEvents);
                // Then activate the task
                outputs.get("activate").emit(true);
            },
            (changes: Task.Changes) => {
                if (changes["success"]) {
                    chai.expect(changes["success"].currentValue).to.equal(true);
                    done();
                }
            },
            async (input: System.LBOS.Cmf.Foundation.BusinessOrchestration.BaseInput) => {
                if (input instanceof System.LBOS.Cmf.Foundation.BusinessOrchestration.DataPlatform.InputObjects.PostMultipleIoTEventsInput) {
                    const output = new System.LBOS.Cmf.Foundation.BusinessOrchestration.DataPlatform.OutputObjects.PostMultipleIoTEventsOutput();
                    chai.expect(input).to.have.property("IgnoreLastServiceId", false);
                    chai.expect(input).to.have.property("NumberOfRetries", 1);
                    chai.expect(input).to.have.property("ServiceComments", "");
                    chai.expect(input).to.have.property("IoTEvents").that.is.an("array").with.lengthOf(2);

                    // First event
                    const event0 = input.IoTEvents[0];
                    chai.expect(event0).to.have.property("IgnoreLastServiceId", false);
                    chai.expect(event0).to.have.property("NumberOfRetries", 1);
                    chai.expect(event0).to.have.property("ServiceComments", "");
                    chai.expect(event0).to.have.nested.property("AppProperties.ApplicationName", "ConnectIoTUNSConnector");
                    chai.expect(event0).to.have.nested.property("AppProperties.EventDefinition", "test-device-id");
                    chai.expect(event0).to.have.deep.property("Data", { temperature: 25.5 });

                    // Second event
                    const event1 = input.IoTEvents[1];
                    chai.expect(event1).to.have.property("IgnoreLastServiceId", false);
                    chai.expect(event1).to.have.property("NumberOfRetries", 1);
                    chai.expect(event1).to.have.property("ServiceComments", "");
                    chai.expect(event1).to.have.nested.property("AppProperties.ApplicationName", "ConnectIoTUNSConnector");
                    chai.expect(event1).to.have.nested.property("AppProperties.EventDefinition", "test-device-id");
                    chai.expect(event1).to.have.deep.property("Data", { pressure: 101.3 });
                    return Promise.resolve(output);
                } else {
                    return Promise.reject("Unexpected input type.");
                }
            }
        );
    });

    it("should emit success when activated with single event", (done) => {
        const testEvents = [
            createSampleEvent("SingleEvent", "value", 42)
        ];

        postMultipleIotEventsTestFactory(
            {
                ...SETTINGS_DEFAULTS,
            },
            (outputs: Map<string, Task.Output<any>>) => {
                outputs.get("bulkEvents").emit(testEvents);
                outputs.get("activate").emit(true);
            },
            (changes: Task.Changes) => {
                if (changes["success"]) {
                    chai.expect(changes["success"].currentValue).to.equal(true);
                    done();
                }
            },
            async (input: System.LBOS.Cmf.Foundation.BusinessOrchestration.BaseInput) => {
                if (input instanceof System.LBOS.Cmf.Foundation.BusinessOrchestration.DataPlatform.InputObjects.PostMultipleIoTEventsInput) {
                    const output = new System.LBOS.Cmf.Foundation.BusinessOrchestration.DataPlatform.OutputObjects.PostMultipleIoTEventsOutput();
                    chai.expect(input).to.have.property("IgnoreLastServiceId", false);
                    chai.expect(input).to.have.property("NumberOfRetries", 1);
                    chai.expect(input).to.have.property("ServiceComments", "");
                    chai.expect(input).to.have.property("IoTEvents").that.is.an("array").with.lengthOf(1);

                    const event0 = input.IoTEvents[0];
                    chai.expect(event0).to.have.property("IgnoreLastServiceId", false);
                    chai.expect(event0).to.have.property("NumberOfRetries", 1);
                    chai.expect(event0).to.have.property("ServiceComments", "");
                    chai.expect(event0).to.have.nested.property("AppProperties.ApplicationName", "ConnectIoTUNSConnector");
                    chai.expect(event0).to.have.nested.property("AppProperties.EventDefinition", "test-device-id");
                    chai.expect(event0).to.have.deep.property("Data", { value: 42 });

                    return Promise.resolve(output);
                } else {
                    return Promise.reject("Unexpected input type.");
                }
            }
        );
    });

    it("should handle events with multiple property values", (done) => {
        const eventWithMultipleProps: EventOccurrence = {
            timestamp: new Date(),
            eventSystemId: "test-system-id",
            eventName: "MultiPropEvent",
            eventDeviceId: "test-device-id",
            propertyValues: [
                { propertyName: "temperature", value: 25.5, originalValue: 25.5 },
                { propertyName: "humidity", value: 60, originalValue: 60 },
                { propertyName: "status", value: "OK", originalValue: "OK" }
            ]
        };

        postMultipleIotEventsTestFactory(
            {
                ...SETTINGS_DEFAULTS,
            },
            (outputs: Map<string, Task.Output<any>>) => {
                outputs.get("bulkEvents").emit([eventWithMultipleProps]);
                outputs.get("activate").emit(true);
            },
            (changes: Task.Changes) => {
                if (changes["success"]) {
                    chai.expect(changes["success"].currentValue).to.equal(true);
                    done();
                }
            },
            async (input: System.LBOS.Cmf.Foundation.BusinessOrchestration.BaseInput) => {
                if (input instanceof System.LBOS.Cmf.Foundation.BusinessOrchestration.DataPlatform.InputObjects.PostMultipleIoTEventsInput) {
                    const output = new System.LBOS.Cmf.Foundation.BusinessOrchestration.DataPlatform.OutputObjects.PostMultipleIoTEventsOutput();
                    chai.expect(input).to.have.property("IgnoreLastServiceId", false);
                    chai.expect(input).to.have.property("NumberOfRetries", 1);
                    chai.expect(input).to.have.property("ServiceComments", "");
                    chai.expect(input).to.have.property("IoTEvents").that.is.an("array").with.lengthOf(1);

                    const event0 = input.IoTEvents[0];
                    chai.expect(event0).to.have.property("IgnoreLastServiceId", false);
                    chai.expect(event0).to.have.property("NumberOfRetries", 1);
                    chai.expect(event0).to.have.property("ServiceComments", "");
                    chai.expect(event0).to.have.nested.property("AppProperties.ApplicationName", "ConnectIoTUNSConnector");
                    chai.expect(event0).to.have.nested.property("AppProperties.EventDefinition", "test-device-id");
                    chai.expect(event0).to.have.deep.property("Data", { temperature: 25.5, humidity: 60, status: "OK" });


                    return Promise.resolve(output);
                } else {
                    return Promise.reject("Unexpected input type.");
                }
            }
        );
    });


    it("should handle events with multiple property values with path", (done) => {
        const eventWithMultipleProps: EventOccurrence = {
            timestamp: new Date(),
            eventSystemId: "test-system-id",
            eventName: "MultiPropEvent",
            eventDeviceId: "test-device-id",
            propertyValues: [
                { propertyName: "temperature", value: 25.5, originalValue: 25.5 },
                { propertyName: "temperatureType", value: "ºC", originalValue: "ºC" },
                { propertyName: "humidity", value: 60, originalValue: 60 },
                { propertyName: "status", value: "OK", originalValue: "OK" }
            ]
        };

        const driverMock = new DriverProxyMock();
        driverMock["_driver"] = {};
        driverMock["_driver"]._fullDriverDefinitions = {};

        driverMock["_driver"]._fullDriverDefinitions.SystemProperties = new Map<string, System.LBOS.Cmf.Foundation.BusinessObjects.AutomationProperty>();

        driverMock["_driver"]._fullDriverDefinitions.SystemProperties.set("temperature", {
            Name: "temperature",
            ExtendedData: { path: "Temperature.Value" }
        } as unknown as System.LBOS.Cmf.Foundation.BusinessObjects.AutomationProperty);
        driverMock["_driver"]._fullDriverDefinitions.SystemProperties.set("temperatureType", {
            Name: "temperatureType",
            ExtendedData: { path: "Temperature.Type" }
        } as unknown as System.LBOS.Cmf.Foundation.BusinessObjects.AutomationProperty);

        postMultipleIotEventsTestFactory(
            {
                ...SETTINGS_DEFAULTS,
            },
            (outputs: Map<string, Task.Output<any>>) => {
                outputs.get("bulkEvents").emit([eventWithMultipleProps]);
                outputs.get("activate").emit(true);
            },
            (changes: Task.Changes) => {
                if (changes["success"]) {
                    chai.expect(changes["success"].currentValue).to.equal(true);
                    done();
                }
            },
            async (input: System.LBOS.Cmf.Foundation.BusinessOrchestration.BaseInput) => {
                if (input instanceof System.LBOS.Cmf.Foundation.BusinessOrchestration.DataPlatform.InputObjects.PostMultipleIoTEventsInput) {
                    const output = new System.LBOS.Cmf.Foundation.BusinessOrchestration.DataPlatform.OutputObjects.PostMultipleIoTEventsOutput();
                    chai.expect(input).to.have.property("IgnoreLastServiceId", false);
                    chai.expect(input).to.have.property("NumberOfRetries", 1);
                    chai.expect(input).to.have.property("ServiceComments", "");
                    chai.expect(input).to.have.property("IoTEvents").that.is.an("array").with.lengthOf(1);

                    const event0 = input.IoTEvents[0];
                    chai.expect(event0).to.have.property("IgnoreLastServiceId", false);
                    chai.expect(event0).to.have.property("NumberOfRetries", 1);
                    chai.expect(event0).to.have.property("ServiceComments", "");
                    chai.expect(event0).to.have.nested.property("AppProperties.ApplicationName", "ConnectIoTUNSConnector");
                    chai.expect(event0).to.have.nested.property("AppProperties.EventDefinition", "test-device-id");
                    chai.expect(event0).to.have.deep.property("Data", { Temperature: { Value: 25.5, Type: "ºC" }, humidity: 60, status: "OK" });

                    return Promise.resolve(output);
                } else {
                    return Promise.reject("Unexpected input type.");
                }
            },
            driverMock
        );
    });
});