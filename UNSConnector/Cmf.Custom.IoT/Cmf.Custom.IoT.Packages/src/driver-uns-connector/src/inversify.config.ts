import "reflect-metadata";
import { Container } from "inversify";

import { DeviceDriver, TYPES as COMMUNICATION_TYPES, container as driverContainer } from "@criticalmanufacturing/connect-iot-driver";
import { TYPES } from "./types";
import { UNSConnectorDeviceDriver } from "./driverImplementation";
import { ExtensionHandler } from "./extensions";
import { MQTTSubscriber } from "./mqtt/mqttSubscriber";

const container = new Container();
container.parent = driverContainer;
container.parent?.bind<Container>(TYPES.Injector).toConstantValue(container);
container.bind<ExtensionHandler>(TYPES.ExtensionHandler).to(ExtensionHandler).inSingletonScope();
container.bind("dummy").toConstantValue("dummy"); // Needed to bypass constructor issue with node 12.16 and eventemitter
// Must place in parent otherwise the driver(common) will not find this
container.bind<MQTTSubscriber>(TYPES.MqttSubscriberHandler).to(MQTTSubscriber).inSingletonScope();
container.parent?.bind<DeviceDriver>(COMMUNICATION_TYPES.Device.Driver).to(UNSConnectorDeviceDriver).inSingletonScope();

export { container };
