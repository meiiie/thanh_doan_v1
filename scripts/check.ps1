[CmdletBinding()]
param(
  [switch]$Browser
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$frontendRoot = Join-Path $projectRoot 'app\frontend'
$backendRoot = Join-Path $projectRoot 'app\backend'
$contractRoot = Join-Path $projectRoot 'app\contracts'
. (Join-Path $PSScriptRoot 'node-runtime.ps1')
Initialize-ProjectNode

$dockerServerVersion = & docker info --format '{{.ServerVersion}}' 2>$null
if ($LASTEXITCODE -ne 0 -or -not $dockerServerVersion) {
  throw 'Docker is required for the PostgreSQL migration and 134×55 capacity gates. Start Docker, then rerun the check; skipped Testcontainers tests are not an accepted result.'
}
Write-Host "Docker server: $dockerServerVersion"

$runtimeRoots = @(
  (Join-Path $backendRoot 'src\main'),
  (Join-Path $frontendRoot 'src\app')
)
$forbiddenRuntimeMarkers = & rg -n -i `
  'X-Actor-Id|example\.org|/api/dev/|DevActor|mock-data|scorecard-fixture|walking-skeleton' `
  $runtimeRoots 2>$null
if ($LASTEXITCODE -eq 0) {
  throw "Forbidden mock/runtime compatibility marker found:`n$($forbiddenRuntimeMarkers -join [Environment]::NewLine)"
}
if ($LASTEXITCODE -ne 1) {
  throw 'Could not scan runtime sources for forbidden mock markers.'
}

Push-Location $backendRoot
try {
  mvn clean verify
  if ($LASTEXITCODE -ne 0) { throw 'Backend verification failed.' }
}
finally {
  Pop-Location
}

node (Join-Path $projectRoot 'ops\check-licenses.mjs')
if ($LASTEXITCODE -ne 0) { throw 'Dependency license policy failed.' }

Push-Location $frontendRoot
try {
  if (-not (Test-Path -LiteralPath (Join-Path $frontendRoot 'node_modules'))) {
    throw 'node_modules is missing. Run .\scripts\dev.ps1 once to install dependencies.'
  }
  npm run check
  if ($LASTEXITCODE -ne 0) { throw 'Frontend verification failed.' }
  npm audit --omit=dev --audit-level=high
  if ($LASTEXITCODE -ne 0) { throw 'Frontend production dependency audit failed.' }
  if ($Browser) {
    npm run test:e2e
    if ($LASTEXITCODE -ne 0) { throw 'Browser verification failed.' }
  }
}
finally {
  Pop-Location
}

Push-Location $contractRoot
try {
  if (-not (Test-Path -LiteralPath (Join-Path $contractRoot 'node_modules'))) {
    throw 'Contract node_modules is missing. Run npm ci in app\contracts.'
  }
  npm run check
  if ($LASTEXITCODE -ne 0) { throw 'OpenAPI validation or generated DTO drift check failed.' }
  npm audit --audit-level=high
  if ($LASTEXITCODE -ne 0) { throw 'Contract tool dependency audit failed.' }
}
finally {
  Pop-Location
}

$previousComposePassword = $env:POSTGRES_PASSWORD
try {
  if (-not $env:POSTGRES_PASSWORD) {
    $env:POSTGRES_PASSWORD = 'compose-configuration-validation-only'
  }
  Push-Location $projectRoot
  try {
    docker compose config --quiet
    if ($LASTEXITCODE -ne 0) { throw 'Container composition validation failed.' }
    docker compose -f compose.yaml -f compose.secure-local.yaml config --quiet
    if ($LASTEXITCODE -ne 0) { throw 'Secure local composition validation failed.' }

    $vpsSecrets = Join-Path $projectRoot '.tmp\vps-config-secrets'
    New-Item -ItemType Directory -Force -Path $vpsSecrets | Out-Null
    Set-Content -LiteralPath (Join-Path $vpsSecrets 'CAMPAIGN_DB_PASSWORD') -Value 'validation-only' -NoNewline
    Set-Content -LiteralPath (Join-Path $vpsSecrets 'APP_BOOTSTRAP_PASSWORD') -Value 'validation-only' -NoNewline

    $vpsVariables = @{
      APP_DOMAIN = 'localhost.localdomain'
      ACME_EMAIL = 'ops@example.vn'
      NEKO_SECRETS_DIR = '.tmp/vps-config-secrets'
      POSTGRES_IMAGE = 'postgres:18-alpine@sha256:' + ('0' * 64)
      EDGE_IMAGE = 'caddy:2-alpine@sha256:' + ('1' * 64)
      BACKEND_IMAGE = 'ghcr.io/example/neko-doan-backend@sha256:' + ('2' * 64)
      FRONTEND_IMAGE = 'ghcr.io/example/neko-doan-frontend@sha256:' + ('3' * 64)
    }
    $previousVpsVariables = @{}
    foreach ($entry in $vpsVariables.GetEnumerator()) {
      $previousVpsVariables[$entry.Key] = [Environment]::GetEnvironmentVariable($entry.Key, 'Process')
      [Environment]::SetEnvironmentVariable($entry.Key, $entry.Value, 'Process')
    }
    try {
      docker compose -f compose.yaml -f compose.vps.yaml config --quiet
      if ($LASTEXITCODE -ne 0) { throw 'VPS production composition validation failed.' }
    }
    finally {
      foreach ($entry in $previousVpsVariables.GetEnumerator()) {
        [Environment]::SetEnvironmentVariable($entry.Key, $entry.Value, 'Process')
      }
    }
  }
  finally {
    Pop-Location
  }
}
finally {
  $env:POSTGRES_PASSWORD = $previousComposePassword
}
