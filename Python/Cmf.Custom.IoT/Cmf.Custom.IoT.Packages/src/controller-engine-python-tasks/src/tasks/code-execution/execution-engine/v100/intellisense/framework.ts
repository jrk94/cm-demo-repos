import { System } from "@criticalmanufacturing/connect-iot-controller-engine";

import { DataStore } from "./data-store";
import { Logger } from "./logger";
import { MessageBus } from "./message-bus";
import { SystemAPI } from "./system";
import { Utils } from "./utils";

/**
 * Access to the CMF Framework
 */
export interface Framework {

    /** Used to perform log operations */
    logger: Logger;

    /** Used to store and retrieve values */
    dataStore: DataStore;

    /** Message Bus access */
    messageBus: MessageBus;

    /** System (MES) access */
    system: SystemAPI;

    /** System (MES) access */
    LBOS: typeof System.LBOS;

    /** Utilities */
    utils: Utils;

    /**
     * Used for driver interaction
     */
    driver: System.DriverProxy;
}
