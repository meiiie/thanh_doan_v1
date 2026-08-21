[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$frontendRoot = Join-Path $projectRoot 'app\frontend'
$backendRoot = Join-Path $projectRoot 'app\backend'
$contractRoot = Join-Path $projectRoot 'app\contracts'
$runtimeRoot = Join-Path $projectRoot '.tmp'
$credentialPath = Join-Path $runtimeRoot 'local-superadmin.password'
. (Join-Path $PSScriptRoot 'node-runtime.ps1')
Initialize-ProjectNode

if (-not (Test-Path -LiteralPath (Join-Path $contractRoot 'node_modules'))) {
  Push-Location $contractRoot
  try { npm install } finally { Pop-Location }
}
Push-Location $contractRoot
try { npm run generate } finally { Pop-Location }

New-Item -ItemType Directory -Path $runtimeRoot -Force | Out-Null
if (-not (Test-Path -LiteralPath $credentialPath)) {
  $randomBytes = New-Object byte[] 24
  $random = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try { $random.GetBytes($randomBytes) } finally { $random.Dispose() }
  $generatedPassword = [Convert]::ToBase64String($randomBytes).Replace('/', 'x').Replace('+', 'Y') + '!aA1'
  Set-Content -LiteralPath $credentialPath -Value $generatedPassword -Encoding UTF8
}

$env:APP_BOOTSTRAP_USERNAME = 'superadmin'
$env:APP_BOOTSTRAP_PASSWORD = (Get-Content -Raw -LiteralPath $credentialPath).Trim()
$env:SPRING_PROFILES_ACTIVE = 'local'

$backendRunning = $false
try {
  $csrf = Invoke-RestMethod -Uri 'http://127.0.0.1:8081/api/auth/csrf' -TimeoutSec 2
  if (-not $csrf.token) { throw 'Port 8081 is running an incompatible application.' }
  $backendRunning = $true
  Write-Host 'Backend is already running at http://127.0.0.1:8081/'
}
catch [System.Net.Http.HttpRequestException] {
  # No compatible backend is listening on port 8081.
}
catch [System.Threading.Tasks.TaskCanceledException] {
  # No compatible backend is listening on port 8081.
}
catch [System.Net.WebException] {
  # No compatible backend is listening on port 8081.
}

if (-not $backendRunning) {
  $maven = Get-Command mvn -ErrorAction Stop
  $backendProcess = Start-Process `
    -FilePath $maven.Source `
    -ArgumentList 'spring-boot:run' `
    -WorkingDirectory $backendRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $runtimeRoot 'backend-dev.out.log') `
    -RedirectStandardError (Join-Path $runtimeRoot 'backend-dev.err.log') `
    -PassThru
  Set-Content -LiteralPath (Join-Path $runtimeRoot 'backend.pid') -Value $backendProcess.Id -Encoding ASCII

  $ready = $false
  for ($attempt = 0; $attempt -lt 60; $attempt++) {
    if ($backendProcess.HasExited) { throw "Backend exited during startup. See $runtimeRoot\backend-dev.err.log" }
    try {
      $health = Invoke-RestMethod -Uri 'http://127.0.0.1:8081/actuator/health' -TimeoutSec 1
      if ($health.status -eq 'UP') { $ready = $true; break }
    }
    catch [System.Net.Http.HttpRequestException] { Start-Sleep -Milliseconds 500 }
    catch [System.Threading.Tasks.TaskCanceledException] { Start-Sleep -Milliseconds 500 }
    catch [System.Net.WebException] { Start-Sleep -Milliseconds 500 }
  }
  if (-not $ready) { throw "Backend did not become ready. See $runtimeRoot\backend-dev.err.log" }
  Write-Host 'Backend started at http://127.0.0.1:8081/'
}

$frontendRunning = $false
try {
  $existingResponse = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:4317/' -TimeoutSec 2
  if ($existingResponse.Content -match 'name="neko-doan-app"') {
    $frontendRunning = $true
    Write-Host 'Frontend is already running at http://127.0.0.1:4317/'
  } else { throw 'Port 4317 is running an incompatible application.' }
}
catch [System.Net.Http.HttpRequestException] {
  # No compatible frontend is listening on port 4317.
}
catch [System.Threading.Tasks.TaskCanceledException] {
  # No compatible frontend is listening on port 4317.
}
catch [System.Net.WebException] {
  # No compatible frontend is listening on port 4317.
}

if (-not $frontendRunning) {
  if (-not (Test-Path -LiteralPath (Join-Path $frontendRoot 'node_modules'))) {
    Push-Location $frontendRoot
    try { npm install } finally { Pop-Location }
  }
  $npm = Get-Command npm.cmd -ErrorAction Stop
  $frontendProcess = Start-Process `
    -FilePath $npm.Source `
    -ArgumentList 'run', 'start:local' `
    -WorkingDirectory $frontendRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $runtimeRoot 'frontend-dev.out.log') `
    -RedirectStandardError (Join-Path $runtimeRoot 'frontend-dev.err.log') `
    -PassThru
  Set-Content -LiteralPath (Join-Path $runtimeRoot 'frontend.pid') -Value $frontendProcess.Id -Encoding ASCII

  $frontendReady = $false
  for ($attempt = 0; $attempt -lt 60; $attempt++) {
    if ($frontendProcess.HasExited) { throw "Frontend exited during startup. See $runtimeRoot\frontend-dev.err.log" }
    try {
      $page = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:4317/login' -TimeoutSec 1
      if ($page.Content -match 'name="neko-doan-app"') { $frontendReady = $true; break }
    }
    catch [System.Net.Http.HttpRequestException] { Start-Sleep -Milliseconds 500 }
    catch [System.Threading.Tasks.TaskCanceledException] { Start-Sleep -Milliseconds 500 }
    catch [System.Net.WebException] { Start-Sleep -Milliseconds 500 }
  }
  if (-not $frontendReady) { throw "Frontend did not become ready. See $runtimeRoot\frontend-dev.err.log" }
  Write-Host 'Frontend started at http://127.0.0.1:4317/'
}

Write-Host 'Open http://127.0.0.1:4317/login'
Write-Host 'Mode: DEVELOPMENT (hot reload + local H2; not the TLS/PostgreSQL acceptance surface)'
Write-Host 'Username: superadmin'
Write-Host "Local password file: $credentialPath"
