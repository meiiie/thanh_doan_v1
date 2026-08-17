[CmdletBinding()]
param(
  [Parameter(Mandatory)]
  [string]$OffHostDestination,
  [string]$ComposeProject = 'campaign-workflow',
  [string[]]$ComposeFiles = @('compose.yaml')
)

$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$destination = [System.IO.Path]::GetFullPath($OffHostDestination)
if ($destination.StartsWith($projectRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw 'Off-host destination must be outside the project workspace.'
}
New-Item -ItemType Directory -Path $destination -Force | Out-Null

$staging = Join-Path $projectRoot 'backups'
& (Join-Path $PSScriptRoot 'backup.ps1') `
  -Destination $staging `
  -ComposeProject $ComposeProject `
  -ComposeFiles $ComposeFiles
if ($LASTEXITCODE -ne 0) { throw 'Local staging backup failed.' }
$source = Get-ChildItem -LiteralPath $staging -Filter 'campaign-*.dump' -File |
  Sort-Object LastWriteTimeUtc -Descending |
  Select-Object -First 1
if (-not $source) { throw 'Backup script did not create a dump.' }

$remoteDump = Join-Path $destination $source.Name
$remoteChecksum = "$remoteDump.sha256"
Copy-Item -LiteralPath $source.FullName -Destination $remoteDump -Force
Copy-Item -LiteralPath "$($source.FullName).sha256" -Destination $remoteChecksum -Force
$expected = ((Get-Content -LiteralPath $remoteChecksum -Raw).Trim() -split '\s+')[0]
$actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $remoteDump).Hash
if ($expected -ne $actual) { throw 'Copied backup failed SHA-256 verification.' }

$suffix = Get-Date -Format 'yyyyMMddHHmmss'
$container = "campaign-restore-drill-$suffix"
if (-not $container.StartsWith('campaign-restore-drill-', [System.StringComparison]::Ordinal)) {
  throw 'Unsafe restore drill container name.'
}
$passwordBytes = [byte[]]::new(30)
$passwordGenerator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
try { $passwordGenerator.GetBytes($passwordBytes) }
finally { $passwordGenerator.Dispose() }
$drillPassword = [Convert]::ToBase64String($passwordBytes)
$startedAt = Get-Date
try {
  docker run -d --name $container `
    -e "POSTGRES_DB=campaign_restore" `
    -e "POSTGRES_USER=campaign_restore" `
    -e "POSTGRES_PASSWORD=$drillPassword" `
    postgres:18-alpine | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'Could not start isolated restore database.' }
  $ready = $false
  for ($attempt = 0; $attempt -lt 30; $attempt++) {
    docker exec $container pg_isready -U campaign_restore -d campaign_restore *> $null
    if ($LASTEXITCODE -eq 0) { $ready = $true; break }
    Start-Sleep -Seconds 2
  }
  if (-not $ready) { throw 'Isolated restore database did not become ready.' }
  docker cp $remoteDump "${container}:/tmp/campaign-restore.dump"
  if ($LASTEXITCODE -ne 0) { throw 'Could not copy off-host backup into restore drill.' }
  docker exec $container pg_restore `
    --username=campaign_restore `
    --dbname=campaign_restore `
    --no-owner `
    --single-transaction `
    /tmp/campaign-restore.dump
  if ($LASTEXITCODE -ne 0) { throw 'Restore drill failed.' }
  $lineCount = docker exec $container psql -U campaign_restore -d campaign_restore -tA `
    -c 'select count(*) from scorecard_line;'
  if ($LASTEXITCODE -ne 0 -or [int]$lineCount -ne 55) {
    throw "Restore drill expected 55 source lines but found $lineCount."
  }
  $migrationVersion = docker exec $container psql -U campaign_restore -d campaign_restore -tA `
    -c 'select max(version) from flyway_schema_history where success = true;'
  if ($LASTEXITCODE -ne 0 -or [int]$migrationVersion -lt 6) {
    throw "Restore drill migration verification failed: $migrationVersion"
  }
  $elapsed = [Math]::Round(((Get-Date) - $startedAt).TotalSeconds, 2)
  $report = [ordered]@{
    exercisedAt = (Get-Date).ToString('o')
    destination = $destination
    backupFile = $source.Name
    sha256 = $actual
    restoredScorecardLines = [int]$lineCount
    migrationVersion = [int]$migrationVersion
    elapsedSeconds = $elapsed
    outcome = 'PASSED'
  } | ConvertTo-Json
  [System.IO.File]::WriteAllText(
    (Join-Path $destination "$($source.BaseName)-restore-drill.json"),
    $report,
    [System.Text.UTF8Encoding]::new($false)
  )
  Write-Host "Off-host copy verified: $remoteDump"
  Write-Host "Isolated restore drill passed in $elapsed seconds."
}
finally {
  docker rm -f $container *> $null
}
