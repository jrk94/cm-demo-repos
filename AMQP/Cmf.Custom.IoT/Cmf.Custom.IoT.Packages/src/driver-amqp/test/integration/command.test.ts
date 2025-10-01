
import "reflect-metadata";
import * as inversify from "inversify";
import * as chai from "chai";
import * as chaiSpies from "chai-spies";
import { container as MainContainer } from "../../src/inversify.config";
import { Command, CommandParameter, TYPES as DRIVER_TYPES } from "@criticalmanufacturing/connect-iot-driver";
import { DeviceDriver, CommunicationState, TYPES as COMMUNICATION_TYPES, PropertyValuePair } from "@criticalmanufacturing/connect-iot-driver";
import { TestUtilities } from "@criticalmanufacturing/connect-iot-driver/dist/test";
import { TYPES as COMMON_TYPES, Logger } from "@criticalmanufacturing/connect-iot-common";
import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";
import { AMQPDeviceDriver } from "../../src/driverImplementation";
import { AMQPCommunicationSettings } from "../../src/communicationSettings";
import { LoggerMock } from "@criticalmanufacturing/connect-iot-common/dist/test";
import * as os from "os";
import { Capabilities, CommandExtendedData } from "../../src/extendedData/command";
import { CommandParameterExtendedData, ParameterType } from "../../src/extendedData";

chai.use(chaiSpies);

