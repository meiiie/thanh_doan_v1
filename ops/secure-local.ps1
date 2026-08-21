[CmdletBinding()]
param(
  [switch]$RotateSecrets,
  [switch]$Start,
  [int]$Port = 4319
)

$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$secretDirectory = [System.IO.Path]::GetFullPath((Join-Path $projectRoot '.tmp\secrets'))
if (-not $secretDirectory.StartsWith($projectRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw 'Secret directory escaped the project workspace.'
}
New-Item -ItemType Directory -Path $secretDirectory -Force | Out-Null

function New-RandomSecret {
  $bytes = [byte[]]::new(36)
  $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try { $generator.GetBytes($bytes) }
  finally { $generator.Dispose() }
  return [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}

function Write-SecretIfNeeded([string]$Name) {
  $path = Join-Path $secretDirectory $Name
  if ($RotateSecrets -or -not (Test-Path -LiteralPath $path -PathType Leaf)) {
    [System.IO.File]::WriteAllText($path, (New-RandomSecret), [System.Text.UTF8Encoding]::new($false))
  }
  return $path
}

$databaseSecret = Write-SecretIfNeeded 'POSTGRES_PASSWORD'
$bootstrapSecret = Write-SecretIfNeeded 'APP_BOOTSTRAP_PASSWORD'
$certificatePath = Join-Path $secretDirectory 'tls.crt'
$privateKeyPath = Join-Path $secretDirectory 'tls.key'
if ($RotateSecrets -or -not (Test-Path -LiteralPath $certificatePath) -or -not (Test-Path -LiteralPath $privateKeyPath)) {
  docker run --rm `
    --mount "type=bind,source=$secretDirectory,target=/work" `
    alpine/openssl `
    req -x509 -nodes -newkey rsa:3072 -sha256 -days 397 `
    -subj '/CN=localhost' `
    -addext 'subjectAltName=DNS:localhost,IP:127.0.0.1' `
    -keyout /work/tls.key `
    -out /work/tls.crt
  if ($LASTEXITCODE -ne 0) { throw 'Could not generate the local TLS certificate.' }
}
docker run --rm --entrypoint /bin/chmod `
  --mount "type=bind,source=$secretDirectory,target=/work" `
  alpine/openssl 0444 /work/tls.crt /work/tls.key
if ($LASTEXITCODE -ne 0) { throw 'Could not make TLS files readable by the unprivileged proxy.' }

$passwordCopy = Join-Path $projectRoot '.tmp\secure-local-superadmin.password'
[System.IO.File]::Copy($bootstrapSecret, $passwordCopy, $true)
Write-Host "Secrets are stored as files under $secretDirectory and are excluded from Git."
Write-Host "Local TLS certificate: $certificatePath"
Write-Host "Superadmin password file: $passwordCopy"

if ($Start) {
  $previousDatabasePassword = $env:POSTGRES_PASSWORD
  $previousBootstrapPassword = $env:APP_BOOTSTRAP_PASSWORD
  $previousBootstrapEnabled = $env:APP_BOOTSTRAP_ENABLED
  $previousTlsPort = $env:TLS_APP_PORT
  try {
    $env:POSTGRES_PASSWORD = [System.IO.File]::ReadAllText($databaseSecret)
    $env:APP_BOOTSTRAP_PASSWORD = [System.IO.File]::ReadAllText($bootstrapSecret)
    $env:APP_BOOTSTRAP_ENABLED = 'true'
    $env:TLS_APP_PORT = $Port.ToString()
    Push-Location $projectRoot
    try {
      docker compose -p neko-doan-secure-local -f compose.yaml -f compose.secure-local.yaml up --build -d
      if ($LASTEXITCODE -ne 0) { throw 'Secure local stack did not start.' }
    }
    finally {
      Pop-Location
    }
  }
  finally {
    $env:POSTGRES_PASSWORD = $previousDatabasePassword
    $env:APP_BOOTSTRAP_PASSWORD = $previousBootstrapPassword
    $env:APP_BOOTSTRAP_ENABLED = $previousBootstrapEnabled
    $env:TLS_APP_PORT = $previousTlsPort
  }
  Write-Host "Secure local URL: https://127.0.0.1:$Port/login"
  Write-Host 'Mode: SECURE LOCAL UAT (production build + PostgreSQL + TLS)'
  Write-Host 'The certificate is self-signed for local verification only.'
}
