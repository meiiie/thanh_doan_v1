[CmdletBinding()]
param(
  [string]$BaseUrl = 'http://127.0.0.1:8081',
  [string]$ManifestFile,
  [string]$SuperadminPasswordFile,
  [string]$ResultFile
)

$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$temporaryRoot = [System.IO.Path]::GetFullPath((Join-Path $projectRoot '.tmp'))

if (-not $ManifestFile) {
  $ManifestFile = Join-Path $temporaryRoot 'source-roster-provisioning\manifest.json'
}
if (-not $SuperadminPasswordFile) {
  $SuperadminPasswordFile = Join-Path $temporaryRoot 'local-superadmin.password'
}
if (-not $ResultFile) {
  $ResultFile = Join-Path $temporaryRoot 'source-roster-provisioning\result.json'
}

$baseUri = [Uri]$BaseUrl
if (-not $baseUri.IsLoopback) {
  throw 'Source roster provisioning is restricted to a loopback URL.'
}
foreach ($path in @($ManifestFile, $SuperadminPasswordFile)) {
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
    throw "Required local file was not found: $path"
  }
}

function Invoke-LocalApi {
  param(
    [Parameter(Mandatory)] [string]$Method,
    [Parameter(Mandatory)] [string]$Path,
    [Parameter(Mandatory)] [Microsoft.PowerShell.Commands.WebRequestSession]$Session,
    [object]$Body,
    [string]$CsrfToken
  )
  $request = @{
    Uri = "$($BaseUrl.TrimEnd('/'))$Path"
    Method = $Method
    WebSession = $Session
    ErrorAction = 'Stop'
  }
  if ($baseUri.Scheme -eq 'https') { $request.SkipCertificateCheck = $true }
  if ($CsrfToken) { $request.Headers = @{ 'X-XSRF-TOKEN' = $CsrfToken } }
  if ($null -ne $Body) {
    $request.ContentType = 'application/json'
    $request.Body = $Body | ConvertTo-Json -Depth 10 -Compress
  }
  $response = Invoke-RestMethod @request
  foreach ($item in $response) { Write-Output $item }
}

