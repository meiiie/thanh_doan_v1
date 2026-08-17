[CmdletBinding()]
param(
  [Parameter(Mandatory)]
  [string]$Backup,
  [Parameter(Mandatory)]
  [switch]$ConfirmDatabaseReplace,
  [switch]$AllowOutsideWorkspace,
  [string]$ComposeProject = 'campaign-workflow',
  [string[]]$ComposeFiles = @('compose.yaml')
)

$ErrorActionPreference = 'Stop'
if (-not $ConfirmDatabaseReplace) { throw 'Restore requires -ConfirmDatabaseReplace.' }
$projectRoot = Split-Path -Parent $PSScriptRoot
$resolvedRoot = [System.IO.Path]::GetFullPath($projectRoot)
$resolvedBackup = [System.IO.Path]::GetFullPath($Backup)
if (-not $AllowOutsideWorkspace -and -not $resolvedBackup.StartsWith($resolvedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw 'Restore source is outside the workspace. Pass -AllowOutsideWorkspace only for a verified off-host copy.'
}
if (-not (Test-Path -LiteralPath $resolvedBackup -PathType Leaf)) {
  throw "Backup file does not exist: $resolvedBackup"
}
if ([System.IO.Path]::GetExtension($resolvedBackup) -ne '.dump') {
  throw 'Restore accepts only a PostgreSQL custom-format .dump file.'
}
$checksumPath = "$resolvedBackup.sha256"
if (Test-Path -LiteralPath $checksumPath -PathType Leaf) {
  $expectedChecksum = ((Get-Content -LiteralPath $checksumPath -Raw).Trim() -split '\s+')[0]
  $actualChecksum = (Get-FileHash -Algorithm SHA256 -LiteralPath $resolvedBackup).Hash
  if ($expectedChecksum -ne $actualChecksum) {
    throw 'Backup checksum verification failed. Restore was not started.'
  }
}

$containerPath = '/tmp/campaign-restore.dump'
$compose = @('compose', '-p', $ComposeProject)
foreach ($file in $ComposeFiles) {
  $compose += @('-f', (Join-Path $projectRoot $file))
}
Push-Location $projectRoot
try {
  & docker @compose cp $resolvedBackup "database:$containerPath"
  if ($LASTEXITCODE -ne 0) { throw 'Could not copy the backup into the database container.' }
  & docker @compose exec -T database sh -c 'pg_restore --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" --clean --if-exists --no-owner --single-transaction "$1"' sh $containerPath
  if ($LASTEXITCODE -ne 0) { throw 'pg_restore failed; the transaction was rolled back.' }
  & docker @compose exec -T database rm -f -- $containerPath
  if ($LASTEXITCODE -ne 0) { throw 'Could not remove the temporary restore file inside the container.' }
}
finally {
  Pop-Location
}

Write-Host 'Restore completed. Run .\scripts\check.ps1 and verify the campaign status before reopening writes.'
