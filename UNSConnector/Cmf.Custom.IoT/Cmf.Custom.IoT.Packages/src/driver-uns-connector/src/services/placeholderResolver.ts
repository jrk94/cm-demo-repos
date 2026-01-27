import { CacheDatabase } from '../database/database';
import { Event } from "@criticalmanufacturing/connect-iot-driver";

/**
 * Resolves event property values using topic paths from database.
 *
 * Each property's deviceId can contain placeholders that are resolved
 * relative to the trigger topic.
 *
 * Placeholder Syntax (used in deviceId):
 * - {{.}} - Value of the trigger topic
 * - {{key}} - Last part of the topic path (the key name)
 * - {{value}} - The value received
 * - {{@timestamp}} - Current ISO timestamp
 * - {{@N}} - Extract level N from topic path (1-based, excluding key)
 * - {{@N-M}} - Extract levels N through M
 * - {{@N-M/path}} - Extract levels N-M, then append /path
 * - {{../sibling}} - Go up one level, then to sibling
 * - {{../../other/value}} - Go up two levels, then to other/value
 * - {{absolute/path}} - Absolute topic path
 */
export class PlaceholderResolver {
  private static readonly PLACEHOLDER_PATTERN = /\{\{([^}]+)\}\}/g;

  constructor(private db: CacheDatabase) { }

  /**
   * Resolve all event properties to their values.
   * For each property, resolves placeholders in deviceId, looks up the value in database.
   * @param event The event containing properties to resolve
   * @param triggerTopic The topic that triggered this event
   * @param triggerValue The value received on the trigger topic
   * @returns Map where key is property.name and value is the resolved value
   */
  resolve(event: Event, triggerTopic: string, triggerValue: string): Map<string, any> {
    const result = new Map<string, any>();

    for (const property of event.properties) {
      const value = this.resolvePropertyValue(property.deviceId, triggerTopic, triggerValue);

      if (value !== null && value !== undefined) {
        result.set(property.name, value);
      }
    }

    return result;
  }

  /**
   * Resolve a property's deviceId to its value.
   * Handles direct-value placeholders (key, value, timestamp) and topic-based lookups.
   */
  private resolvePropertyValue(deviceId: string, triggerTopic: string, triggerValue: string): any {
    if (!deviceId) {
      return null;
    }

    // Check if deviceId is a single direct-value placeholder
    const singlePlaceholder = deviceId.match(/^\{\{([^}]+)\}\}$/);
    if (singlePlaceholder) {
      const placeholder = singlePlaceholder[1];

      // Direct value placeholders - return value directly, don't look up in DB
      if (placeholder === 'key') {
        const topicParts = triggerTopic.split('/');
        return topicParts.length > 0 ? topicParts[topicParts.length - 1] : null;
      }

      if (placeholder === 'value' || placeholder === '.') {
        return triggerValue;
      }

      if (placeholder === '@timestamp') {
        return new Date().toISOString();
      }
    }

    // For topic-based placeholders, resolve and look up in database
    const resolvedDeviceId = this.resolveDeviceId(deviceId, triggerTopic, triggerValue);
    return this.getValueForDeviceId(resolvedDeviceId, triggerTopic, triggerValue);
  }

  /**
   * Resolve placeholders in a deviceId string.
   */
  private resolveDeviceId(deviceId: string, triggerTopic: string, triggerValue: string): string {
    if (!deviceId) {
      return deviceId;
    }

    return deviceId.replace(PlaceholderResolver.PLACEHOLDER_PATTERN, (_, placeholder) => {
      const resolved = this.resolvePlaceholder(placeholder, triggerTopic, triggerValue);
      return resolved !== null && resolved !== undefined ? String(resolved) : '';
    });
  }

  /**
   * Get value for a resolved deviceId.
   * If deviceId matches triggerTopic, return triggerValue; otherwise look up in database.
   */
  private getValueForDeviceId(deviceId: string, triggerTopic: string, triggerValue: string): unknown {
    if (deviceId === triggerTopic) {
      return triggerValue;
    }
    return this.db.getValue(deviceId);
  }

  /**
   * Resolve a placeholder to get the topic path or literal value.
   */
  private resolvePlaceholder(placeholder: string, triggerTopic: string, triggerValue: string): unknown {
    const topicParts = triggerTopic.split('/');
    const key = topicParts.length > 0 ? topicParts[topicParts.length - 1] : null;
    const pathParts = topicParts.length > 1 ? topicParts.slice(0, -1) : [];

    // {{.}} - The trigger topic itself
    if (placeholder === '.') {
      return triggerTopic;
    }

    // {{key}} - Last part of the topic (the key name)
    if (placeholder === 'key') {
      return key;
    }

    // {{value}} - The value received (for inline substitution)
    if (placeholder === 'value') {
      return triggerValue;
    }

    // {{@timestamp}} - Current ISO timestamp
    if (placeholder === '@timestamp') {
      return new Date().toISOString();
    }

    // {{@N}} or {{@N/path}} - Extract level N (1-based, from path excluding key)
    const levelMatch = placeholder.match(/^@(\d+)(?:\/(.+))?$/);
    if (levelMatch) {
      const level = parseInt(levelMatch[1], 10);
      const suffix = levelMatch[2];

      if (level >= 1 && level <= pathParts.length) {
        if (suffix) {
          return `${pathParts[level - 1]}/${suffix}`;
        } else {
          return pathParts[level - 1];
        }
      }
      return null;
    }

    // {{@N-M}} or {{@N-M/path}} - Extract levels N through M
    const rangeMatch = placeholder.match(/^@(\d+)-(\d+)(?:\/(.+))?$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      const suffix = rangeMatch[3];

      if (start >= 1 && start <= end && end <= pathParts.length) {
        let resolvedTopic = pathParts.slice(start - 1, end).join('/');
        if (suffix) {
          resolvedTopic = `${resolvedTopic}/${suffix}`;
        }
        return resolvedTopic;
      }
      return null;
    }

    // {{../sibling}} or {{../../other/value}} - Relative paths
    if (placeholder.startsWith('..')) {
      const parts = placeholder.split('/');
      let upCount = 0;
      const remaining: string[] = [];

      for (const part of parts) {
        if (part === '..') {
          upCount++;
        } else {
          remaining.push(part);
        }
      }

      // Navigate up from the path (excluding key)
      if (upCount <= pathParts.length) {
        const baseParts = upCount > 0 ? pathParts.slice(0, -upCount) : pathParts;
        return [...baseParts, ...remaining].join('/');
      }
      return null;
    }

    // Literal value - return as-is (will be used as topic path)
    return placeholder;
  }
}
