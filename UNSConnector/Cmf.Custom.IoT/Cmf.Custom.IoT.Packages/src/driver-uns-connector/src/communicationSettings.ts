import { validateConfigurations } from "@criticalmanufacturing/connect-iot-driver";

/** Driver Communication Settings. Will be available in the Equipment Setup Task */
export interface UNSConnectorCommunicationSettings {
    // Add driver specific settings here
    address: string;
    port: number;
    user: string;
    password: string;
    client_id: string;
    topics: string[];
    exclude_topics: string[];
    database: string;
    buffer_seconds: number;
    max_unchanged_seconds: number;
    only_emit_bulk_events: boolean;

    // Common/driver WS settings
    heartbeatInterval: number;
    setupTimeout: number;
    intervalBeforeReconnect: number;
    connectingTimeout: number;
}

/** Default Communication Settings */
export const uNSConnectorDefaultCommunicationSettings: UNSConnectorCommunicationSettings = {
    // Add driver specific default settings here
    address: "localhost",
    port: 1883,
    user: "",
    password: "",
    client_id: "mqtt_subscriber",
    topics: [],
    exclude_topics: [],
    database: "mqtt_data",
    buffer_seconds: 1,
    max_unchanged_seconds: 300,
    only_emit_bulk_events: true,

    // Common/driver WS settings
    heartbeatInterval: 30000,
    setupTimeout: 10000,
    intervalBeforeReconnect: 5000,
    connectingTimeout: 30000,
};

/** Validate communication parameters enum values */
export function validateCommunicationParameters(definition: any, configs: any): void {

    const parameters = definition.criticalManufacturing.automationProtocol.parameters;
    validateConfigurations(configs, parameters);

    for (const param of parameters) {

        if (param.name == "topics" || param.name == "exclude_topics" || param.name == "event_filters") {
            param.defaultValue = param.defaultValue.split(",").map((item: string) => item.trim().replace(/"/g, ""));
            configs[param.name] = configs[param.name]?.split(",")?.map((item: string) => item.trim().replace(/"/g, ""));
        }
    }

}
