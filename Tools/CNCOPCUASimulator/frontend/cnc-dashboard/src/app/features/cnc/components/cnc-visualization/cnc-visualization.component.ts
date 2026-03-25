import { Component, computed, effect, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebSocketService } from '../../services/websocket.service';
import { AnimationService } from '../../services/animation.service';

@Component({
  selector: 'app-cnc-visualization',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cnc-visualization-container relative w-full h-full min-h-[400px] bg-cnc-dark rounded-lg overflow-hidden">
      <svg
        viewBox="0 0 500 400"
        class="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <!-- Background Grid -->
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e3a5f" stroke-width="0.5"/>
          </pattern>
          <linearGradient id="metalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#5a6b7d"/>
            <stop offset="50%" style="stop-color:#4a5568"/>
            <stop offset="100%" style="stop-color:#3a4553"/>
          </linearGradient>
          <linearGradient id="tableGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#6b7b8d"/>
            <stop offset="100%" style="stop-color:#4a5a6d"/>
          </linearGradient>
          <linearGradient id="spindleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#e53e3e"/>
            <stop offset="100%" style="stop-color:#c53030"/>
          </linearGradient>
        </defs>

        <rect width="500" height="400" fill="url(#grid)"/>

        <!-- Machine Base/Frame -->
        <g class="machine-frame">
          <!-- Left Column -->
          <rect x="30" y="100" width="30" height="250" fill="url(#metalGradient)" stroke="#718096" stroke-width="2" rx="3"/>
          <!-- Right Column -->
          <rect x="440" y="100" width="30" height="250" fill="url(#metalGradient)" stroke="#718096" stroke-width="2" rx="3"/>
          <!-- Top Beam -->
          <rect x="30" y="80" width="440" height="30" fill="url(#metalGradient)" stroke="#718096" stroke-width="2" rx="3"/>
          <!-- Base -->
          <rect x="30" y="340" width="440" height="30" fill="url(#metalGradient)" stroke="#718096" stroke-width="2" rx="3"/>
        </g>

        <!-- Work Table (moves with Y axis) -->
        <g class="work-table" [attr.transform]="'translate(0, ' + (tableYOffset()) + ')'">
          <!-- Table Base -->
          <rect x="80" y="280" width="340" height="50" fill="url(#tableGradient)" stroke="#718096" stroke-width="1" rx="2"/>
          <!-- T-Slots -->
          <line x1="120" y1="295" x2="380" y2="295" stroke="#3a4553" stroke-width="3"/>
          <line x1="120" y1="310" x2="380" y2="310" stroke="#3a4553" stroke-width="3"/>
          <!-- Workpiece (if part loaded) -->
          @if (hasWorkpiece()) {
            <rect x="180" y="260" width="140" height="20" fill="#a0aec0" stroke="#718096" stroke-width="1" rx="1"/>
          }
        </g>

        <!-- Spindle Head Assembly (moves with X and Z) -->
        <g class="spindle-assembly" [attr.transform]="'translate(' + spindleX() + ', ' + spindleZ() + ')'">
          <!-- Spindle Housing -->
          <rect x="220" y="110" width="60" height="80" fill="url(#metalGradient)" stroke="#718096" stroke-width="2" rx="3"/>

          <!-- Spindle Motor -->
          <rect x="225" y="115" width="50" height="30" fill="#2d3748" stroke="#4a5568" stroke-width="1" rx="2"/>

          <!-- Spindle Nose (rotates) -->
          <g [attr.transform]="'rotate(' + spindleRotation() + ', 250, 200)'">
            <circle cx="250" cy="200" r="20" fill="url(#spindleGradient)" stroke="#c53030" stroke-width="2"/>
            <!-- Rotation indicator lines -->
            <line x1="250" y1="185" x2="250" y2="195" stroke="#fff" stroke-width="2"/>
            <line x1="265" y1="200" x2="255" y2="200" stroke="#fff" stroke-width="2"/>
          </g>

          <!-- Tool Holder -->
          <rect x="245" y="200" width="10" height="40" fill="#ed8936" stroke="#dd6b20" stroke-width="1" rx="1"/>

          <!-- Tool (Endmill) -->
          <polygon points="250,240 243,265 257,265" fill="#a0aec0" stroke="#718096" stroke-width="1"/>
        </g>

        <!-- Axis Labels -->
        <g class="axis-labels" font-family="JetBrains Mono, monospace" font-size="12" fill="#a0aec0">
          <!-- X Axis Arrow -->
          <g transform="translate(420, 380)">
            <line x1="0" y1="0" x2="40" y2="0" stroke="#e94560" stroke-width="2" marker-end="url(#arrowX)"/>
            <text x="45" y="4" fill="#e94560">X</text>
          </g>
          <!-- Y Axis Arrow -->
          <g transform="translate(20, 380)">
            <line x1="0" y1="0" x2="0" y2="-30" stroke="#10b981" stroke-width="2" marker-end="url(#arrowY)"/>
            <text x="-5" y="-35" fill="#10b981">Y</text>
          </g>
          <!-- Z Axis Arrow -->
          <g transform="translate(20, 100)">
            <line x1="0" y1="0" x2="0" y2="50" stroke="#3b82f6" stroke-width="2" marker-end="url(#arrowZ)"/>
            <text x="-5" y="65" fill="#3b82f6">Z</text>
          </g>
        </g>

        <!-- Arrow Markers -->
        <defs>
          <marker id="arrowX" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <path d="M0,0 L0,6 L9,3 z" fill="#e94560"/>
          </marker>
          <marker id="arrowY" markerWidth="10" markerHeight="10" refX="3" refY="9" orient="auto">
            <path d="M0,9 L6,9 L3,0 z" fill="#10b981"/>
          </marker>
          <marker id="arrowZ" markerWidth="10" markerHeight="10" refX="3" refY="0" orient="auto">
            <path d="M0,0 L6,0 L3,9 z" fill="#3b82f6"/>
          </marker>
        </defs>

        <!-- Status Indicator -->
        <g class="status-indicator" transform="translate(430, 20)">
          <circle
            cx="20"
            cy="20"
            r="12"
            [attr.fill]="statusColor()"
            [class.animate-pulse]="isRunning()"
          />
          <text x="20" y="50" text-anchor="middle" font-size="10" fill="#a0aec0">
            {{ executionState() }}
          </text>
        </g>

        <!-- Spindle Speed Indicator -->
        @if (isSpindleRunning()) {
          <g class="spindle-indicator" transform="translate(430, 80)">
            <text font-size="10" fill="#e94560" font-family="JetBrains Mono, monospace">
              <tspan x="0" y="0">SPINDLE</tspan>
              <tspan x="0" y="14">{{ spindleSpeed() | number:'1.0-0' }} RPM</tspan>
            </text>
          </g>
        }

        <!-- Coolant Flow Indicator -->
        @if (coolantFlowing()) {
          <g class="coolant-indicator">
            <!-- Coolant stream from spindle to workpiece -->
            <path
              d="M 250 270 Q 260 280 255 295 Q 250 310 260 320"
              fill="none"
              stroke="#60a5fa"
              stroke-width="2"
              stroke-dasharray="5,3"
              class="animate-pulse"
            />
          </g>
        }
      </svg>

      <!-- Position Display Overlay -->
      <div class="absolute bottom-4 left-4 bg-cnc-blue/90 rounded-lg p-3 font-mono text-sm">
        <div class="grid grid-cols-3 gap-4">
          <div>
            <span class="text-gray-400">X:</span>
            <span class="text-cnc-highlight ml-1">{{ xPosition() | number:'1.3-3' }}</span>
          </div>
          <div>
            <span class="text-gray-400">Y:</span>
            <span class="text-cnc-success ml-1">{{ yPosition() | number:'1.3-3' }}</span>
          </div>
          <div>
            <span class="text-gray-400">Z:</span>
            <span class="text-blue-400 ml-1">{{ zPosition() | number:'1.3-3' }}</span>
          </div>
        </div>
      </div>

      <!-- Tool Info Overlay -->
      @if (currentTool() > 0) {
        <div class="absolute top-4 left-4 bg-cnc-blue/90 rounded-lg p-3 font-mono text-sm">
          <span class="text-gray-400">Tool:</span>
          <span class="text-cnc-warning ml-1">T{{ currentTool() }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .cnc-visualization-container {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    }

    @keyframes coolant-flow {
      0% { stroke-dashoffset: 0; }
      100% { stroke-dashoffset: -16; }
    }

    .coolant-indicator path {
      animation: coolant-flow 0.5s linear infinite;
    }
  `]
})
export class CncVisualizationComponent implements OnInit, OnDestroy {
  private wsService = inject(WebSocketService);
  private animationService = inject(AnimationService);

  // Machine state from telemetry
  readonly telemetry = this.wsService.telemetry;
  readonly executionState = computed(() => this.telemetry().controller.execution);
  readonly isRunning = this.wsService.isRunning;
  readonly isSpindleRunning = this.wsService.isSpindleRunning;
  readonly spindleSpeed = computed(() => this.telemetry().spindle.speed);

  // Position signals
  readonly xPosition = computed(() => this.telemetry().axes.x.position);
  readonly yPosition = computed(() => this.telemetry().axes.y.position);
  readonly zPosition = computed(() => this.telemetry().axes.z.position);

  // Tool and material
  readonly currentTool = computed(() => this.telemetry().spindle.toolNumber);
  readonly hasWorkpiece = computed(() => !!this.telemetry().material.currentPartId);
  readonly coolantFlowing = computed(() => this.telemetry().coolant.flowRate > 0);

  // Animation state
  readonly spindleRotation = this.animationService.spindleRotation;

  // SVG position calculations
  readonly spindleX = computed(() => {
    const x = this.xPosition();
    // Map 0-300mm to -50 to 50 SVG units for spindle X offset
    return ((x / 300) * 100) - 50;
  });

  readonly spindleZ = computed(() => {
    const z = this.zPosition();
    // Map -80 to 0mm to 0 to 80 SVG units (inverted, negative Z means down)
    return Math.abs(z);
  });

  readonly tableYOffset = computed(() => {
    const y = this.yPosition();
    // Map 0-200mm to -20 to 20 SVG units for table Y offset
    return ((y / 200) * 40) - 20;
  });

  // Status color based on execution state and conditions
  readonly statusColor = computed(() => {
    const conditions = this.telemetry().conditions;
    if (conditions.spindle === 'FAULT' || conditions.coolant === 'FAULT' || conditions.axes === 'FAULT') {
      return '#ef4444'; // Red for fault
    }
    if (conditions.spindle === 'WARNING' || conditions.coolant === 'WARNING' || conditions.axes === 'WARNING') {
      return '#f59e0b'; // Yellow for warning
    }
    const state = this.executionState();
    switch (state) {
      case 'ACTIVE':
        return '#10b981'; // Green for active
      case 'READY':
        return '#3b82f6'; // Blue for ready
      case 'INTERRUPTED':
      case 'STOPPED':
        return '#f59e0b'; // Yellow for stopped/interrupted
      case 'PROGRAM_COMPLETED':
        return '#10b981'; // Green for completed
      default:
        return '#6b7280'; // Gray for other states
    }
  });

  constructor() {
    // Effect to sync spindle animation with telemetry
    effect(() => {
      const speed = this.spindleSpeed();
      if (speed > 0) {
        this.animationService.startSpindleRotation(speed);
      } else {
        this.animationService.stopSpindleRotation();
      }
    });

    // Effect to animate position changes
    effect(() => {
      const x = this.xPosition();
      const y = this.yPosition();
      const z = this.zPosition();
      const feedrate = this.telemetry().axes.feedrate;

      this.animationService.animateToPosition(x, y, z, feedrate > 0 ? 200 : 100);
    });
  }

  ngOnInit(): void {
    // Component initialized
  }

  ngOnDestroy(): void {
    this.animationService.reset();
  }
}
