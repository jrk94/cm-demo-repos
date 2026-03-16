import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CncVisualizationComponent } from '../cnc-visualization/cnc-visualization.component';
import { TelemetryPanelComponent } from '../telemetry-panel/telemetry-panel.component';
import { ControlPanelComponent } from '../control-panel/control-panel.component';
import { EventLogComponent } from '../event-log/event-log.component';
import { WebSocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-cnc-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CncVisualizationComponent,
    TelemetryPanelComponent,
    ControlPanelComponent,
    EventLogComponent
  ],
  template: `
    <div class="cnc-dashboard h-full flex overflow-hidden">

      <!-- Left Panel: Control + Event Log -->
      <aside class="w-80 bg-cnc-dark border-r border-cnc-accent flex flex-col overflow-hidden">
        <div class="p-4 flex-shrink-0">
          <app-control-panel></app-control-panel>
        </div>
        <div class="flex-1 p-4 pt-0 overflow-hidden">
          <app-event-log class="h-full"></app-event-log>
        </div>
      </aside>

      <!-- Center: CNC Visualization -->
      <main class="flex-1 p-6 overflow-auto">
        <div class="h-full bg-cnc-blue rounded-lg border border-cnc-accent overflow-hidden">
          <app-cnc-visualization></app-cnc-visualization>
        </div>
      </main>

      <!-- Right Panel: Telemetry -->
      <aside class="w-80 bg-cnc-dark border-l border-cnc-accent p-4 overflow-hidden">
        <app-telemetry-panel></app-telemetry-panel>
      </aside>

    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
  `]
})
export class CncDashboardComponent {
  private wsService = inject(WebSocketService);
}
