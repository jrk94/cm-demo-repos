import { Component, computed, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { WebSocketService } from '../../services/websocket.service';
import { ConditionState } from '../../models/cnc.models';

@Component({
  selector: 'app-telemetry-panel',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  template: `
    <div class="telemetry-panel h-full overflow-y-auto">
      <!-- Axis Positions -->
      <div class="panel mb-4">
        <h3 class="panel-header">Axis Positions</h3>
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="telemetry-label">X Axis</span>
            <div class="text-right">
              <span class="telemetry-value text-cnc-highlight">{{ axes().x.position | number:'1.3-3' }}</span>
              <span class="text-gray-500 ml-1">mm</span>
            </div>
          </div>
          <div class="flex justify-between items-center">
            <span class="telemetry-label">Y Axis</span>
            <div class="text-right">
              <span class="telemetry-value text-cnc-success">{{ axes().y.position | number:'1.3-3' }}</span>
              <span class="text-gray-500 ml-1">mm</span>
            </div>
          </div>
          <div class="flex justify-between items-center">
            <span class="telemetry-label">Z Axis</span>
            <div class="text-right">
              <span class="telemetry-value text-blue-400">{{ axes().z.position | number:'1.3-3' }}</span>
              <span class="text-gray-500 ml-1">mm</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Spindle -->
      <div class="panel mb-4">
        <h3 class="panel-header">Spindle</h3>
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="telemetry-label">Speed</span>
            <div class="text-right">
              <span class="telemetry-value" [class.text-cnc-success]="spindle().speed > 0">
                {{ spindle().speed | number:'1.0-0' }}
              </span>
              <span class="text-gray-500 ml-1">RPM</span>
            </div>
          </div>
          <div class="flex justify-between items-center">
            <span class="telemetry-label">Load</span>
            <div class="text-right">
              <span class="telemetry-value" [class.text-cnc-warning]="spindle().load > 50" [class.text-cnc-error]="spindle().load > 80">
                {{ spindle().load | number:'1.1-1' }}
              </span>
              <span class="text-gray-500 ml-1">%</span>
            </div>
          </div>
          <div class="flex justify-between items-center">
            <span class="telemetry-label">Temperature</span>
            <div class="text-right">
              <span class="telemetry-value" [class.text-cnc-warning]="spindle().temperature > 50" [class.text-cnc-error]="spindle().temperature > 70">
                {{ spindle().temperature | number:'1.1-1' }}
              </span>
              <span class="text-gray-500 ml-1">&deg;C</span>
            </div>
          </div>
          <div class="flex justify-between items-center">
            <span class="telemetry-label">Tool</span>
            <span class="telemetry-value text-cnc-warning">T{{ spindle().toolNumber }}</span>
          </div>
        </div>
      </div>

      <!-- Machine Status -->
      <div class="panel mb-4">
        <h3 class="panel-header">Machine Status</h3>
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="telemetry-label">Execution</span>
            <span class="condition-badge" [ngClass]="executionBadgeClass()">
              {{ controller().execution }}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="telemetry-label">Feedrate</span>
            <div class="text-right">
              <span class="telemetry-value text-sm">{{ axes().feedrate | number:'1.0-0' }}</span>
              <span class="text-gray-500 ml-1">mm/min</span>
            </div>
          </div>
          <div class="flex justify-between items-center">
            <span class="telemetry-label">E-Stop</span>
            <span class="condition-badge" [ngClass]="controller().emergencyStop === 'ARMED' ? 'condition-normal' : 'condition-fault'">
              {{ controller().emergencyStop }}
            </span>
          </div>
        </div>
      </div>

      <!-- Active Program -->
      <div class="panel mb-4">
        <h3 class="panel-header">Active Program</h3>
        <div class="space-y-2">
          <div class="font-mono text-sm">
            <span class="text-gray-400">Program:</span>
            <span class="text-white ml-2">{{ controller().program || 'None' }}</span>
          </div>
          <div class="font-mono text-sm">
            <span class="text-gray-400">Block:</span>
            <span class="text-cnc-highlight ml-2">{{ controller().block }}</span>
          </div>
          <div class="font-mono text-sm">
            <span class="text-gray-400">Parts:</span>
            <span class="text-cnc-success ml-2">{{ controller().partCount }}</span>
          </div>
          <div class="font-mono text-sm">
            <span class="text-gray-400">Cycle Time:</span>
            <span class="text-white ml-2">{{ controller().cycleTime | number:'1.1-1' }}s</span>
          </div>
        </div>
      </div>

      <!-- Conditions -->
      <div class="panel mb-4">
        <h3 class="panel-header">Conditions</h3>
        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <span class="telemetry-label">Spindle</span>
            <span class="condition-badge" [ngClass]="getConditionClass(conditions().spindle)">
              {{ conditions().spindle }}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="telemetry-label">Coolant</span>
            <span class="condition-badge" [ngClass]="getConditionClass(conditions().coolant)">
              {{ conditions().coolant }}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="telemetry-label">Axes</span>
            <span class="condition-badge" [ngClass]="getConditionClass(conditions().axes)">
              {{ conditions().axes }}
            </span>
          </div>
        </div>
      </div>

      <!-- Coolant -->
      <div class="panel mb-4">
        <h3 class="panel-header">Coolant</h3>
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="telemetry-label">Flow Rate</span>
            <div class="text-right">
              <span class="telemetry-value text-blue-400">{{ coolant().flowRate | number:'1.1-1' }}</span>
              <span class="text-gray-500 ml-1">L/min</span>
            </div>
          </div>
          <div class="flex justify-between items-center">
            <span class="telemetry-label">Temperature</span>
            <div class="text-right">
              <span class="telemetry-value">{{ coolant().temperature | number:'1.1-1' }}</span>
              <span class="text-gray-500 ml-1">&deg;C</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Material Tracking -->
      @if (material().currentPartId) {
        <div class="panel">
          <h3 class="panel-header">Material Tracking</h3>
          <div class="space-y-2 font-mono text-sm">
            <div>
              <span class="text-gray-400">Part ID:</span>
              <span class="text-white ml-2">{{ material().currentPartId }}</span>
            </div>
            <div>
              <span class="text-gray-400">Work Order:</span>
              <span class="text-white ml-2">{{ material().workOrderId }}</span>
            </div>
            @if (material().trackInTime) {
              <div>
                <span class="text-gray-400">Track In:</span>
                <span class="text-cnc-success ml-2">{{ material().trackInTime }}</span>
              </div>
            }
            @if (material().trackOutResult) {
              <div>
                <span class="text-gray-400">Result:</span>
                <span class="ml-2" [ngClass]="material().trackOutResult === 'PASS' ? 'text-cnc-success' : 'text-cnc-error'">
                  {{ material().trackOutResult }}
                </span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .telemetry-panel {
      scrollbar-width: thin;
      scrollbar-color: var(--cnc-accent) var(--cnc-dark);
    }
  `]
})
export class TelemetryPanelComponent {
  private wsService = inject(WebSocketService);

  readonly telemetry = this.wsService.telemetry;
  readonly controller = computed(() => this.telemetry().controller);
  readonly spindle = computed(() => this.telemetry().spindle);
  readonly axes = computed(() => this.telemetry().axes);
  readonly coolant = computed(() => this.telemetry().coolant);
  readonly conditions = computed(() => this.telemetry().conditions);
  readonly material = computed(() => this.telemetry().material);

  executionBadgeClass(): string {
    const state = this.controller().execution;
    switch (state) {
      case 'ACTIVE':
        return 'condition-normal';
      case 'READY':
      case 'PROGRAM_COMPLETED':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/50';
      case 'INTERRUPTED':
      case 'STOPPED':
      case 'FEED_HOLD':
        return 'condition-warning';
      default:
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/50';
    }
  }

  getConditionClass(condition: ConditionState): string {
    switch (condition) {
      case 'NORMAL':
        return 'condition-normal';
      case 'WARNING':
        return 'condition-warning';
      case 'FAULT':
        return 'condition-fault';
      default:
        return 'condition-normal';
    }
  }
}
