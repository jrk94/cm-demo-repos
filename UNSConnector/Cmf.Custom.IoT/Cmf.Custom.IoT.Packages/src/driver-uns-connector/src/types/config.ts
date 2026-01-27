export interface MQTTConfig {
  broker_host: string;
  broker_port: number;
  client_id?: string;
  username?: string;
  password?: string;
  keepalive?: number;
}

export interface RestConfig {
  base_url: string;
  timeout?: number;
  verify_ssl?: boolean;
  headers?: Record<string, string>;
  pat?: string;
}

export interface EventToPost {
  eventId: string;
  eventValues: Map<string, any>;
}

export interface DatabaseConfig {
  path: string;
}

export interface Config {
  mqtt: MQTTConfig;
  rest?: RestConfig;
  database?: DatabaseConfig;
  topics: string[];
  exclude_topics?: string[];
  event_filters?: string[];
  event_template?: string;
  buffer_seconds?: number;
  max_unchanged_seconds?: number;
}