function Open-SuperadminSession {
  $session = [Microsoft.PowerShell.Commands.WebRequestSession]::new()
  $csrf = (Invoke-LocalApi -Method Get -Path '/api/auth/csrf' -Session $session).token
  $password = [System.IO.File]::ReadAllText($SuperadminPasswordFile).Trim()
  $account = Invoke-LocalApi -Method Post -Path '/api/auth/login' -Session $session `
    -CsrfToken $csrf -Body @{ username = 'superadmin'; password = $password }
  if ($account.role -ne 'SUPERADMIN') { throw 'The bootstrap account is not a Superadmin.' }
  $csrf = (Invoke-LocalApi -Method Get -Path '/api/auth/csrf' -Session $session).token
  return [pscustomobject]@{ Session = $session; Csrf = $csrf }
}

function Assert-SourceMatch {
  param([Parameter(Mandatory)] $Existing, [Parameter(Mandatory)] $Source, [Parameter(Mandatory)] [string]$Label)
  if ($Existing.sourceSha256 -and $Existing.sourceSha256 -ne $Source.sha256) {
    throw "$Label exists but belongs to another source workbook."
  }
  if ($Existing.sourceRow -and [int]$Existing.sourceRow -ne [int]$Source.row) {
    throw "$Label exists but points to another source row."
  }
}

$manifest = Get-Content -LiteralPath $ManifestFile -Raw | ConvertFrom-Json
if ($manifest.schemaVersion -ne 1) { throw 'Unsupported source roster manifest version.' }
if (@($manifest.teams).Count -ne 5 -or @($manifest.organizations).Count -ne 134 -or
    @($manifest.accounts).Count -ne 164) {
  throw 'Manifest cardinality must be exactly 5 teams, 134 organizations and 164 accounts.'
}

$context = Open-SuperadminSession
$createdTeams = 0
$createdOrganizations = 0
$createdAccounts = 0
$matchedAccounts = 0

try {
  $directory = Invoke-LocalApi -Method Get -Path '/api/organization-directory' -Session $context.Session
  foreach ($team in $manifest.teams) {
    $existing = @($directory.teams) | Where-Object { $_.code -eq $team.code } | Select-Object -First 1
    if (-not $existing) {
      $existing = Invoke-LocalApi -Method Post -Path '/api/organization-directory/teams' `
        -Session $context.Session -CsrfToken $context.Csrf -Body @{
          code = $team.code
          name = $team.name
          sourceFileName = $manifest.source.fileName
          sourceSha256 = $manifest.source.sha256
          sourceSheetName = $manifest.source.sheetName
          sourceRow = $team.sourceRow
        }
      $createdTeams++
      $directory.teams += $existing
    }
    elseif ($existing.name -ne $team.name) {
      throw "Team code $($team.code) already exists with another name."
    }
    Assert-SourceMatch -Existing $existing -Source @{ sha256 = $manifest.source.sha256; row = $team.sourceRow } `
      -Label "Team $($team.code)"
    $team | Add-Member -NotePropertyName id -NotePropertyValue $existing.id -Force
  }

  foreach ($organization in $manifest.organizations) {
    $existing = @($directory.organizations) |
      Where-Object { $_.code -eq $organization.code } | Select-Object -First 1
    if (-not $existing) {
      $existing = Invoke-LocalApi -Method Post -Path '/api/organization-directory/organizations' `
        -Session $context.Session -CsrfToken $context.Csrf -Body @{
          code = $organization.code
          name = $organization.name
          unitGroupCode = $organization.unitGroupCode
          sourceFileName = $manifest.source.fileName
          sourceSha256 = $manifest.source.sha256
          sourceSheetName = $manifest.source.sheetName
          sourceRow = $organization.sourceRow
        }
      $createdOrganizations++
      $directory.organizations += $existing
    }
    elseif ($existing.name -ne $organization.name -or $existing.unitGroupCode -ne $organization.unitGroupCode) {
      throw "Organization code $($organization.code) already exists with another identity."
    }
    Assert-SourceMatch -Existing $existing -Source @{ sha256 = $manifest.source.sha256; row = $organization.sourceRow } `
      -Label "Organization $($organization.code)"
    $organization | Add-Member -NotePropertyName id -NotePropertyValue $existing.id -Force
  }

  $accounts = @(Invoke-LocalApi -Method Get -Path '/api/accounts' -Session $context.Session)
  Write-Verbose ("Existing accounts: " + (($accounts | ForEach-Object { "$($_.username):$($_.role)" }) -join ', '))
  foreach ($definition in $manifest.accounts) {
    if (-not $definition.provision) {
      $existing = $accounts | Where-Object { $_.username -eq $definition.username } | Select-Object -First 1
      if (-not $existing -or $existing.role -ne $definition.role) {
        throw "Required existing account $($definition.username) was not found with role $($definition.role)."
      }
      $matchedAccounts++
      continue
    }

    $organizationId = $null
    if ($definition.organizationCode) {
      $organizationId = ($manifest.organizations |
        Where-Object { $_.code -eq $definition.organizationCode } | Select-Object -First 1).id
    }
    $teamId = $null
    if ($definition.teamCode) {
      $teamId = ($manifest.teams |
        Where-Object { $_.code -eq $definition.teamCode } | Select-Object -First 1).id
    }

    $existing = $accounts | Where-Object { $_.username -eq $definition.username } | Select-Object -First 1
    if (-not $existing) {
      $existing = Invoke-LocalApi -Method Post -Path '/api/accounts' `
        -Session $context.Session -CsrfToken $context.Csrf -Body @{
          username = $definition.username
          displayName = $definition.displayName
          password = $definition.initialPassword
          role = $definition.role
          organizationId = $organizationId
          teamId = $teamId
          teamMonitor = [bool]$definition.teamLead
          sourceFileName = $manifest.source.fileName
          sourceSha256 = $manifest.source.sha256
          sourceSheetName = $manifest.source.sheetName
          sourceRow = $definition.sourceRow
        }
      $createdAccounts++
      $accounts += $existing
    }
    elseif ($existing.role -ne $definition.role -or $existing.displayName -ne $definition.displayName -or
            $existing.organizationId -ne $organizationId -or $existing.teamId -ne $teamId) {
      throw "Account $($definition.username) already exists with another identity or scope."
    }
    Assert-SourceMatch -Existing $existing -Source @{ sha256 = $manifest.source.sha256; row = $definition.sourceRow } `
      -Label "Account $($definition.username)"
    if ($definition.teamLead -and -not (@($existing.capabilities) -contains 'review.team.overview')) {
      throw "Account $($definition.username) is missing the team-monitor capability."
    }
    $matchedAccounts++
  }

  $sourceTeams = @($directory.teams) | Where-Object { $_.sourceSha256 -eq $manifest.source.sha256 }
  $sourceOrganizations = @($directory.organizations) |
    Where-Object { $_.sourceSha256 -eq $manifest.source.sha256 }
  $sourceAccounts = @($accounts) | Where-Object { $_.sourceSha256 -eq $manifest.source.sha256 }
  if ($sourceTeams.Count -ne 5 -or $sourceOrganizations.Count -ne 134 -or $sourceAccounts.Count -ne 163) {
    throw "Provisioned source counts are invalid: teams=$($sourceTeams.Count), organizations=$($sourceOrganizations.Count), accounts=$($sourceAccounts.Count)."
  }

  $result = [ordered]@{
    schemaVersion = 1
    sourceSha256 = $manifest.source.sha256
    completedAt = [DateTimeOffset]::UtcNow.ToString('O')
    baseUrl = $BaseUrl.TrimEnd('/')
    created = [ordered]@{
      teams = $createdTeams
      organizations = $createdOrganizations
      accounts = $createdAccounts
    }
    verified = [ordered]@{
      teams = $sourceTeams.Count
      organizations = $sourceOrganizations.Count
      sourceAccounts = $sourceAccounts.Count
      existingSuperadmin = 1
      totalAccounts = $matchedAccounts
    }
  }
  $resolvedResult = [System.IO.Path]::GetFullPath($ResultFile)
  New-Item -ItemType Directory -Path (Split-Path -Parent $resolvedResult) -Force | Out-Null
  [System.IO.File]::WriteAllText(
    $resolvedResult,
    ($result | ConvertTo-Json -Depth 6),
    [System.Text.UTF8Encoding]::new($false)
  )
  Write-Host "Source roster is ready: $resolvedResult"
  $result.verified | Format-List
}
finally {
  try {
    Invoke-LocalApi -Method Post -Path '/api/auth/logout' -Session $context.Session `
      -CsrfToken $context.Csrf -Body @{} | Out-Null
  } catch {
    Write-Warning 'The provisioning session could not be closed cleanly.'
  }
}
