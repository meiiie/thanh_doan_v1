[CmdletBinding()]
param(
  [string]$Destination = (Join-Path (Split-Path -Parent $PSScriptRoot) 'backups'),
  [string]$ComposeProject = 'neko-doan',
  [string[]]$ComposeFiles = @('compose.yaml')
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$resolvedRoot = [System.IO.Path]::GetFullPath($projectRoot)
$resolvedDestination = [System.IO.Path]::GetFullPath($Destination)
if (-not $resolvedDestination.StartsWith($resolvedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw 'Backup destination must stay inside the project workspace.'
}

New-Item -ItemType Directory -Path $resolvedDestination -Force | Out-Null
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$archiveName = "neko-doan-$timestamp.dump"
$containerPath = "/tmp/$archiveName"
$compose = @('compose', '-p', $ComposeProject)
foreach ($file in $ComposeFiles) {
  $compose += @('-f', (Join-Path $projectRoot $file))
}

Push-Location $projectRoot
try {
  & docker @compose exec -T database sh -c 'pg_dump --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" --format=custom --file="$1"' sh $containerPath
  if ($LASTEXITCODE -ne 0) { throw 'pg_dump failed.' }
  & docker @compose cp "database:$containerPath" (Join-Path $resolvedDestination $archiveName)
  if ($LASTEXITCODE -ne 0) { throw 'Could not copy the backup out of the database container.' }
  & docker @compose exec -T database rm -f -- $containerPath
  if ($LASTEXITCODE -ne 0) { throw 'Could not remove the temporary backup inside the container.' }
}
finally {
  Pop-Location
}

$archivePath = Join-Path $resolvedDestination $archiveName
$checksum = (Get-FileHash -Algorithm SHA256 -LiteralPath $archivePath).Hash
Set-Content -LiteralPath "$archivePath.sha256" -Value "$checksum  $archiveName" -Encoding ASCII
Write-Host "Backup created: $archivePath"
Write-Host "SHA-256: $checksum"
