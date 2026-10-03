<#
.SYNOPSIS
  Builds the SemiSimulator image in an OpenShift cluster and deploys it.

.DESCRIPTION
  Run it after "oc login". It
    1. stages a clean copy of the source (no appsettings.json with the token, no tests),
    2. creates (or selects) the project,
    3. creates the Secret with the MES access token and the ConfigMap with the line file,
    4. applies the build and the deployment (deploy/openshift/*.yaml, renamed to -Name),
    5. builds the image in the cluster from the staged source and rolls the Deployment out.

  Every object is named after -Name (default "semisimulator"): the Deployment, BuildConfig, ImageStream and Secret
  <name>, the ConfigMap <name>-line and the registry Secret <name>-registry. Several simulators (e.g. one per MES) can
  so live in the same project.

  Where the image goes:
    - the cluster's integrated registry (the default), when the cluster has one;
    - Docker Hub, with -DockerHubUser: for a cluster without an integrated registry. The build still runs in the
      cluster and pushes to docker.io/<user>/<name> with the credentials you give, kept in a Secret.

.PARAMETER Name
  Name of the deployment and of every object it creates. Lowercase letters, digits and '-' (a DNS label), at most 40
  characters. Default: semisimulator.

.PARAMETER LineFile
  The line file the simulator runs, relative to the SemiSimulator folder (e.g. line.industrial.json). Default: line.json.

.PARAMETER EnvironmentAddress
  The MES address. Default: the one in deployment.yaml (the architectureandadvocacy-semi MES).

.PARAMETER Project
  OpenShift project (namespace). An existing one is used as it is; one that does not exist is created. Without it: the
  project you are in now ("oc project"), else -Name.

.PARAMETER Token
  The MES personal access token. Without it: the SEMISIM_TOKEN environment variable, then -TokenFromAppSettings, then a prompt.
  It is never printed, and never part of the uploaded source.

.PARAMETER TokenFromAppSettings
  Read the token from the local appsettings.json (the one you run the simulator with locally).

.PARAMETER DockerHubUser
  Push the image to docker.io/<DockerHubUser>/<name> (see above).

.PARAMETER DockerHubToken
  A Docker Hub access token with read and write permission (Account settings > Personal access tokens). Without it: the
  DOCKERHUB_TOKEN environment variable, then a prompt. Not your password.

.PARAMETER Tag
  Image tag with -DockerHubUser. Default: latest.

.PARAMETER RenderOnly
  Only render the manifests that would be applied (no cluster needed).

.PARAMETER StageOnly
  Only stage the source and print where; no cluster needed. Handy to check what the image is built from.

.PARAMETER SkipBuild
  Apply the configuration, but don't build (e.g. only the line file or the settings changed).
#>
param(
    [string]$Name = "semisimulator",
    [string]$LineFile = "line.json",
    [string]$EnvironmentAddress,
    [string]$Project,
    [string]$Token,
    [switch]$TokenFromAppSettings,
    [string]$DockerHubUser,
    [string]$DockerHubToken,
    [string]$Tag = "latest",
    [switch]$RenderOnly,
    [switch]$StageOnly,
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

# The name becomes object names and a label value: a DNS label, short enough for the "-registry" suffix
if ($Name -notmatch '^[a-z0-9]([-a-z0-9]*[a-z0-9])?$' -or $Name.Length -gt 40) {
    throw "-Name '$Name' must be lowercase letters, digits and '-', start and end with a letter or digit, and be at most 40 characters"
}

$root = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
$manifests = $PSScriptRoot
$external = [bool]$DockerHubUser
$image = if ($external) { "docker.io/$DockerHubUser/$Name" } else { $null }
$lineName = "$Name-line"
$registrySecret = "$Name-registry"
$linePath = Join-Path $root $LineFile
if (-not (Test-Path $linePath)) { throw "Line file '$LineFile' not found in $root" }

function Invoke-Oc {
    & oc @args
    if ($LASTEXITCODE -ne 0) { throw "oc $($args -join ' ') failed (exit code $LASTEXITCODE)" }
}

# The manifests to apply: build.yaml and deployment.yaml with every "semisimulator" (object names, ConfigMap and Secret
# references, the app label, the ImageStream tag) replaced by -Name, and the MES address replaced by -EnvironmentAddress.
# For an external registry also the image repository, the push and pull secret, and no ImageStream or image trigger
# (which belong to the integrated registry)
function New-Manifests {
    $overlay = Join-Path ([IO.Path]::GetTempPath()) "$Name-manifests"
    if (Test-Path $overlay) { Remove-Item $overlay -Recurse -Force }
    New-Item -ItemType Directory -Path $overlay | Out-Null
    foreach ($file in "build.yaml", "deployment.yaml") {
        $yaml = (Get-Content (Join-Path $manifests $file) -Raw) -replace '\bsemisimulator\b', $Name
        if ($EnvironmentAddress -and $file -eq "deployment.yaml") {
            $yaml = $yaml -replace '(?m)(name: SEMISIM_ClientConfiguration__Connection__EnvironmentAddress\s*\r?\n\s*value: ).*$', "`${1}$EnvironmentAddress"
        }
        [IO.File]::WriteAllText((Join-Path $overlay $file), ($yaml -replace "`r`n", "`n"))
    }

    $kustomization = @'
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - build.yaml
  - deployment.yaml
'@
    if ($external) {
        $kustomization += @'

images:
  - name: @NAME@
    newName: @IMAGE@
    newTag: "@TAG@"
patches:
  - target:
      kind: ImageStream
      name: @NAME@
    patch: |-
      $patch: delete
      apiVersion: image.openshift.io/v1
      kind: ImageStream
      metadata:
        name: @NAME@
  - target:
      kind: BuildConfig
      name: @NAME@
    patch: |-
      apiVersion: build.openshift.io/v1
      kind: BuildConfig
      metadata:
        name: @NAME@
      spec:
        output:
          to:
            kind: DockerImage
            name: @IMAGE@:@TAG@
          pushSecret:
            name: @SECRET@
  - target:
      kind: Deployment
      name: @NAME@
    patch: |-
      - op: remove
        path: /metadata/annotations/image.openshift.io~1triggers
  - target:
      kind: Deployment
      name: @NAME@
    patch: |-
      apiVersion: apps/v1
      kind: Deployment
      metadata:
        name: @NAME@
      spec:
        template:
          spec:
            imagePullSecrets:
              - name: @SECRET@
'@
    }
    $kustomization = $kustomization.Replace("@NAME@", $Name).Replace("@IMAGE@", "$image").Replace("@TAG@", $Tag).Replace("@SECRET@", $registrySecret)
    [IO.File]::WriteAllText((Join-Path $overlay "kustomization.yaml"), ($kustomization -replace "`r`n", "`n"))
    return $overlay
}

if ($RenderOnly) {
    & oc kustomize (New-Manifests)
    return
}

# 1. A clean copy of the source: the build context is what the image is built from, so keep the token and the tests out
$stage = Join-Path ([IO.Path]::GetTempPath()) "$Name-src"
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Path $stage | Out-Null
robocopy $root $stage /E /XD bin obj .vs .vscode .claude .github .git Tests deploy "master data" scratch /XF "appsettings*.json" "*.user" "*.md" /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) { throw "Staging the source failed (robocopy exit code $LASTEXITCODE)" }
$global:LASTEXITCODE = 0
if (Get-ChildItem $stage -Recurse -Filter "appsettings*.json") { throw "appsettings.json is in the staged source: it holds the token" }
# The repository is CRLF; the Docker build reads these two with LF
foreach ($file in "Dockerfile", ".dockerignore") {
    $path = Join-Path $stage $file
    [IO.File]::WriteAllText($path, ((Get-Content $path -Raw) -replace "`r`n", "`n"))
}
Write-Host "Staged the source in $stage ($((Get-ChildItem $stage -Recurse -File | Measure-Object).Count) files)"
if ($StageOnly) { return }

# 2. Logged in? Project
$user = (& oc whoami 2>&1)
if ($LASTEXITCODE -ne 0) { throw "Not logged in to OpenShift ($user). Run: oc login --web --server=<api url>" }
Write-Host "Logged in as $user on $(& oc whoami --show-server)"
if (-not $Project) {
    $Project = (& oc project -q 2>$null)
    if ($LASTEXITCODE -ne 0 -or -not $Project) { $Project = $Name }
}
& oc get project $Project 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Project '$Project' does not exist: creating it"
    Invoke-Oc new-project $Project
} else {
    Write-Host "Using the existing project '$Project'"
    Invoke-Oc project $Project

    # This deploys objects named $Name / $Name-line: applying them updates any that already exist
    $existing = @("imagestream/$Name", "buildconfig/$Name", "deployment/$Name", "secret/$Name", "secret/$registrySecret", "configmap/$lineName") |
        Where-Object { & oc get $_ -o name 2>$null; $LASTEXITCODE -eq 0 }
    $global:LASTEXITCODE = 0
    if ($existing) {
        Write-Host "Already in '$Project', and updated by this deployment: $($existing -join ', ')"
    }
}
Write-Host "Deploying '$Name' with the line $LineFile$(if ($EnvironmentAddress) { " against $EnvironmentAddress" })"

# 3. Secret (token) and ConfigMap (line file, mounted as /config/line.json)
if (-not $Token) { $Token = $env:SEMISIM_TOKEN }
if (-not $Token -and $TokenFromAppSettings) {
    $settings = Get-Content (Join-Path $root "appsettings.json") -Raw | ConvertFrom-Json
    $Token = $settings.ClientConfiguration.Authentication.SecurityAccessToken
}
if (-not $Token) {
    $secure = Read-Host "MES personal access token" -AsSecureString
    $Token = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
}
if (-not $Token) { throw "No access token" }

$tokenFile = Join-Path ([IO.Path]::GetTempPath()) "$Name-token"
try {
    # From a file, not --from-literal: the token must not show in the process list
    [IO.File]::WriteAllText($tokenFile, $Token.Trim())
    & oc create secret generic $Name --from-file=access-token=$tokenFile --dry-run=client -o yaml | & oc apply -f -
    if ($LASTEXITCODE -ne 0) { throw "Creating the secret failed" }
} finally {
    Remove-Item $tokenFile -Force -ErrorAction SilentlyContinue
}

# The repository's line files have a BOM and CRLF, which oc would store as an unreadable escaped string: a clean copy.
# Whatever the file is called, the key is line.json (the Deployment reads /config/line.json)
$cleanLine = Join-Path ([IO.Path]::GetTempPath()) "$Name-line.json"
$lineJson = (Get-Content $linePath -Raw -Encoding UTF8).TrimStart([char]0xFEFF) -replace "`r`n", "`n"
[IO.File]::WriteAllText($cleanLine, $lineJson, (New-Object Text.UTF8Encoding($false)))
try {
    # One quoted argument: --from-file=line.json=(Join-Path ...) would be split in two by PowerShell
    & oc create configmap $lineName "--from-file=line.json=$cleanLine" --dry-run=client -o yaml | & oc apply -f -
} finally {
    Remove-Item $cleanLine -Force -ErrorAction SilentlyContinue
}
if ($LASTEXITCODE -ne 0) { throw "Creating the line ConfigMap failed" }

# The registry credential: the build pushes with it, the pods pull with it
if ($external) {
    if (-not $DockerHubToken) { $DockerHubToken = $env:DOCKERHUB_TOKEN }
    if (-not $DockerHubToken) {
        $secure = Read-Host "Docker Hub access token for $DockerHubUser (read and write)" -AsSecureString
        $DockerHubToken = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
    }
    if (-not $DockerHubToken) { throw "No Docker Hub token" }

    $authFile = Join-Path ([IO.Path]::GetTempPath()) "$Name-dockerconfig.json"
    try {
        $auth = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("${DockerHubUser}:$($DockerHubToken.Trim())"))
        $dockerConfig = @{ auths = @{ "https://index.docker.io/v1/" = @{ username = $DockerHubUser; password = $DockerHubToken.Trim(); auth = $auth } } } | ConvertTo-Json -Depth 5
        [IO.File]::WriteAllText($authFile, $dockerConfig, (New-Object Text.UTF8Encoding($false)))
        & oc create secret generic $registrySecret --type=kubernetes.io/dockerconfigjson "--from-file=.dockerconfigjson=$authFile" --dry-run=client -o yaml | & oc apply -f -
        if ($LASTEXITCODE -ne 0) { throw "Creating the registry secret failed" }
    } finally {
        Remove-Item $authFile -Force -ErrorAction SilentlyContinue
    }

    # A first attempt may have left the integrated-registry ImageStream behind: nothing uses it now
    & oc delete imagestream $Name --ignore-not-found 2>&1 | Out-Null
    $global:LASTEXITCODE = 0
}

# 4. Build and deployment
Invoke-Oc apply -k (New-Manifests)

# 5. Build the image from the staged source. With the integrated registry the image trigger on the Deployment rolls it
# out; with Docker Hub there is no trigger, so roll it out once the build has pushed the image
if (-not $SkipBuild) {
    & oc start-build $Name --from-dir=$stage --follow
    if ($LASTEXITCODE -ne 0) {
        if (-not $external) {
            Write-Host "If the build says the integrated container image registry is not configured, run again with -DockerHubUser <user>." -ForegroundColor Yellow
        }
        throw "The build failed (oc exit code $LASTEXITCODE)"
    }
    if ($external) {
        Invoke-Oc rollout restart deployment/$Name
    }
}

Write-Host ""
Write-Host "Done. Follow the simulator with:  oc logs -f deployment/$Name"
