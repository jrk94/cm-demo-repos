# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Industrial Equipment Simulator - A .NET 8.0 console application that simulates manufacturing equipment scenarios for testing CMF (Critical Manufacturing) MES platform integration. It generates realistic manufacturing events including production orders, material tracking, and defect detection with image uploads.

### Development Context

This is a **testing/simulation tool** designed to generate realistic data against an external MES environment. As such:
- Hardcoded values (resource names, product IDs, step names) are expected and intentional - they match the target environment's master data
- The partial class pattern for ScenarioRunner prioritizes quick iteration over strict architectural purity
- Scenarios are meant to be easily modified or duplicated for different test cases
- Production-grade patterns (extensive error handling, abstractions, DI everywhere) are deliberately minimal to keep the tool lightweight and readable

## Build and Run Commands

```bash
# Build
dotnet build

# Run with default settings
dotnet run

# Run with parameters
dotnet run -- --speed 10 --defectprobability 0.8
```

**CLI Arguments:**
- `--speed` / `-s`: Execution speed multiplier (decimal, default 100)
- `--defectprobability` / `-d`: Probability of defect occurrence (0-1, default 0.8)

## Architecture

### Entry Point Flow
`Program.cs` → Initializes DI container and configuration → Creates `ScenarioRunner` → Executes manufacturing scenarios

### Key Components

**ScenarioRunner (Partial Class):** Main orchestrator split across multiple files by production line:
- `ScenarioRunner.cs` - Async runner loop with keyboard cancellation ('q' to quit)
- `ScenarioRunner.MetalPlate.cs` - Metal Plate production line (currently active)
- `ScenarioRunner.CoilCopper.cs` - Coil Copper production
- `ScenarioRunner.Electric.cs` - Electric component production
- `ScenarioRunner.Foam.cs` - Foam material production
- `ScenarioRunner.FinalAssembly.cs` - Final assembly process
- `ScenarioRunner.OrderPreparation.cs` - Order & lot creation
- `ScenarioRunner.Utilities.cs` - Material tracking, validation, resource management
- `ScenarioRunner.Configurations.cs` - State model definitions

**Services:**
- `TokenService` - JWT authentication and token refresh via OAuth2
- `EventsService` - Defect characteristics with image upload support

### Production Flow Pattern
Each scenario follows: Production Order → Lot Creation → Pipeline Processing

```csharp
ProcessPipeline(lot, executionSteps, speed)
// executionSteps: Func<Material, decimal, Task<Material>>[]
```

### State Models
`_stateModel` dictionary maps SEMI standards (SEMIE10, SEMIE58, etc.) for equipment state transitions during material tracking operations.

## Configuration

**appsettings.json:** Contains CMF MES client configuration with:
- HostAddress, ClientTenantName, ClientId
- JWT tokens for authentication
- SecurityPortalBaseAddress

**DefectImages/:** Pre-generated PNG images for defect injection (White/Grey colors with Light/Mild/Heavy scratch severity).

## Integration Points

- CMF MES Platform APIs (material, resource, order management)
- CFX (Connected Factory Exchange) protocol for equipment communication
- OAuth2 token endpoint for authentication
- File upload API for defect images
