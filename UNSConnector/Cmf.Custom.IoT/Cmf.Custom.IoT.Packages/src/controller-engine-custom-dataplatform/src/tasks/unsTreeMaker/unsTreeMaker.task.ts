import { Task, System, TaskBase } from "@criticalmanufacturing/connect-iot-controller-engine";

type TokenMap = Record<string, string>;
const DEFAULT_MQTT_TOKEN_MAP: TokenMap = {
    '#': '_',
    '+': '_',
    '$': '_',
};

/**
 * @whatItDoes
 *
 * This task does something ... describe here
 *
 * @howToUse
 *
 * yada yada yada
 *
 * ### Inputs
 * * `any` : **activate** - Activate the task
 *
 * ### Outputs
 *
 * * `bool`  : ** success ** - Triggered when the the task is executed with success
 * * `Error` : ** error ** - Triggered when the task failed for some reason
 *
 * ### Settings
 * See {@see UnsTreeMakerSettings}
 */
@Task.Task()
export class UnsTreeMakerTask extends TaskBase {

    /** Accessor helper for untyped properties and output emitters. */
    // [key: string]: any;

    /** **Inputs** */
    /** Raw */
    public raw: any = null;
    /** IotEvent */
    public iotEvent: any = null;

    /** **Outputs** */
    /** DataOut */
    public dataOut: Task.Output<object> = new Task.Output<object>();

