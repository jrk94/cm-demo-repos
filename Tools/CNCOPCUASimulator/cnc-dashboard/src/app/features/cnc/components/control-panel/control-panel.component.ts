import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebSocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-control-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="control-panel panel">
      <h3 class="panel-header">Machine Control</h3>

      <!-- Connection Status -->
      <div class="mb-4 flex items-center gap-2">
        <div
          class="w-3 h-3 rounded-full"
          [ngClass]="connected() ? 'bg-cnc-success animate-pulse' : 'bg-cnc-error'"
        ></div>
        <span class="text-sm text-gray-400">
          {{ connected() ? 'Connected' : 'Disconnected' }}
        </span>
      </div>

      <!-- Control Buttons -->
      <div class="space-y-3">
        <!-- Start Button -->
        <button
          class="w-full btn-success flex items-center justify-center gap-2"
          [disabled]="!canStart()"
          (click)="startScenario()"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
          </svg>
          Start Scenario
        </button>

        <!-- Stop Button -->
        <button
          class="w-full btn-danger flex items-center justify-center gap-2"
          [disabled]="!canStop()"
          (click)="stopScenario()"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd" />
          </svg>
          Stop Scenario
        </button>
      </div>

      <!-- Machine State Display -->
      <div class="mt-6 pt-4 border-t border-cnc-accent">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-gray-400">Machine State</span>
          <span
            class="px-2 py-1 rounded text-xs font-semibold"
            [ngClass]="stateClass()"
          >
            {{ executionState() }}
          </span>
        </div>

        <!-- Status Indicators -->
        <div class="grid grid-cols-3 gap-2 mt-4">
          <div class="text-center">
            <div
              class="w-8 h-8 mx-auto rounded-full flex items-center justify-center"
              [ngClass]="spindleConditionClass()"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
              </svg>
            </div>
            <span class="text-xs text-gray-500 mt-1 block">Spindle</span>
          </div>
          <div class="text-center">
            <div
              class="w-8 h-8 mx-auto rounded-full flex items-center justify-center"
              [ngClass]="coolantConditionClass()"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.5 17a4.5 4.5 0 01-1.44-8.765 4.5 4.5 0 018.302-3.046 3.5 3.5 0 014.504 4.272A4 4 0 0115 17H5.5zm3.75-2.75a.75.75 0 001.5 0V9.66l1.95 2.1a.75.75 0 101.1-1.02l-3.25-3.5a.75.75 0 00-1.1 0l-3.25 3.5a.75.75 0 101.1 1.02l1.95-2.1v4.59z" clip-rule="evenodd" />
              </svg>
            </div>
            <span class="text-xs text-gray-500 mt-1 block">Coolant</span>
          </div>
          <div class="text-center">
            <div
              class="w-8 h-8 mx-auto rounded-full flex items-center justify-center"
              [ngClass]="axesConditionClass()"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
              </svg>
            </div>
            <span class="text-xs text-gray-500 mt-1 block">Axes</span>
          </div>
        </div>
      </div>

      <!-- Alarm Indicator -->
      @if (hasAlarm()) {
        <div class="mt-4 p-3 bg-cnc-error/20 border border-cnc-error rounded-lg animate-pulse">
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-cnc-error" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <span class="text-cnc-error font-semibold">ALARM ACTIVE</span>
          </div>
        </div>
      }

      @if (hasWarning() && !hasAlarm()) {
        <div class="mt-4 p-3 bg-cnc-warning/20 border border-cnc-warning rounded-lg">
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-cnc-warning" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <span class="text-cnc-warning font-semibold">WARNING</span>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ControlPanelComponent {
  private wsService = inject(WebSocketService);

  readonly connected = this.wsService.connected;
  readonly telemetry = this.wsService.telemetry;
  readonly executionState = this.wsService.executionState;
  readonly isRunning = this.wsService.isRunning;
  readonly hasAlarm = this.wsService.hasAlarm;
  readonly hasWarning = this.wsService.hasWarning;

  readonly canStart = computed(() => {
    const state = this.executionState();
    return this.connected() && (state === 'READY' || state === 'STOPPED' || state === 'PROGRAM_COMPLETED');
  });

  readonly canStop = computed(() => {
    const state = this.executionState();
    return this.connected() && (state === 'ACTIVE' || state === 'FEED_HOLD');
  });

  startScenario(): void {
    this.wsService.startScenario();
  }

  stopScenario(): void {
    this.wsService.stopScenario();
  }

  stateClass(): string {
    const state = this.executionState();
    switch (state) {
      case 'ACTIVE':
        return 'bg-cnc-success text-white';
      case 'READY':
        return 'bg-blue-500 text-white';
      case 'INTERRUPTED':
      case 'STOPPED':
      case 'FEED_HOLD':
        return 'bg-cnc-warning text-white';
      case 'PROGRAM_COMPLETED':
        return 'bg-cnc-success text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  }

  private getConditionColorClass(condition: string): string {
    switch (condition) {
      case 'NORMAL':
        return 'bg-cnc-success/20 text-cnc-success';
      case 'WARNING':
        return 'bg-cnc-warning/20 text-cnc-warning';
      case 'FAULT':
        return 'bg-cnc-error/20 text-cnc-error animate-pulse';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  }

  readonly spindleConditionClass = computed(() => {
    return this.getConditionColorClass(this.telemetry().conditions.spindle);
  });

  readonly coolantConditionClass = computed(() => {
    return this.getConditionColorClass(this.telemetry().conditions.coolant);
  });

  readonly axesConditionClass = computed(() => {
    return this.getConditionColorClass(this.telemetry().conditions.axes);
  });
}
