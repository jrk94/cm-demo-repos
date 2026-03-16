# CNC OPC UA Simulator Frontend

A modern Angular 19 frontend application that visualizes and controls a CNC machine simulator via OPC UA protocol.

## Architecture

```
cnc-dashboard/         # Angular 19 frontend application
└── src/
    └── app/
        ├── core/                    # Core module (guards, interceptors)
        ├── shared/                  # Shared components
        └── features/
            └── cnc/
                ├── components/
                │   ├── cnc-dashboard/       # Main dashboard layout
                │   ├── cnc-visualization/   # SVG CNC machine visualization
                │   ├── telemetry-panel/     # Real-time telemetry display
                │   ├── control-panel/       # Start/Stop controls
                │   └── event-log/           # Event log display
                ├── services/
                │   ├── websocket.service.ts # WebSocket communication
                │   └── animation.service.ts # Anime.js animations
                └── models/
                    └── cnc.models.ts        # TypeScript interfaces
```

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+
- Angular CLI 19 (`npm install -g @angular/cli@19`)
- The CNC OPC UA Simulator must be running

## Quick Start

### 1. Start the CNC Simulator

First, ensure the CNC OPC UA simulator is running:

```bash
cd C:\cmf\cm-demo-repos\Tools\CNCOPCUASimulator\cnc-opcua
dotnet run
```

The simulator will start an OPC UA server at `opc.tcp://localhost:4840`.

### 2. Start the Angular Frontend

Open another terminal and run:

```bash
cd C:\cmf\cm-demo-repos\Tools\CNCOPCUASimulator\cnc-dashboard

# Install dependencies
npm install

# Start development server
npm start
```

Open your browser and navigate to `http://localhost:4200`.

## Features

### CNC Machine Visualization
- Real-time SVG visualization of a 3-axis vertical machining center
- Animated spindle rotation based on actual RPM
- Axis position indicators with smooth interpolation
- Tool visualization with current tool number
- Coolant flow animation when active
- Work table with workpiece visualization

### Telemetry Panel
- X, Y, Z axis positions with color-coded display
- Spindle speed, load, and temperature monitoring
- Machine execution state (READY, ACTIVE, STOPPED, etc.)
- Feedrate and override values
- Active program and block number
- Part count and cycle time
- Condition monitoring (NORMAL, WARNING, FAULT)
- Coolant flow rate and temperature
- Material tracking (Part ID, Work Order, Track-in/out times)

### Control Panel
- **Start** button: Initiates the CNC scenario
- **Stop** button: Halts the current operation
- Connection status indicator
- Machine state display
- Condition status lights (Spindle, Coolant, Axes)
- Alarm and warning indicators

### Event Log
- Real-time event logging
- Color-coded entries (info, success, warning, error)
- Timestamped messages
- Clear button for log management

## OPC UA Node Structure

The simulator exposes the following OPC UA nodes (namespace 2):

### Controller
| Node ID | Description | Type |
|---------|-------------|------|
| `ns=2;s=cnc007.controller.execution` | Execution state | String |
| `ns=2;s=cnc007.controller.program` | Active NC program | String |
| `ns=2;s=cnc007.controller.block` | Current NC block | String |
| `ns=2;s=cnc007.controller.emergencyStop` | E-Stop status | String |
| `ns=2;s=cnc007.controller.partCount` | Parts produced | Int32 |
| `ns=2;s=cnc007.controller.cycleTime` | Cycle duration | Float |

### Spindle
| Node ID | Description | Type |
|---------|-------------|------|
| `ns=2;s=cnc007.spindle.speed` | Spindle speed (RPM) | Float |
| `ns=2;s=cnc007.spindle.load` | Spindle load (%) | Float |
| `ns=2;s=cnc007.spindle.override` | Speed override (%) | Float |
| `ns=2;s=cnc007.spindle.temperature` | Temperature (°C) | Float |
| `ns=2;s=cnc007.spindle.toolNumber` | Current tool | Int32 |

