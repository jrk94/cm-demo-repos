// CNC Machine telemetry data types

export interface AxisData {
  position: number;
  load: number;
}

export interface SpindleData {
  speed: number;
  load: number;
  override: number;
  temperature: number;
  toolNumber: number;
}

export interface ControllerData {
  execution: ExecutionState;
  program: string;
  block: string;
  emergencyStop: string;
  partCount: number;
  cycleTime: number;
}

export interface CoolantData {
  flowRate: number;
  temperature: number;
}

export interface ConditionData {
  spindle: ConditionState;
  coolant: ConditionState;
  axes: ConditionState;
}

export interface MaterialData {
  currentPartId: string;
  workOrderId: string;
  trackInTime: string;
  trackOutResult: string;
  trackOutTime: string;
}

export interface CncTelemetry {
  timestamp: string;
  machineId: string;
  controller: ControllerData;
  spindle: SpindleData;
  axes: {
    x: AxisData;
    y: AxisData;
    z: AxisData;
    feedrate: number;
    feedrateOverride: number;
  };
  coolant: CoolantData;
  conditions: ConditionData;
  material: MaterialData;
}

export interface WebSocketMessage {
  type: 'telemetry' | 'command_result' | 'connection_status' | 'error';
  payload: CncTelemetry | CommandResult | ConnectionStatus | ErrorPayload;
}

export interface CommandResult {
  command: string;
  success: boolean;
  message: string;
}

export interface ConnectionStatus {
  connected: boolean;
  serverEndpoint: string;
  machineId: string;
}

export interface ErrorPayload {
  code: string;
  message: string;
}

// Execution state values matching MTConnect
export type ExecutionState =
  | 'READY'
  | 'ACTIVE'
  | 'INTERRUPTED'
  | 'FEED_HOLD'
  | 'STOPPED'
  | 'OPTIONAL_STOP'
  | 'PROGRAM_STOPPED'
  | 'PROGRAM_COMPLETED';

// Condition state values
export type ConditionState = 'NORMAL' | 'WARNING' | 'FAULT';

// Log entry for event display
export interface LogEntry {
  timestamp: Date;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
}

// Default telemetry for initial state
export function getDefaultTelemetry(): CncTelemetry {
  return {
    timestamp: new Date().toISOString(),
    machineId: 'CNC_007',
    controller: {
      execution: 'READY',
      program: '',
      block: 'N0000',
      emergencyStop: 'ARMED',
      partCount: 0,
      cycleTime: 0,
    },
    spindle: {
      speed: 0,
      load: 0,
      override: 100,
      temperature: 22,
      toolNumber: 0,
    },
    axes: {
      x: { position: 0, load: 0 },
      y: { position: 0, load: 0 },
      z: { position: 0, load: 0 },
      feedrate: 0,
      feedrateOverride: 100,
    },
    coolant: {
      flowRate: 0,
      temperature: 20,
    },
    conditions: {
      spindle: 'NORMAL',
      coolant: 'NORMAL',
      axes: 'NORMAL',
    },
    material: {
      currentPartId: '',
      workOrderId: '',
      trackInTime: '',
      trackOutResult: '',
      trackOutTime: '',
    },
  };
}
