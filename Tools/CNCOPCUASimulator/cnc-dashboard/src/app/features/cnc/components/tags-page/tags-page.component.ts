import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebSocketService } from '../../services/websocket.service';
import { CncTelemetry } from '../../models/cnc.models';

interface TagRow {
  nodeId: string;
  name: string;
  group: string;
  value: string | number;
  type: string;
  unit: string;
  changed: boolean; // flashes briefly on change
}

@Component({
  selector: 'app-tags-page',
  standalone: true,
  imports: [CommonModule, DecimalPipe, DatePipe, FormsModule],
  template: `
    <div class="h-full flex flex-col overflow-hidden bg-cnc-dark text-white">

      <!-- Sub-header -->
      <div class="flex-shrink-0 px-6 py-4 border-b border-cnc-accent flex items-center justify-between gap-4">
        <div>
          <h2 class="text-lg font-semibold">OPC UA Tag Browser</h2>
          <p class="text-xs text-gray-400 mt-0.5">
            Live values pushed directly from the .NET simulator via WebSocket
          </p>
        </div>

        <div class="flex items-center gap-3">
          <!-- Filter input -->
          <input
            type="text"
            [ngModel]="filterText()"
            (ngModelChange)="filterText.set($event)"
            placeholder="Filter tags…"
            class="bg-cnc-blue border border-cnc-accent rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cnc-highlight w-56"
          />

          <!-- Group filter -->
          <select
            [ngModel]="filterGroup()"
            (ngModelChange)="filterGroup.set($event)"
            class="bg-cnc-blue border border-cnc-accent rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cnc-highlight"
          >
            <option value="">All groups</option>
            @for (g of groups(); track g) {
              <option [value]="g">{{ g }}</option>
            }
          </select>

          <!-- Update timestamp -->
          <span class="text-xs text-gray-500 font-mono whitespace-nowrap">
            Last update: {{ lastTimestamp() | date:'HH:mm:ss.SSS' }}
          </span>
        </div>
      </div>

      <!-- Tag table -->
      <div class="flex-1 overflow-auto">
        <table class="w-full text-sm border-collapse">
          <thead class="sticky top-0 bg-cnc-blue z-10">
            <tr class="text-left text-xs text-gray-400 uppercase tracking-wider">
              <th class="px-4 py-3 border-b border-cnc-accent w-8">#</th>
              <th class="px-4 py-3 border-b border-cnc-accent cursor-pointer hover:text-white"
                  (click)="sort('group')">
                Group
                @if (sortField() === 'group') {
                  <span class="ml-1">{{ sortAsc() ? '↑' : '↓' }}</span>
                }
              </th>
              <th class="px-4 py-3 border-b border-cnc-accent cursor-pointer hover:text-white"
                  (click)="sort('name')">
                Tag Name
                @if (sortField() === 'name') {
                  <span class="ml-1">{{ sortAsc() ? '↑' : '↓' }}</span>
                }
              </th>
              <th class="px-4 py-3 border-b border-cnc-accent font-mono">Node ID</th>
              <th class="px-4 py-3 border-b border-cnc-accent cursor-pointer hover:text-white text-right"
                  (click)="sort('value')">
                Value
                @if (sortField() === 'value') {
                  <span class="ml-1">{{ sortAsc() ? '↑' : '↓' }}</span>
                }
              </th>
              <th class="px-4 py-3 border-b border-cnc-accent text-right">Unit</th>
              <th class="px-4 py-3 border-b border-cnc-accent">Type</th>
            </tr>
          </thead>
          <tbody>
            @for (tag of filteredTags(); track tag.nodeId; let i = $index) {
              <tr class="border-b border-cnc-accent/40 hover:bg-cnc-blue/60 transition-colors"
                  [class.bg-cnc-success_10]="tag.changed">
                <td class="px-4 py-2.5 text-gray-600 text-xs">{{ i + 1 }}</td>

                <!-- Group badge -->
                <td class="px-4 py-2.5">
                  <span class="px-2 py-0.5 rounded text-xs font-medium"
                        [ngClass]="groupColor(tag.group)">
                    {{ tag.group }}
                  </span>
                </td>

                <!-- Name -->
                <td class="px-4 py-2.5 font-mono text-gray-200">{{ tag.name }}</td>

                <!-- Node ID -->
                <td class="px-4 py-2.5 font-mono text-xs text-gray-500">{{ tag.nodeId }}</td>

                <!-- Value -->
                <td class="px-4 py-2.5 text-right font-mono"
                    [ngClass]="valueColor(tag)">
                  {{ formatValue(tag) }}
                </td>

                <!-- Unit -->
                <td class="px-4 py-2.5 text-right text-xs text-gray-500">{{ tag.unit }}</td>

                <!-- Type -->
                <td class="px-4 py-2.5">
                  <span class="px-1.5 py-0.5 rounded text-xs bg-cnc-accent/50 text-gray-400">
                    {{ tag.type }}
                  </span>
                </td>
              </tr>
            }

            @if (filteredTags().length === 0) {
              <tr>
                <td colspan="7" class="px-4 py-12 text-center text-gray-500">
                  No tags match the current filter
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Footer stats -->
      <div class="flex-shrink-0 px-6 py-2 border-t border-cnc-accent flex items-center gap-6 text-xs text-gray-500">
        <span>{{ filteredTags().length }} / {{ allTags().length }} tags</span>
        <span>OPC UA endpoint: opc.tcp://localhost:4840</span>
        <span>WebSocket: ws://localhost:5000</span>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .bg-cnc-success_10 {
      background-color: rgba(16, 185, 129, 0.08);
    }

    tr.bg-cnc-success_10 {
      animation: flash 0.5s ease-out;
    }

    @keyframes flash {
      0%   { background-color: rgba(16, 185, 129, 0.25); }
      100% { background-color: transparent; }
    }
  `]
})
export class TagsPageComponent {
  private ws = inject(WebSocketService);