### Axes
| Node ID | Description | Type |
|---------|-------------|------|
| `ns=2;s=cnc007.axis.x.position` | X position (mm) | Float |
| `ns=2;s=cnc007.axis.x.load` | X load (%) | Float |
| `ns=2;s=cnc007.axis.y.position` | Y position (mm) | Float |
| `ns=2;s=cnc007.axis.y.load` | Y load (%) | Float |
| `ns=2;s=cnc007.axis.z.position` | Z position (mm) | Float |
| `ns=2;s=cnc007.axis.z.load` | Z load (%) | Float |
| `ns=2;s=cnc007.axis.feedrate` | Feedrate (mm/min) | Float |
| `ns=2;s=cnc007.axis.feedrateOverride` | Feed override (%) | Float |

### Conditions
| Node ID | Description | Type |
|---------|-------------|------|
| `ns=2;s=cnc007.condition.spindle` | Spindle condition | String |
| `ns=2;s=cnc007.condition.coolant` | Coolant condition | String |
| `ns=2;s=cnc007.condition.axes` | Axes condition | String |

Values: `NORMAL`, `WARNING`, `FAULT`

### Material Tracking
| Node ID | Description | Type |
|---------|-------------|------|
| `ns=2;s=cnc007.material.currentPartId` | Current part ID | String |
| `ns=2;s=cnc007.material.workOrderId` | Work order | String |
| `ns=2;s=cnc007.material.trackInTime` | Track-in time | String |
| `ns=2;s=cnc007.material.trackOutResult` | Track-out result | String |
| `ns=2;s=cnc007.material.trackOutTime` | Track-out time | String |

## REST API Endpoints

The OPC UA bridge exposes the following REST endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check with connection status |
| GET | `/api/telemetry` | Get current telemetry snapshot |
| GET | `/api/nodes` | List all available OPC UA nodes |
| POST | `/api/write` | Write value to an OPC UA node |
| POST | `/api/start` | Start the CNC scenario |
| POST | `/api/stop` | Stop the CNC scenario |

## WebSocket Protocol

Connect to `ws://localhost:3001` for real-time updates.

### Incoming Messages (Server → Client)

```typescript
// Telemetry update
{ type: 'telemetry', payload: CncTelemetry }

// Connection status
{ type: 'connection_status', payload: { connected: boolean, serverEndpoint: string, machineId: string } }

// Command result
{ type: 'command_result', payload: { command: string, success: boolean, message: string } }

// Error
{ type: 'error', payload: { code: string, message: string } }
```

### Outgoing Messages (Client → Server)

```typescript
// Start scenario
{ type: 'start', payload: {} }

// Stop scenario
{ type: 'stop', payload: {} }

// Write value
{ type: 'write', payload: { nodeId: string, value: any } }

// Request telemetry
{ type: 'get_telemetry', payload: {} }
```

## Technology Stack

### Frontend (Angular)
- Angular 19 with standalone components
- TypeScript 5.6
- RxJS 7.8
- Angular Signals for reactive state management
- Anime.js for smooth animations
- TailwindCSS 3.4 for styling

### Backend (Node.js Bridge)
- Node.js 18+
- TypeScript
- node-opcua for OPC UA client
- ws for WebSocket server
- Express for REST API

## Development

### Angular Frontend

```bash
cd cnc-dashboard

# Development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

### OPC UA Bridge

```bash
cd opcua-bridge

# Development with hot reload
npm run dev

# Build
npm run build

# Production
npm start
```

## Configuration

### Environment Variables

**OPC UA Bridge:**
- `PORT` - REST API port (default: 3000)
- `WS_PORT` - WebSocket port (default: 3001)
- `OPCUA_ENDPOINT` - OPC UA server endpoint (default: `opc.tcp://localhost:4840`)

## Troubleshooting

### Bridge cannot connect to OPC UA server
1. Ensure the CNC simulator is running
2. Check the OPC UA endpoint URL
3. Verify firewall settings allow port 4840

### WebSocket connection fails
1. Check if the bridge is running
2. Verify port 3001 is not blocked
3. Check browser console for CORS issues

### Animations not smooth
1. Check browser performance
2. Reduce telemetry update frequency if needed
3. Close other resource-intensive applications

## License

MIT License
