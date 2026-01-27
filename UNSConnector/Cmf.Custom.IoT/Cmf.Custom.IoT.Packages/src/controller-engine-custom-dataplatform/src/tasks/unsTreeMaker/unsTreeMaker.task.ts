import { Task, System, TaskBase } from "@criticalmanufacturing/connect-iot-controller-engine";
import GenericServiceManagement = System.LBOS.Cmf.Foundation.BusinessOrchestration.GenericServiceManagement;
import { buildCesmiiSchema, buildCesmiiMessage } from "../../cesmii";

type TokenMap = Record<string, string>;
const DEFAULT_MQTT_TOKEN_MAP: TokenMap = {
    "#": "_",
    "+": "_",
    "$": "_",
};

/** Default values for settings */
export const SETTINGS_DEFAULTS: UnsTreeMakerSettings = {
    enterpriseOverride: "",
};

/**
 * @whatItDoes
 *
 * Transforms raw IoT event data into a Unified Namespace (UNS) topic tree following the
 * ISA-95 hierarchy (Enterprise / Site / Facility / Area / Resource). It maps each property
 * to the appropriate MQTT topic, generates CESMII-compliant schema and data messages, and
 * emits the flattened array of topic/payload pairs for downstream publishing.
 *
 * @howToUse
 *
 * Connect the `raw` input to the raw event payload and the `iotEvent` input to the IoT event
 * metadata (which must include `AppProperties.EventDefinition`). Trigger the task via the
 * `activate` input. The task resolves the IoT Event Definition from the system API (with
 * caching), builds the topic tree, and emits the result through `dataOut`.
 * Use the `enterpriseOverride` setting to replace the enterprise-level topic segment with a
 * fixed value.
 *
 * ### Inputs
 * * `any` : **activate** - Activate the task
 * * `any` : **raw** - Raw event payload containing Enterprise, Site, Facility, Area, Resource, and event data
 * * `any` : **iotEvent** - IoT event metadata containing AppProperties.EventDefinition
 *
 * ### Outputs
 *
 * * `object` : **dataOut** - Array of `{ topic: string; raw: any }` pairs representing the UNS topic tree
 * * `bool`   : **success** - Triggered when the task is executed with success
 * * `Error`  : **error** - Triggered when the task failed for some reason
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

    /** Properties Settings */
    /** Information about the example setting */
    public enterpriseOverride: string = SETTINGS_DEFAULTS.enterpriseOverride;

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
                const enterpriseTopic = this.enterpriseOverride ?? `${enterpriseName}`;
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


                const input = new GenericServiceManagement.InputObjects.GetObjectByNameInput();
                input.Name = eventName;
                input.Type = "IoTEventDefinition";
                input.LevelsToLoad = 1;

                let instance = await this._dataStore.retrieve(eventName, undefined);

                if (!instance) {
                    instance = await this._systemAPI.call<any>((input as any))
                        .then((outputRaw) => {
                            // Event
                            const output: GenericServiceManagement.OutputObjects.GetObjectByIdOutput = outputRaw;
                            return output.Instance;
                        });

                    await this._dataStore.store(eventName, instance, System.DataStoreLocation.Temporary);
                }

                // Build CESMII schema and message using the cesmii module
                const cesmiiSchema = buildCesmiiSchema(instance.IoTSchema, eventName, `CDM schema for ${eventName}`, undefined);
                const cesmiiMessage = buildCesmiiMessage(instance.IoTSchema, rawData);

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

                result.push({
                    topic: this.replaceMqttTokens(`${baseTopic}${separator}event${separator}cesmii${separator}schema`),
                    raw: cesmiiSchema
                });

                result.push({
                    topic: this.replaceMqttTokens(`${baseTopic}${separator}event${separator}cesmii${separator}data`),
                    raw: cesmiiMessage
                });

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
                                        for (const [objKey, objValue] of Object.entries(prevValue)) {
                                            if (nodeMapping[objKey]) {
                                                flatten(objValue, `${prevBaseTopic}${separator}node${separator}Previous${separator}${nodeMapping[objKey]}`);
                                            } else {
                                                flatten(objValue, `${prevBaseTopic}${separator}mes${separator}Previous${separator}${objKey}`);
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
                                for (const [objKey, valueOfMap] of Object.entries(value)) {
                                    if (nodeMapping[objKey]) {
                                        flatten(valueOfMap, `${mappedTopic}${separator}node${separator}${nodeMapping[objKey]}`);
                                    } else {
                                        flatten(valueOfMap, `${mappedTopic}${separator}mes${separator}${objKey}`);
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
        return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    private replaceMqttTokens(topic: string, tokenMap: TokenMap = DEFAULT_MQTT_TOKEN_MAP): string {
        let result = topic;
        for (const [reserved, replacement] of Object.entries(tokenMap)) {
            result = result.replace(new RegExp(this.escapeRegex(reserved), "g"), replacement);
        }
        return result;
    }
}

// Add settings here
/** UnsTreeMaker Settings object */
export interface UnsTreeMakerSettings extends System.TaskDefaultSettings {
    /** Override value for the enterprise-level topic segment. When set, replaces the enterprise name from the raw data. */
    enterpriseOverride: string;
}