describe("Solace AMQP Integration Tests - Commands", () => {
    let container: inversify.Container;
    let startTestContainer: StartedTestContainer;
    let amqpPort: number;
    let hostname: string;

    before(async () => {
        hostname = os.hostname();
        startTestContainer = await new GenericContainer("solace/solace-pubsub-standard:latest")
            .withExposedPorts(5672, 8080, 55555) // AMQP, SEMP, SMF
            .withEnvironment({
                "username_admin_globalaccesslevel": "admin",
                "username_admin_password": "admin",
                "system_scaling_maxconnectioncount": "100",  // Lower connection limit for faster boot
                "service_webtransport_enabled": "false",     // Disable web transport service
                "service_mqtt_enabled": "false"             // Disable MQTT if not needed
            })
            // CRITICAL: Solace requires at least 1GB shared memory
            .withSharedMemorySize(1024 * 1024 * 1024) // 1GB in bytes

            // Optional: Resource quotas (not supported in rootless Docker)
            .withResourcesQuota({
                memory: 4, // 2GB memory limit
                cpu: 2     // 2 CPU cores
            })
            .withWaitStrategy(Wait.forListeningPorts())
            .withStartupTimeout(120000) // Solace takes longer to start
            .start();

        amqpPort = startTestContainer.getMappedPort(5672);
    });

    beforeEach((done) => {
        MainContainer.snapshot();
        container = new inversify.Container();
        container.parent = MainContainer;

        // in this case, the logger is deeper and must be removed, otherwise the subscription is logging to the console
        if (container.parent && container.parent.parent) {
            container.parent.parent.rebind(COMMON_TYPES.Logger).to(LoggerMock).inSingletonScope();
        }

        container.bind<Logger>(COMMON_TYPES.Logger).to(LoggerMock).inSingletonScope();

        container.parent.bind<string>(DRIVER_TYPES.DriverId).toConstantValue("test-driver-id");
        container.bind<DeviceDriver>(COMMUNICATION_TYPES.Device.Driver).to(AMQPDeviceDriver).inSingletonScope();

        container.bind("Configurations").toConstantValue({
            commands: [],
            communication: {},
            events: [],
            properties: []
        });

        done();
    });

    it("Publish to Queue", async () => {

        await createQueue(hostname, startTestContainer);

        container.rebind("Configurations").toConstantValue({
            commands: [
                ({
                    deviceId: "Queue",
                    name: "Queue",
                    systemId: "Queue",
                    extendedData: {
                        address: "test-queue",
                        capabilities: Capabilities.Queue
                    } as CommandExtendedData,
                    parameters: [{
                        name: "body",
                        systemId: "body",
                        deviceId: "body",
                        dataType: "Object",
                        deviceType: "Object",
                        extendedData: {
                            parameterType: ParameterType.Body
                        } as CommandParameterExtendedData
                    } as CommandParameter],
                } as Command),
            ],
            communication: {},
            events: [],
            properties: []
        });

        const driver: AMQPDeviceDriver = await startDriver(container, hostname, amqpPort);

        const queueMessages = await checkQueueMessages("test-queue");
        const cp = new Map<string, any>();
        cp.set("body", { "test": "test123" });

        await driver.executeCommand("Queue", cp);

        chai.expect(await checkQueueMessages("test-queue") === queueMessages + 1, "Invalid number of messages");

        await driver.executeCommand("Queue", cp);

        chai.expect(await checkQueueMessages("test-queue") === queueMessages + 2, "Invalid number of messages");
    });

    it("Publish to Queue - Address Override", async () => {

        await createQueue(hostname, startTestContainer);

        container.rebind("Configurations").toConstantValue({
            commands: [
                ({
                    deviceId: "Queue",
                    name: "Queue",
                    systemId: "Queue",
                    extendedData: {
                        address: "random",
                        capabilities: Capabilities.Queue
                    } as CommandExtendedData,
                    parameters: [
                        {
                            name: "body",
                            systemId: "body",
                            deviceId: "body",
                            dataType: "Object",
                            deviceType: "Object",
                            extendedData: {
                                parameterType: ParameterType.Body
                            } as CommandParameterExtendedData
                        } as CommandParameter,
                        {
                            name: "address",
                            systemId: "address",
                            deviceId: "address",
                            dataType: "string",
                            deviceType: "string",
                            extendedData: {
                                parameterType: ParameterType.Address
                            } as CommandParameterExtendedData
                        } as CommandParameter
                    ],
                } as Command),
            ],
            communication: {},
            events: [],
            properties: []
        });

        const driver: AMQPDeviceDriver = await startDriver(container, hostname, amqpPort);

        const cp = new Map<string, any>();
        cp.set("body", { "test": "test123" });
        cp.set("address", "test-queue");

        const queueMessages = await checkQueueMessages("test-queue");

        await driver.executeCommand("Queue", cp);

        chai.expect(await checkQueueMessages("test-queue") === queueMessages + 1, "Invalid number of messages");

        await driver.executeCommand("Queue", cp);

        chai.expect(await checkQueueMessages("test-queue") === queueMessages + 2, "Invalid number of messages");
    });

    it("Publish to Queue - Dynamic Address", async () => {

        await createQueue(hostname, startTestContainer, "test-queue1");
        await createQueue(hostname, startTestContainer, "test-queue2");
        await createQueue(hostname, startTestContainer, "test-queue3");

        container.rebind("Configurations").toConstantValue({
            commands: [
                ({
                    deviceId: "Queue",
                    name: "Queue",
                    systemId: "Queue",
                    extendedData: {
                        address: "random",
                        capabilities: Capabilities.Queue
                    } as CommandExtendedData,
                    parameters: [
                        {
                            name: "body",
                            systemId: "body",
                            deviceId: "body",
                            dataType: "Object",
                            deviceType: "Object",
                            extendedData: {
                                parameterType: ParameterType.Body
                            } as CommandParameterExtendedData
                        } as CommandParameter,
                        {
                            name: "address",
                            systemId: "address",
                            deviceId: "address",
                            dataType: "string",
                            deviceType: "string",
                            extendedData: {
                                parameterType: ParameterType.Address
                            } as CommandParameterExtendedData
                        } as CommandParameter
                    ],
                } as Command),
            ],
            communication: {},
            events: [],
            properties: []
        });

        const driver: AMQPDeviceDriver = await startDriver(container, hostname, amqpPort);

        const cp = new Map<string, any>();
        cp.set("body", { "test": "test123" });
        cp.set("address", "test-queue1");

        const queueMessagesQueue1 = await checkQueueMessages("test-queue1");
        const queueMessagesQueue2 = await checkQueueMessages("test-queue2");
        const queueMessagesQueue3 = await checkQueueMessages("test-queue3");

        await driver.executeCommand("Queue", cp);

        chai.expect(await checkQueueMessages("test-queue1") === queueMessagesQueue1 + 1, "Invalid number of messages");
        chai.expect(await checkQueueMessages("test-queue2") === queueMessagesQueue2, "Invalid number of messages");
        chai.expect(await checkQueueMessages("test-queue3") === queueMessagesQueue2, "Invalid number of messages");

        cp.set("address", "test-queue2");
        await driver.executeCommand("Queue", cp);

        chai.expect(await checkQueueMessages("test-queue1") === queueMessagesQueue1 + 1, "Invalid number of messages");
        chai.expect(await checkQueueMessages("test-queue2") === queueMessagesQueue2 + 1, "Invalid number of messages");
        chai.expect(await checkQueueMessages("test-queue3") === queueMessagesQueue3, "Invalid number of messages");

        cp.set("address", "test-queue3");
        await driver.executeCommand("Queue", cp);

        chai.expect(await checkQueueMessages("test-queue1") === queueMessagesQueue1 + 1, "Invalid number of messages");
        chai.expect(await checkQueueMessages("test-queue2") === queueMessagesQueue2 + 1, "Invalid number of messages");
        chai.expect(await checkQueueMessages("test-queue3") === queueMessagesQueue3 + 1, "Invalid number of messages");

        cp.set("address", "test-queue3");
        await driver.executeCommand("Queue", cp);

        chai.expect(await checkQueueMessages("test-queue1") === queueMessagesQueue1 + 2, "Invalid number of messages");
        chai.expect(await checkQueueMessages("test-queue2") === queueMessagesQueue2 + 1, "Invalid number of messages");
        chai.expect(await checkQueueMessages("test-queue3") === queueMessagesQueue3 + 1, "Invalid number of messages");
    });

    afterEach(async () => {
        chai.spy.restore();
        const driver: AMQPDeviceDriver = container.get<AMQPDeviceDriver>(COMMUNICATION_TYPES.Device.Driver);
        if (driver != null) {
            await driver.disconnect();
        }
        MainContainer.restore();
    });

    after(async () => {
        startTestContainer.stop();
    });

    async function checkQueueMessages(queueName: string) {

        const sempUrl = `http://${hostname}:${startTestContainer.getMappedPort(8080)}`;

        const adminAuth = 'Basic ' + Buffer.from('admin:admin').toString('base64');
        const response = await fetch(`${sempUrl}/SEMP/v2/monitor/msgVpns/default/queues/${queueName}`, {
            headers: {
                'Authorization': adminAuth
            }
        });

        const queueData = await response.json();
        if (queueData.meta.responseCode == 400) {
            throw new Error(queueData.meta.error.description);
        }
        const messageCount: number = queueData.data.spooledMsgCount;

        return messageCount;
    }

    async function startDriver(container: inversify.Container, hostname: string, amqpPort: number) {
        const driver: AMQPDeviceDriver = container.get<AMQPDeviceDriver>(COMMUNICATION_TYPES.Device.Driver);
        const configs: any = container.get("Configurations");
        const comSettings = (configs.communication as AMQPCommunicationSettings);
        comSettings.address = hostname;
        comSettings.port = amqpPort;

        await driver.initialize();
        await driver.setConfigurations(configs);
        await driver.connect();

        await TestUtilities.waitForNoError(2000, "CommunicationState is not 'Setup'", () => {
            chai.expect(driver.communicationState).to.equal(CommunicationState.Setup);
        });
        await driver.setupResult(true);

        await TestUtilities.waitForNoError(2000, "CommunicationState is not 'Communicating'", () => {
            chai.expect(driver.communicationState).to.equal(CommunicationState.Communicating);
        });
        return driver;
    }

    async function createQueue(hostname: string, startTestContainer: StartedTestContainer, queueName: string = 'test-queue') {
        const sempUrl = `http://${hostname}:${startTestContainer.getMappedPort(8080)}`;
        const adminAuth = 'Basic ' + Buffer.from('admin:admin').toString('base64');

        await fetch(`${sempUrl}/SEMP/v2/config/msgVpns/default/queues`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': adminAuth
            },
            body: JSON.stringify({
                queueName,
                accessType: 'exclusive',
                permission: 'consume',
                ingressEnabled: true,
                egressEnabled: true
            })
        });
    }
});
