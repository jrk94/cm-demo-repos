import { Component, inject, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { WebSocketService } from './features/cnc/services/websocket.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="flex flex-col h-screen overflow-hidden bg-cnc-dark text-white">

      <!-- Global top nav -->
      <nav class="flex-shrink-0 bg-cnc-blue border-b border-cnc-accent px-6 py-3 flex items-center gap-6">
        <!-- Brand -->
        <div class="flex items-center gap-3 mr-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-cnc-highlight" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="6" width="20" height="12" rx="2"/>
            <circle cx="12" cy="12" r="3"/>
            <line x1="12" y1="2" x2="12" y2="6"/>
            <line x1="12" y1="18" x2="12" y2="22"/>
          </svg>
          <span class="text-lg font-bold whitespace-nowrap">CNC OPC UA Simulator</span>
        </div>

        <!-- Nav links -->
        <a routerLink="/dashboard" routerLinkActive="nav-active"
           class="nav-link flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
          </svg>
          Dashboard
        </a>

        <a routerLink="/tags" routerLinkActive="nav-active"
           class="nav-link flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
          </svg>
          OPC UA Tags
        </a>

        <!-- Spacer -->
        <div class="flex-1"></div>

        <!-- Connection badge -->
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full"
               [ngClass]="wsConnected() ? 'bg-cnc-success' : 'bg-cnc-error'"></div>
          <span class="text-xs text-gray-400">
            {{ wsConnected() ? 'Simulator connected' : 'Simulator offline' }}
          </span>
        </div>
      </nav>

      <!-- Routed page content -->
      <div class="flex-1 overflow-hidden">
        <router-outlet></router-outlet>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; }

    .nav-link {
      @apply px-3 py-1.5 rounded text-sm text-gray-400 hover:text-white hover:bg-cnc-accent transition-colors;
    }
    .nav-active {
      @apply bg-cnc-accent text-white;
    }
  `]
})
export class AppComponent {
  private ws = inject(WebSocketService);
  readonly wsConnected = this.ws.connected;
}
