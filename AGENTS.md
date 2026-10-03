# AGENTS.md

This workspace contains multiple Critical Manufacturing CLI project demo repositories. Use this file for quick orientation, then follow the linked repo docs for details.

## Scope

- Applies to the full workspace rooted at [README.md](README.md).
- Prefer repository-local docs before making assumptions.

## Start Here

- Workspace root: [README.md](README.md)
- Representative integration repos:
  - [Agentic/README.md](Agentic/README.md)
  - [SMTLine/README.md](SMTLine/README.md)
  - [Python/README.md](Python/README.md)
  - [3DPrinter-Integration/README.md](3DPrinter-Integration/README.md)
- Frontend/tooling example with concrete commands:
  - [Tools/CNCOPCUASimulator/README.md](Tools/CNCOPCUASimulator/README.md)

## Workspace Conventions

- Most repos include:
  - `cmfpackage.json` for package metadata and dependencies
  - `global.json` for .NET SDK pinning
  - `NuGet.Config` for package feeds
- Common folder boundaries:
  - `Cmf.Custom.Business/` for orchestration/services/common business logic
  - `Cmf.Custom.IoT/` for IoT drivers and protocol integrations
  - `Cmf.Custom.Data/` for DEEs and master data
  - `Cmf.Custom.MESProject.HTML/` for Angular UI customizations
  - `Tools/` for simulators and local test tooling

## Build And Test Baseline

Run commands from the target repo folder unless a README says otherwise.

- .NET baseline:
  - `dotnet restore`
  - `dotnet build`
  - `dotnet test` (only where test projects exist)
  - `dotnet run` (for tool/simulator repos)
- Node/Angular baseline (where `package.json` exists):
  - `npm install`
  - `npm run build`
  - `npm test` (if defined)
  - `npm start` (for local UI/dev servers)

For concrete frontend and simulator run flows, use [Tools/CNCOPCUASimulator/README.md](Tools/CNCOPCUASimulator/README.md).

## Environment Requirements

- .NET SDK is pinned per repo, commonly 8.0.309 with roll-forward; verify in each repo `global.json`.
- NuGet feeds are configured per repo; example in [Agentic/NuGet.Config](Agentic/NuGet.Config).
- CMF/MES-connected tools may require valid JWT/auth settings in `appsettings.json`; check repo/tool docs before running integration scenarios.

## Agent Working Rules

- Link, do not copy: prefer referencing repo docs instead of duplicating procedures.
- Keep changes scoped to one repo unless explicitly asked to do cross-repo work.
- Before editing, identify the owning layer (`Business`, `IoT`, `Data`, `HTML`, `Tools`) and keep boundaries intact.
- Validate with the smallest relevant command set (build/test/lint) near changed code.
- For protocol drivers, use package scripts first (`build`, `test`, `lint`, `watch`) as documented in local driver docs.

## Frequent Pitfalls

- Wrong working directory when running commands in this multi-repo workspace.
- Missing private feed/auth configuration causing NuGet restore failures.
- Expired or environment-specific security tokens in simulator/tool configs.
- Port conflicts when running simulators and frontends together.

## If Instructions Are Missing

- Check the nearest `README.md` in the repo/subproject.
- If still unclear, ask for the target repo name and intended scenario before broad changes.
