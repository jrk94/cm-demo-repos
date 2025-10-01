import "reflect-metadata";
import * as inversify from "inversify";
import * as chai from "chai";
import * as chaiSpies from "chai-spies";
import { container as MainContainer } from "../../src/inversify.config";
import { TYPES as DRIVER_TYPES } from "@criticalmanufacturing/connect-iot-driver";
import { DeviceDriver, CommunicationState, TYPES as COMMUNICATION_TYPES, PropertyValuePair } from "@criticalmanufacturing/connect-iot-driver";
import { TestUtilities } from "@criticalmanufacturing/connect-iot-driver/dist/test";
import { TYPES as COMMON_TYPES, Logger } from "@criticalmanufacturing/connect-iot-common";
import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";
import { AMQPDeviceDriver } from "../../src/driverImplementation";
import { AMQPCommunicationSettings } from "../../src/communicationSettings";
import { LoggerMock } from "../../../testUtilities/logger.mock";
import * as os from "os";

chai.use(chaiSpies);

describe("Connection Tests", () => {
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

    it("Connect to Solace", async () => {

        container.rebind("Configurations").toConstantValue({
            commands: [],
            communication: {},
            events: [],
            properties: []
        });

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
    });

    it("Connect to Solace Basic Auth - Happy Path", async () => {
        await createUserInSolace(startTestContainer, hostname);

        container.rebind("Configurations").toConstantValue({
            commands: [],
            communication: {
                "username": "testuser",
                "password": "testpass123"
            },
            events: [],
            properties: []
        });

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
    });

    it("Connect to Solace Basic Auth - Wrong Auth", async () => {

        await createUserInSolace(startTestContainer, hostname);

        container.rebind("Configurations").toConstantValue({
            commands: [],
            communication: {
                "username": "admin123",
                "password": "admin1",
                "connectingTimeout": 1000
            },
            events: [],
            properties: []
        });

        const driver: AMQPDeviceDriver = container.get<AMQPDeviceDriver>(COMMUNICATION_TYPES.Device.Driver);
        const spy = chai.spy.on(driver, "notifyCommunicationStateChanged");
        const configs: any = container.get("Configurations");
        const comSettings = (configs.communication as AMQPCommunicationSettings);
        comSettings.address = hostname;
        comSettings.port = amqpPort;

        await driver.initialize();
        await driver.setConfigurations(configs);
        await driver.connect();

        await TestUtilities.waitForNoError(2000, "State should change to Disconnected", () => {
            chai.expect(spy).to.be.called.with(CommunicationState.Disconnecting, CommunicationState.Disconnected);
        });
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
});

async function createUserInSolace(startTestContainer: StartedTestContainer, hostname: string) {
    const sempPort = startTestContainer.getMappedPort(8080);
    const sempUrl = `http://${hostname}:${sempPort}`;
    const adminAuth = 'Basic ' + Buffer.from('admin:admin').toString('base64');

    // 1. Create the client user
    let result = await fetch(`${sempUrl}/SEMP/v2/config/msgVpns/default/clientUsernames`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': adminAuth
        },
        body: JSON.stringify({
            clientUsername: 'testuser',
            password: 'testpass123',
            enabled: true
        })
    });

    // 2. Enable basic authentication on the message VPN
    result = await fetch(`${sempUrl}/SEMP/v2/config/msgVpns/default`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': adminAuth
        },
        body: JSON.stringify({
            authenticationBasicEnabled: true,
            authenticationBasicType: "internal"
        })
    });
}