    /**
     * When one or more input values is changed this will be triggered,
     * @param changes Task changes
     */
    public override async onChanges(changes: Task.Changes): Promise<void> {
        if (changes["activate"]) {
            try {
                const rawData = this.raw?.value;
                const separator = "/";
                const defaultEnterprise = "DefaultEnterprise",
                    defaultSite = "DefaultSite",
                    defaultFacility = "DefaultFacility",
                    defaultArea = "DefaultArea",
                    defaultResource = "DefaultResource";

                const enterpriseName = (rawData?.Enterprise?.Name?.trim() || defaultEnterprise);
                const siteName = (rawData?.Site?.Name?.trim() || defaultSite).replace(/ /g, "-");
                const facilityName = (rawData?.Facility?.Name?.trim() || defaultFacility).replace(/ /g, "-");
                const areaName = (rawData?.Area?.Name?.trim() || defaultArea).replace(/ /g, "-");
                const resourceName = rawData?.Resource ? (rawData?.Resource?.Name?.trim() || defaultResource).replace(/ /g, "-") : null;

                // Build topic levels
                const enterpriseTopic = `${enterpriseName}`;
                const siteTopic = `${enterpriseTopic}${separator}criticalmfg${separator}${siteName}`;
                const facilityTopic = `${siteTopic}${separator}${facilityName}`;
                const areaTopic = `${facilityTopic}${separator}${areaName}`;
                const resourceTopic = resourceName ? `${areaTopic}${separator}${resourceName}` : null;

                // Map each top-level key to its appropriate base topic
                const topicMapping: Record<string, string | null> = {
                    "Header": resourceTopic ?? areaTopic,
                    "Enterprise": enterpriseTopic,
                    "Site": siteTopic,
                    "Facility": facilityTopic,
                    "Area": areaTopic,
                    "Resource": resourceTopic,
                    "Previous": null, // handled specially
                };

                const nodeMapping: Record<string, string | null> = {
                    "Name": "assetidentifier/assetname",
                    "UID": "assetidentifier/assetid"
                };

                let eventName = this.iotEvent?.value?.AppProperties?.EventDefinition;
                eventName = eventName.substring(eventName.lastIndexOf("\\") + 1);

                const baseTopic = `${resourceTopic ?? areaTopic}`;
                const baseTopicMES = `${resourceTopic ?? areaTopic}${separator}mes`;

                const result: { topic: string; raw: any }[] = [];

                const flatten = (obj: any, currentPath: string) => {
                    if (obj === null || obj === undefined) {
                        return;
                    }

                    if (Array.isArray(obj)) {
                        result.push({ topic: this.replaceMqttTokens(currentPath), raw: obj });
                        return;
                    }

                    if (typeof obj === "object") {
                        for (const [key, value] of Object.entries(obj)) {
                            flatten(value, `${currentPath}${separator}${key}`);
                        }
                        return;
                    }

                    // Primitive value (string, number, boolean)
                    result.push({ topic: this.replaceMqttTokens(currentPath), raw: `"${obj}"` });
                };

                // Add the event under /eventName topic
                result.push({
                    topic: this.replaceMqttTokens(`${baseTopic}${separator}event${separator}name`),
                    raw: `"${eventName}"`
                });
                if (rawData.Header) {
                    for (const [key, value] of Object.entries(rawData.Header)) {
                        flatten(value, `${baseTopic}${separator}event${separator}${key}`);
                    }
                }

                rawData.Header = undefined;

                // Add the full payload under /raw topic
                result.push({
                    topic: this.replaceMqttTokens(`${baseTopic}${separator}raw`),
                    raw: rawData
                });

                // Process each top-level property with its mapped topic
                for (const [key, value] of Object.entries(rawData ?? {})) {
                    if (key === "Key" || key === "Value") {
                        // Key/Value pair: use Key as the topic and Value as the data
                        if (key === "Key" && rawData.Value !== undefined) {
                            flatten(rawData.Value, this.replaceMqttTokens(`${baseTopicMES}${separator}${value}`));
                        }
                        continue;
                    }
                    if (key === "Previous") {
                        // Handle Previous specially - nest under the appropriate level with /Previous/node suffix
                        const previous = value as Record<string, any>;
                        if (previous) {
                            for (const [prevKey, prevValue] of Object.entries(previous)) {
                                const prevBaseTopic = topicMapping[prevKey];
                                if (prevBaseTopic && prevValue) {
                                    if (typeof prevValue === "object") {
                                        for (const [key, value] of Object.entries(prevValue)) {
                                            if (nodeMapping[key]) {
                                                flatten(value, `${prevBaseTopic}${separator}node${separator}Previous${separator}${nodeMapping[key]}`);
                                            } else {
                                                flatten(value, `${prevBaseTopic}${separator}mes${separator}Previous${separator}${key}`);
                                            }
                                        }
                                    } else {
                                        flatten(prevValue, `${prevBaseTopic}${separator}mes${separator}Previous`);
                                    }
                                } else {
                                    // If no specific mapping, flatten under the base topic
                                    flatten(prevValue, `${baseTopicMES}${separator}Previous${separator}${prevKey}`);
                                }
                            }
                        }
                    } else {
                        const mappedTopic = topicMapping[key];
                        if (mappedTopic && value !== undefined) {
                            if (typeof value === "object") {
                                for (const [key, valueOfMap] of Object.entries(value)) {
                                    if (nodeMapping[key]) {
                                        flatten(valueOfMap, `${mappedTopic}${separator}node${separator}${nodeMapping[key]}`);
                                    } else {
                                        flatten(valueOfMap, `${mappedTopic}${separator}mes${separator}${key}`);
                                    }
                                }
                            } else {
                                flatten(value, `${mappedTopic}${separator}mes`);
                            }
                        } else {
                            // If no specific mapping, flatten under the base topic
                            flatten(value, `${baseTopicMES}${separator}${key}`);
                        }
                    }
                }

                this._logger.info(`result: ${JSON.stringify(result)}`);

                this.dataOut.emit(result);
                this.success.emit(true);
            } catch (error) {
                this.logAndEmitError(error.message);
            }

        }
    }

    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    private replaceMqttTokens(topic: string, tokenMap: TokenMap = DEFAULT_MQTT_TOKEN_MAP): string {
        let result = topic;
        for (const [reserved, replacement] of Object.entries(tokenMap)) {
            result = result.replace(new RegExp(this.escapeRegex(reserved), 'g'), replacement);
        }
        return result;
    }
}
