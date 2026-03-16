import { Injectable, signal, computed, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  CncTelemetry,
  WebSocketMessage,
  ConnectionStatus,
  CommandResult,
  LogEntry,
  getDefaultTelemetry,
} from '../models/cnc.models';

const WS_URL = 'ws://localhost:5000';
const RECONNECT_INTERVAL = 3000;
const MAX_LOG_ENTRIES = 100;

@Injectable({
  providedIn: 'root',
})
export class WebSocketService implements OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  // Signals for reactive state
  private readonly _telemetry = signal<CncTelemetry>(getDefaultTelemetry());
  private readonly _connected = signal<boolean>(false);
  private readonly _connectionStatus = signal<ConnectionStatus | null>(null);
  private readonly _logs = signal<LogEntry[]>([]);
  private readonly _lastCommandResult = signal<CommandResult | null>(null);

  // Computed signals for derived state
  readonly telemetry = this._telemetry.asReadonly();
  readonly connected = this._connected.asReadonly();
  readonly connectionStatus = this._connectionStatus.asReadonly();
  readonly logs = this._logs.asReadonly();
  readonly lastCommandResult = this._lastCommandResult.asReadonly();

  // Computed signals for specific telemetry values
  readonly executionState = computed(() => this._telemetry().controller.execution);
  readonly isRunning = computed(() => {
    const state = this._telemetry().controller.execution;
    return state === 'ACTIVE' || state === 'FEED_HOLD';
  });
  readonly spindleSpeed = computed(() => this._telemetry().spindle.speed);
  readonly isSpindleRunning = computed(() => this._telemetry().spindle.speed > 0);
  readonly hasAlarm = computed(() => {
    const conditions = this._telemetry().conditions;
    return (
      conditions.spindle === 'FAULT' ||
      conditions.coolant === 'FAULT' ||
      conditions.axes === 'FAULT'
    );
  });
  readonly hasWarning = computed(() => {
    const conditions = this._telemetry().conditions;
    return (
      conditions.spindle === 'WARNING' ||
      conditions.coolant === 'WARNING' ||
      conditions.axes === 'WARNING'
    );
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.connect();
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  connect(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    this.addLog('info', `Connecting to WebSocket server at ${WS_URL}...`);

    try {
      this.socket = new WebSocket(WS_URL);

      this.socket.onopen = () => {
        this._connected.set(true);
        this.addLog('success', 'Connected to WebSocket server');
      };

      this.socket.onmessage = (event: MessageEvent) => {
        this.handleMessage(event.data);
      };

      this.socket.onclose = () => {
        this._connected.set(false);
        this.addLog('warning', 'Disconnected from WebSocket server');
        this.scheduleReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.addLog('error', 'WebSocket connection error');
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.addLog('error', 'Failed to create WebSocket connection');
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this._connected.set(false);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      this.addLog('info', 'Attempting to reconnect...');
      this.connect();
    }, RECONNECT_INTERVAL);
  }

  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);

      switch (message.type) {
        case 'telemetry':
          this._telemetry.set(message.payload as CncTelemetry);
          break;

        case 'connection_status':
          const status = message.payload as ConnectionStatus;
          this._connectionStatus.set(status);
          if (status.connected) {
            this.addLog('success', `Connected to OPC UA server: ${status.serverEndpoint}`);
          } else {
            this.addLog('warning', `OPC UA server disconnected: ${status.serverEndpoint}`);
          }
          break;

        case 'command_result':
          const result = message.payload as CommandResult;
          this._lastCommandResult.set(result);
          this.addLog(
            result.success ? 'success' : 'error',
            `Command "${result.command}": ${result.message}`
          );
          break;

        case 'error':
          const error = message.payload as { code: string; message: string };
          this.addLog('error', `Error [${error.code}]: ${error.message}`);
          break;
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  // Commands
  startScenario(): void {
    this.sendCommand('start');
    this.addLog('info', 'Starting CNC scenario...');
  }

  stopScenario(): void {
    this.sendCommand('stop');
    this.addLog('info', 'Stopping CNC scenario...');
  }

  writeValue(nodeId: string, value: string | number | boolean): void {
    this.sendMessage({
      type: 'write',
      payload: { nodeId, value },
    });
  }

  requestTelemetry(): void {
    this.sendCommand('get_telemetry');
  }

  private sendCommand(type: string): void {
    this.sendMessage({ type, payload: {} });
  }

  private sendMessage(message: object): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      this.addLog('error', 'Cannot send message: WebSocket not connected');
    }
  }

  private addLog(type: LogEntry['type'], message: string): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      type,
      message,
    };

    this._logs.update((logs) => {
      const updated = [entry, ...logs];
      return updated.slice(0, MAX_LOG_ENTRIES);
    });
  }

  clearLogs(): void {
    this._logs.set([]);
  }
}
