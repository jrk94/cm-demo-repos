import { Component, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { WebSocketService } from '../../services/websocket.service';
import { LogEntry } from '../../models/cnc.models';

@Component({
  selector: 'app-event-log',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="event-log panel h-full flex flex-col">
      <div class="flex justify-between items-center mb-4">
        <h3 class="panel-header mb-0 pb-0 border-b-0">Event Log</h3>
        <button
          class="text-xs text-gray-400 hover:text-white transition-colors"
          (click)="clearLogs()"
        >
          Clear
        </button>
      </div>

      <div class="flex-1 overflow-y-auto space-y-1 font-mono text-xs">
        @for (log of logs(); track log.timestamp) {
          <div
            class="p-2 rounded flex items-start gap-2"
            [ngClass]="getLogClass(log)"
          >
            <span class="text-gray-500 whitespace-nowrap">
              {{ log.timestamp | date:'HH:mm:ss' }}
            </span>
            <span [ngClass]="getLogIconClass(log)">
              @switch (log.type) {
                @case ('info') {
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                  </svg>
                }
                @case ('success') {
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                }
                @case ('warning') {
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                }
                @case ('error') {
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                }
              }
            </span>
            <span class="flex-1 break-words">{{ log.message }}</span>
          </div>
        } @empty {
          <div class="text-center text-gray-500 py-8">
            No events yet
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .event-log {
      scrollbar-width: thin;
      scrollbar-color: var(--cnc-accent) var(--cnc-dark);
    }
  `]
})
export class EventLogComponent {
  private wsService = inject(WebSocketService);

  readonly logs = this.wsService.logs;

  clearLogs(): void {
    this.wsService.clearLogs();
  }

  getLogClass(log: LogEntry): string {
    switch (log.type) {
      case 'info':
        return 'bg-blue-500/10';
      case 'success':
        return 'bg-cnc-success/10';
      case 'warning':
        return 'bg-cnc-warning/10';
      case 'error':
        return 'bg-cnc-error/10';
      default:
        return '';
    }
  }

  getLogIconClass(log: LogEntry): string {
    switch (log.type) {
      case 'info':
        return 'text-blue-400';
      case 'success':
        return 'text-cnc-success';
      case 'warning':
        return 'text-cnc-warning';
      case 'error':
        return 'text-cnc-error';
      default:
        return 'text-gray-400';
    }
  }
}
