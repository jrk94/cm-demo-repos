# Deploying SemiSimulator to OpenShift

The image is built **in the cluster** from this folder's source (a binary build), and a single-replica Deployment runs
it. The MES address, client id and speed are plain environment variables; the personal access token is a Secret; the
line is `line.json` in a ConfigMap. All of it is configured through the `SEMISIM_` variables (see "Configuration" in
the [main README](../../README.md)).

## Deploy

```powershell
oc login --web --server=https://api.rhos.cm-mes.dev:6443        # the session expires: log in again when oc says Unauthorized
cd Tools/SemiSimulator
./deploy/openshift/deploy.ps1 -Project semisimulator -TokenFromAppSettings
oc logs -f deployment/semisimulator
```

[deploy.ps1](deploy.ps1) stages a clean copy of the source (**without `appsettings.json`**, so the token is never in the
image or the build context, and without the tests), creates the project when it doesn't exist, creates the Secret
`semisimulator` and the ConfigMap `semisimulator-line`, applies [build.yaml](build.yaml) and
[deployment.yaml](deployment.yaml), and starts the build. The Deployment has an image trigger, so it rolls out when
the build finishes.

- **Token:** `-TokenFromAppSettings` reads it from your local `appsettings.json`; otherwise `-Token`, the
  `SEMISIM_TOKEN` variable, or a prompt. It never appears on a command line or in the uploaded source.
- **Check what is built:** `./deploy/openshift/deploy.ps1 -StageOnly` stages the source and stops (no cluster needed).

## A cluster without an integrated registry (Docker Hub)

