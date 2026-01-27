# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Connect IoT Protocol Driver** for the Critical Manufacturing MES platform. It's a TypeScript-based plugin that implements the UNS (Universal Network Services) Connector protocol for device communication via the Critical Manufacturing Automation framework.

## Build Commands

```bash
npm run build          # Compile TypeScript (src and tests)
npm run lint           # Run ESLint on all .ts files
npm run lint:fix       # Auto-fix ESLint violations
npm test               # Build and run tests (5s timeout)
npm run test:cover     # Run tests with coverage (Cobertura/LCOV)
npm run watch          # Continuous build + test with file watching
npm run packagePacker  # Bundle for deployment
```

## Running a Single Test

```bash
npx mocha test/integration/connection.test.js --timeout 5000 --exit
```

## Architecture

### Dependency Injection (Inversify)
The driver uses Inversify for DI. The child container in `src/inversify.config.ts` extends the parent container from `@criticalmanufacturing/connect-iot-driver`. Symbols are defined in `src/types.ts`.

### Core Components

- **`src/index.ts`** - CLI entry point using yargs. Parses arguments, initializes DI container, loads configuration, and starts the Driver Runner.
- **`src/driverImplementation.ts`** - Main driver class (`UNSConnectorDeviceDriver`) extending `DeviceDriverBase`. Implements device lifecycle methods: connect, disconnect, getValues, setValues, execute commands, and event registration.
- **`src/extensions/extensionHandler.ts`** - Handles WebSocket messages from the Controller for custom events and commands. Subscribes to topics like `connect.iot.driver.template.executeCommand`.
- **`src/extendedData/`** - Extended data interfaces and validators for Properties, Events, Commands, and their parameters.

### Communication State Machine
`Disconnected` → `Connecting` → `ConnectingFailed` → `Setup` → `Communicating` → `Disconnecting`

### Key Patterns
- All driver methods are async/await
- Configuration-driven: Properties, events, commands defined via configuration from Controller
- Template placeholders (`// ...`) indicate where to implement protocol-specific logic
- Value conversion methods (`convertValueFromDevice`/`convertValueToDevice`) for protocol-specific transformations

## CLI Arguments

Required:
- `--id`: Unique driver instance identifier

Optional:
- `--monitorPort` / `-mp`: WebSocket port for Monitor (required for runtime)
- `--monitorHost` / `-mh`: Monitor address (default: localhost)
- `--config`: Configuration file path (default: config.json)
- `--managerId`: Name of Automation Manager
- `--componentId`: Component ID of Automation Instance

## Testing

- Framework: Mocha + Chai (with chai-spies)
- Coverage: nyc generating Cobertura/LCOV reports
- Tests in `test/integration/`
- Output: `test/test-results.xml` (JUnit format), `coverage/` directory

## VS Code Debug Configurations

Launch configs available in `.vscode/launch.json`:
- **Start Manager**: Launch Automation Manager
- **Start Driver (UNS Connector)**: Debug driver with prompts for manager location, ID, instance name, and monitor port
