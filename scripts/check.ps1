[CmdletBinding()]
param(
  [switch]$Browser
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$frontendRoot = Join-Path $projectRoot 'app\frontend'
$backendRoot = Join-Path $projectRoot 'app\backend'
. (Join-Path $PSScriptRoot 'node-runtime.ps1')
Initialize-ProjectNode

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
  }
  finally {
    Pop-Location
  }
}
finally {
  $env:POSTGRES_PASSWORD = $previousComposePassword
}