  readonly filterText = signal('');
  readonly filterGroup = signal('');
  readonly sortField = signal<'group' | 'name' | 'value'>('group');
  readonly sortAsc = signal(true);

  // Track previous values to detect changes
  private prevValues = new Map<string, string | number>();

  readonly lastTimestamp = computed(() => {
    const ts = this.ws.telemetry().timestamp;
    return ts ? new Date(ts) : null;
  });

  readonly allTags = computed<TagRow[]>(() => {
    const t = this.ws.telemetry();
    return buildTagRows(t, this.prevValues);
  });

  readonly groups = computed(() =>
    [...new Set(this.allTags().map((t) => t.group))].sort()
  );

  readonly filteredTags = computed<TagRow[]>(() => {
    const text = this.filterText().toLowerCase();
    const group = this.filterGroup();
    const field = this.sortField();
    const asc = this.sortAsc();

    let rows = this.allTags().filter((t) => {
      const matchText =
        !text ||
        t.name.toLowerCase().includes(text) ||
        t.nodeId.toLowerCase().includes(text) ||
        String(t.value).toLowerCase().includes(text);
      const matchGroup = !group || t.group === group;
      return matchText && matchGroup;
    });

    rows = [...rows].sort((a, b) => {
      let av = field === 'value' ? Number(a.value) || a.value : a[field];
      let bv = field === 'value' ? Number(b.value) || b.value : b[field];
      if (av < bv) return asc ? -1 : 1;
      if (av > bv) return asc ? 1 : -1;
      return 0;
    });

    return rows;
  });

  sort(field: 'group' | 'name' | 'value'): void {
    if (this.sortField() === field) {
      this.sortAsc.update((v) => !v);
    } else {
      this.sortField.set(field);
      this.sortAsc.set(true);
    }
  }

  groupColor(group: string): string {
    const map: Record<string, string> = {
      Controller:  'bg-blue-500/20 text-blue-400',
      Spindle:     'bg-red-500/20 text-red-400',
      'Axis X':    'bg-pink-500/20 text-pink-400',
      'Axis Y':    'bg-emerald-500/20 text-emerald-400',
      'Axis Z':    'bg-sky-500/20 text-sky-400',
      Feedrate:    'bg-indigo-500/20 text-indigo-400',
      Coolant:     'bg-cyan-500/20 text-cyan-400',
      Conditions:  'bg-yellow-500/20 text-yellow-400',
      Material:    'bg-purple-500/20 text-purple-400',
    };
    return map[group] ?? 'bg-gray-500/20 text-gray-400';
  }

  valueColor(tag: TagRow): string {
    if (tag.group === 'Conditions') {
      if (tag.value === 'FAULT')   return 'text-cnc-error';
      if (tag.value === 'WARNING') return 'text-cnc-warning';
      return 'text-cnc-success';
    }
    if (tag.name === 'execution') {
      if (tag.value === 'ACTIVE' || tag.value === 'PROGRAM_COMPLETED') return 'text-cnc-success';
      if (tag.value === 'INTERRUPTED' || tag.value === 'STOPPED') return 'text-cnc-warning';
      return 'text-blue-400';
    }
    if (typeof tag.value === 'number' && tag.value !== 0) return 'text-cnc-highlight';
    if (typeof tag.value === 'number') return 'text-gray-400';
    return 'text-gray-200';
  }

