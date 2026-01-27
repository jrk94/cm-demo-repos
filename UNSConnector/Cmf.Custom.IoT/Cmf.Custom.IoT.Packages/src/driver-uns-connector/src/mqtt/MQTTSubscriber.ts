import * as path from "path";
import * as mqtt from "mqtt";
import { TopicMatcher } from "../utils/topicMatcher";
import { CacheDatabase } from "../database/database";
import { PlaceholderResolver } from "../services/placeholderResolver";
import { EventBuffer } from "../services/eventBuffer";
import { inject, injectable } from "inversify";
import { TYPES as COMMON_TYPES, Configuration, Logger, Utils } from "@criticalmanufacturing/connect-iot-common";
import { Event, TYPES } from "@criticalmanufacturing/connect-iot-driver";
import { UNSConnectorCommunicationSettings } from "../communicationSettings";
import * as EventEmitter from "events";
import { EventToPost } from "../types/config";
import * as fs from "node:fs";

/**
 * Main MQTT subscriber with event buffering and API posting.
 */
@injectable()
export class MQTTSubscriber extends EventEmitter {
  private settings: UNSConnectorCommunicationSettings;
  private db: CacheDatabase;
  private resolver: PlaceholderResolver;
  private eventBuffer: EventBuffer;
  private client: mqtt.MqttClient | null = null;
  private events: Map<string, Event> = new Map<string, Event>();

  @inject(COMMON_TYPES.Logger)
  private _logger: Logger;

  @inject(COMMON_TYPES.Configuration)
  private _configuration: Configuration.Configuration;

  @inject(TYPES.DriverId)
  private _driverId: string;

  public setup(settings: UNSConnectorCommunicationSettings, events: Event[]): void {
    this.settings = settings;
    for (const event of events) {
      this.events.set(event.deviceId, event);
    }

    this.db = this.initDatabase();
    this.resolver = new PlaceholderResolver(this.db);
    this.eventBuffer = this.initEventBuffer();
  }

  private initDatabase(): CacheDatabase {
    const bdDir = path.join(Utils.normalizePath(this._configuration.data.storage.settings.path), this._driverId);
    fs.mkdirSync(bdDir, { recursive: true });
    const dbPath = path.join(bdDir, this.settings.database || "mqtt_data.db");
    this._logger.info(`Using database at: ${dbPath}`);
    return new CacheDatabase(dbPath);
  }

  private initEventBuffer(): EventBuffer {
    const interval = this.settings.buffer_seconds || 60;
    return new EventBuffer(interval, (events) => this.postEvents(events));
  }

  private async postEvents(events: EventToPost[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    if (!this.settings.only_emit_bulk_events) {
      for (const event of events) {
        this.emit("onSubscriberData", event);
      }
    }

    this.emit("onSubscriberDataMultiple", events);
  }

  private isExcluded(topic: string): boolean {
    const excludePatterns = this.settings.exclude_topics || [];
    for (const pattern of excludePatterns) {
      if (TopicMatcher.matches(pattern, topic) || topic.startsWith(pattern)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if a topic should trigger an event to be sent.
   *
   * Returns true if the topic contains any of the event_filters keywords.
   * If no filters are configured, all topics trigger events.
   */
  private eventsToSend(topic: string): Event[] {
    const eventFilters = this.events || [];
    if (eventFilters.size === 0) {
      return [];
    }

    const events = [];
    const topicParts = topic.split("/");
    for (const filterKeyword of eventFilters) {
      if (topicParts.includes(filterKeyword[0])) {
        events.push(filterKeyword[1]);
      }
    }
    if (events.length > 0) {
      return events;
    }
    return [];
  }

  /**
   * Create an event document from a topic and value using the event properties.
   *
   * Resolves each property's deviceId and looks up the value.
   * Returns a Record where keys are property names and values are the resolved values.
   */
  private createEvent(event: Event, topic: string, value: string): Map<string, any> {
    return this.resolver.resolve(event, topic, value);
  }

  /**
   * Start the MQTT subscriber.
   */
  start(): void {

    const options: mqtt.IClientOptions = {
      clientId: this.settings.client_id || "mqtt_subscriber",
      keepalive: this.settings.setupTimeout || 60,
    };

    if (this.settings.user) {
      options.username = this.settings.user;
      options.password = this.settings.password || "";
    }

    const brokerUrl = `mqtt://${this.settings.address}:${this.settings.port || 1883}`;
    this._logger.info(`Connecting to ${this.settings.address}:${this.settings.port || 1883}...`);

    this.client = mqtt.connect(brokerUrl, options);

    this.client.on("connect", () => {
      this._logger.info("Connected to MQTT broker");
      for (const topic of this.settings.topics) {
        this.client!.subscribe(topic, (err) => {
          if (err) {
            this._logger.error(`Failed to subscribe to ${topic}: ${err.message}`);
          } else {
            this._logger.info(`Subscribed to: ${topic}`);
          }
        });
      }
    });

    this.client.on("message", (topic: string, payload: Buffer) => {
      // This was swamping the event loop so moving to next tick
      setImmediate(() => {
        if (this.isExcluded(topic)) {
          return;
        }

        let payloadStr: string;
        try {
          payloadStr = payload.toString("utf-8");
        } catch {
          payloadStr = payload.toString();
        }

        // Check if value has changed or is stale
        const stored = this.db.getValueWithTimestamp(topic);
        if (stored) {
          const { value: currentValue, updatedAt } = stored;
          if (currentValue === payloadStr) {
            // Value unchanged, check if it"s stale
            const maxUnchangedSeconds = this.settings.max_unchanged_seconds || 300;
            const lastUpdate = new Date(updatedAt);
            const ageSeconds = (Date.now() - lastUpdate.getTime()) / 1000;
            if (ageSeconds < maxUnchangedSeconds) {
              return; // Value unchanged and not stale, skip
            }
          }
        }

        // Store the new value in database
        this.db.storeValue(topic, payloadStr);

        // Only create and buffer event if topic matches event filters
        const events = this.eventsToSend(topic);
        if (events.length > 0) {
          const eventsToAdd = [];
          for (const event of events) {
            eventsToAdd.push({ eventId: event.name, eventValues: this.createEvent(event, topic, payloadStr) });
          }
          this.eventBuffer.addEvent(eventsToAdd);
        }
      });
    });

    this.client.on("disconnect", () => {
      this._logger.info("Disconnected from MQTT broker");
    });

    this.client.on("error", (error) => {
      this._logger.error(`MQTT error: ${error.message}`);
    });

    // Start event buffer
    this.eventBuffer.start();
  }

  /**
   * Stop the MQTT subscriber.
   */
  stop(): void {
    // Stop event buffer (this will flush remaining events)
    this.eventBuffer.stop();

    if (this.client) {
      this.client.end();
    }

    this.db.close();

    this._logger.info("MQTT subscriber stopped");
  }
}