The default build pushes the image to the cluster's own registry. A cluster without one rejects the build with
`InvalidOutputReference: Output image could not be resolved` ("the integrated container image registry is not
configured"; `oc describe build semisimulator-1` shows it). The `rhos.cm-mes.dev` cluster is like that: its pods pull
from `proxy.criticalmanufacturing.io`. Push to Docker Hub instead:

```powershell
$env:DOCKERHUB_TOKEN = "<Docker Hub access token, read and write>"     # or leave it out: you are prompted
./deploy/openshift/deploy.ps1 -DockerHubUser <your-docker-hub-user> -TokenFromAppSettings
```

The build still runs in the cluster; it pushes `docker.io/<user>/semisimulator:latest` with the access token (not your
password: Docker Hub > Account settings > Personal access tokens), which the script keeps in the Secret
`semisimulator-registry` (the build pushes with it, the pods pull with it). The Deployment has no image trigger in this
mode, so the script restarts it once the image is pushed. Rendered without a cluster:
`./deploy/openshift/deploy.ps1 -DockerHubUser <user> -RenderOnly`.

- **Visibility:** a repository created by a push is public on a free account, so anyone could pull the image. It holds the
  application and `line.json`, never the MES token, but make the repository private in Docker Hub if you prefer (the pull
  secret is already set).
- **Another tag:** `-Tag v2`. Another registry: the same idea with its own server and credentials (not scripted).
- **A first attempt without `-DockerHubUser`** leaves a Deployment whose image can't be pulled, plus an unused ImageStream and
  a failed build. The next run updates the Deployment and removes the ImageStream; the failed build can be deleted with
  `oc delete build semisimulator-1`.

## Another simulator: name, line file, MES

`-Name` names the deployment and every object it creates:
- the Deployment, BuildConfig, ImageStream and Secret `<name>`;
- the ConfigMap `<name>-line`;
- the registry Secret `<name>-registry`;
- the pods' `app` label;
- with Docker Hub, the repository `docker.io/<user>/<name>`.

The default is `semisimulator`, which is what earlier deployments used. Several simulators, e.g. one per MES, can share a
project. `-LineFile` picks the line (relative to `Tools/SemiSimulator`), and `-EnvironmentAddress` the MES:

```powershell
./deploy/openshift/deploy.ps1 -Name indutech-sim -LineFile line.industrial.json `
    -EnvironmentAddress https://architectureandadvocacy.apps.rhos.cm-mes.dev -TokenFromAppSettings
oc logs -f deployment/indutech-sim
```

- **Name format:** lowercase letters, digits and `-`, at most 40 characters.
- **Line file in the pod:** whatever it is called, it is mounted as `/config/line.json`.
- **Commands below:** with another name, use `deployment/<name>` instead of `deployment/semisimulator`.
- **Same MES:** two simulators on the same MES compete for the same resources (see "Operating it").

## An existing project

Pass its name, or `oc project <name>` first and leave `-Project` out (it defaults to the project you are in):

```powershell
./deploy/openshift/deploy.ps1 -Project my-existing-project -TokenFromAppSettings
```

An existing project is used as it is. You need the `edit` role in it (to create the Secret, ConfigMap, BuildConfig,
ImageStream and Deployment). The script creates objects named `semisimulator` and `semisimulator-line` and says
beforehand which of them already exist, since applying updates them. Nothing else in the project is touched.

## Settings (deployment.yaml)

| Variable | Default | Meaning |
|---|---|---|
| `SEMISIM_ClientConfiguration__Connection__EnvironmentAddress` | the architectureandadvocacy-semi MES | The MES |
| `SEMISIM_ClientConfiguration__Authentication__SecurityAccessToken` | Secret `semisimulator`, key `access-token` | The token |
| `SEMISIM_Simulation__Speed` | `1` | Real-fab cadence; a faster demo: a larger number |
| `SEMISIM_Line__Order__MaxOrders` | `0` | 0: launches orders until stopped |
| `SEMISIM_Line__Startup__TerminatePreviousRuns` | `false` | `true`: terminate what earlier runs left, each time the pod starts. It terminates **every** simulator order of the MES, so only when this simulator owns it |
| `SEMISIM_LINE_FILE` | `/config/line.json` | The line (the ConfigMap) |

Any other `line.json` or `appsettings.json` value can be set the same way
(`SEMISIM_Line__Order__Products__2__Weight=0`); steps can't (their names contain spaces), so change those in the
line file.

## Operating it

- **Change the line or a setting:** edit `line.json`, run `deploy.ps1 -SkipBuild`, then
  `oc rollout restart deployment/semisimulator` (the simulator reads its configuration at startup).
  A single variable: `oc set env deployment/semisimulator SEMISIM_Simulation__Speed=20`.
- **New code:** run `deploy.ps1` again.
- **Expired token** (the pod crash-loops with an authentication error): `deploy.ps1 -SkipBuild -Token <new>`, then restart.
- **Stopping it:** scale to 0 (`oc scale deployment/semisimulator --replicas=0`). The pod gets 11 minutes to let the lots in
  progress finish their step. Killing it sooner leaves lots in process in the MES that block their resources; the next start
  with `TerminatePreviousRuns` cleans them up.
- **One simulator per MES:** the Deployment is `Recreate` with 1 replica on purpose. Two simulators on the same MES compete
  for the same resources and clean up each other's lots.

## Needs from the cluster

- The build reaches `mcr.microsoft.com` (base images) and the NuGet feeds in `nuget.config` (nuget.org and the CMF feed).
  Behind a proxy or a mirror, set the proxy on the BuildConfig or point `nuget.config` at the mirror.
- The pods reach the MES address (the same cluster here, so it does).
- It runs as an arbitrary user under the default `restricted` SCC; the image needs no privileges and writes no files.

## Checked

Not run against a cluster yet (the session was not logged in). Checked locally: `oc kustomize` renders the manifests; the
staged source contains no `appsettings.json` and no tests; `dotnet restore` and `dotnet publish SemiSimulator.csproj`
(the Dockerfile's commands) on the staged copy produce the app with `line.json`; and that output starts with environment
variables only, no `appsettings.json`.