  formatValue(tag: TagRow): string {
    if (typeof tag.value === 'number') {
      if (Number.isInteger(tag.value)) return tag.value.toString();
      return tag.value.toFixed(3);
    }
    return tag.value === '' ? '—' : String(tag.value);
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────

function row(
  nodeId: string,
  name: string,
  group: string,
  value: string | number,
  type: string,
  unit: string,
  prev: Map<string, string | number>
): TagRow {
  const changed = prev.has(nodeId) && prev.get(nodeId) !== value;
  prev.set(nodeId, value);
  return { nodeId, name, group, value, type, unit, changed };
}

function buildTagRows(t: CncTelemetry, prev: Map<string, string | number>): TagRow[] {
  return [
    // Controller
    row('ns=2;s=cnc007.controller.execution',    'execution',    'Controller', t.controller.execution,    'String', '',   prev),
    row('ns=2;s=cnc007.controller.program',      'program',      'Controller', t.controller.program,      'String', '',   prev),
    row('ns=2;s=cnc007.controller.block',        'block',        'Controller', t.controller.block,        'String', '',   prev),
    row('ns=2;s=cnc007.controller.emergencyStop','emergencyStop','Controller', t.controller.emergencyStop,'String', '',   prev),
    row('ns=2;s=cnc007.controller.partCount',    'partCount',    'Controller', t.controller.partCount,    'Int32',  'pcs',prev),
    row('ns=2;s=cnc007.controller.cycleTime',    'cycleTime',    'Controller', t.controller.cycleTime,    'Float',  's',  prev),

    // Spindle
    row('ns=2;s=cnc007.spindle.speed',       'speed',       'Spindle', t.spindle.speed,       'Float', 'RPM', prev),
    row('ns=2;s=cnc007.spindle.load',        'load',        'Spindle', t.spindle.load,        'Float', '%',   prev),
    row('ns=2;s=cnc007.spindle.override',    'override',    'Spindle', t.spindle.override,    'Float', '%',   prev),
    row('ns=2;s=cnc007.spindle.temperature', 'temperature', 'Spindle', t.spindle.temperature, 'Float', '°C',  prev),
    row('ns=2;s=cnc007.spindle.toolNumber',  'toolNumber',  'Spindle', t.spindle.toolNumber,  'Int32', '',    prev),

    // Axes X
    row('ns=2;s=cnc007.axis.x.position', 'position', 'Axis X', t.axes.x.position, 'Float', 'mm', prev),
    row('ns=2;s=cnc007.axis.x.load',     'load',     'Axis X', t.axes.x.load,     'Float', '%',  prev),

    // Axes Y
    row('ns=2;s=cnc007.axis.y.position', 'position', 'Axis Y', t.axes.y.position, 'Float', 'mm', prev),
    row('ns=2;s=cnc007.axis.y.load',     'load',     'Axis Y', t.axes.y.load,     'Float', '%',  prev),

    // Axes Z
    row('ns=2;s=cnc007.axis.z.position', 'position', 'Axis Z', t.axes.z.position, 'Float', 'mm', prev),
    row('ns=2;s=cnc007.axis.z.load',     'load',     'Axis Z', t.axes.z.load,     'Float', '%',  prev),

    // Feedrate
    row('ns=2;s=cnc007.axis.feedrate',         'feedrate',         'Feedrate', t.axes.feedrate,         'Float', 'mm/min', prev),
    row('ns=2;s=cnc007.axis.feedrateOverride', 'feedrateOverride', 'Feedrate', t.axes.feedrateOverride, 'Float', '%',      prev),

    // Coolant
    row('ns=2;s=cnc007.coolant.flowRate',    'flowRate',    'Coolant', t.coolant.flowRate,    'Float', 'L/min', prev),
    row('ns=2;s=cnc007.coolant.temperature', 'temperature', 'Coolant', t.coolant.temperature, 'Float', '°C',   prev),

    // Conditions
    row('ns=2;s=cnc007.condition.spindle', 'spindle', 'Conditions', t.conditions.spindle, 'String', '', prev),
    row('ns=2;s=cnc007.condition.coolant', 'coolant', 'Conditions', t.conditions.coolant, 'String', '', prev),
    row('ns=2;s=cnc007.condition.axes',    'axes',    'Conditions', t.conditions.axes,    'String', '', prev),

    // Material
    row('ns=2;s=cnc007.material.currentPartId',  'currentPartId',  'Material', t.material.currentPartId,  'String', '', prev),
    row('ns=2;s=cnc007.material.workOrderId',    'workOrderId',    'Material', t.material.workOrderId,    'String', '', prev),
    row('ns=2;s=cnc007.material.trackInTime',    'trackInTime',    'Material', t.material.trackInTime,    'String', '', prev),
    row('ns=2;s=cnc007.material.trackOutResult', 'trackOutResult', 'Material', t.material.trackOutResult, 'String', '', prev),
    row('ns=2;s=cnc007.material.trackOutTime',   'trackOutTime',   'Material', t.material.trackOutTime,   'String', '', prev),
  ];
}
