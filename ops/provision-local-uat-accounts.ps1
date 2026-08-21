[CmdletBinding()]
param(
  [string]$BaseUrl = 'https://127.0.0.1:4319',
  [string]$SuperadminPasswordFile,
  [string]$OutputFile
)

$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$temporaryRoot = [System.IO.Path]::GetFullPath((Join-Path $projectRoot '.tmp'))

if (-not $SuperadminPasswordFile) {
  $SuperadminPasswordFile = Join-Path $temporaryRoot 'secure-local-superadmin.password'
}
if (-not $OutputFile) {
  $OutputFile = Join-Path $temporaryRoot 'local-uat-accounts.json'
}

$baseUri = [Uri]$BaseUrl
if (-not $baseUri.IsLoopback) {
  throw 'UAT account provisioning is restricted to a loopback URL.'
}

$resolvedOutput = [System.IO.Path]::GetFullPath($OutputFile)
if (-not $resolvedOutput.StartsWith($temporaryRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw 'The credential manifest must stay under the project .tmp directory.'
}
if (-not (Test-Path -LiteralPath $SuperadminPasswordFile -PathType Leaf)) {
  throw "Superadmin password file was not found: $SuperadminPasswordFile"
}

function New-RandomSecret {
  $bytes = [byte[]]::new(24)
  [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
  return [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
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
    SkipCertificateCheck = $true
    ErrorAction = 'Stop'
  }
  if ($CsrfToken) {
    $request.Headers = @{ 'X-XSRF-TOKEN' = $CsrfToken }
  }
  if ($null -ne $Body) {
    $request.ContentType = 'application/json'
    $request.Body = $Body | ConvertTo-Json -Depth 8 -Compress
  }
  return Invoke-RestMethod @request
}

function Get-CsrfToken {
  param([Parameter(Mandatory)] [Microsoft.PowerShell.Commands.WebRequestSession]$Session)
  $response = Invoke-LocalApi -Method Get -Path '/api/auth/csrf' -Session $Session
  if (-not $response.token) { throw 'The backend did not return a CSRF token.' }
  return [string]$response.token
}

function Open-AuthenticatedSession {
  param(
    [Parameter(Mandatory)] [string]$Username,
    [Parameter(Mandatory)] [string]$Password
  )
  $session = [Microsoft.PowerShell.Commands.WebRequestSession]::new()
  $csrf = Get-CsrfToken -Session $session
  $account = Invoke-LocalApi -Method Post -Path '/api/auth/login' -Session $session `
    -CsrfToken $csrf -Body @{ username = $Username; password = $Password }
  # Login intentionally replaces the pre-authentication session, therefore its
  # synchronizer token is no longer valid for authenticated writes.
  $csrf = Get-CsrfToken -Session $session
  return [pscustomobject]@{ Session = $session; Csrf = $csrf; Account = $account }
}

function Close-AuthenticatedSession {
  param([Parameter(Mandatory)] $Context)
  Invoke-LocalApi -Method Post -Path '/api/auth/logout' -Session $Context.Session `
    -CsrfToken $Context.Csrf -Body @{} | Out-Null
}

New-Item -ItemType Directory -Path $temporaryRoot -Force | Out-Null
$superadminPassword = [System.IO.File]::ReadAllText($SuperadminPasswordFile).Trim()
$super = Open-AuthenticatedSession -Username 'superadmin' -Password $superadminPassword
if ($super.Account.role -ne 'SUPERADMIN') {
  throw 'The bootstrap account is not a Superadmin.'
}

try {
  $directory = Invoke-LocalApi -Method Get -Path '/api/organization-directory' -Session $super.Session
  $organization = @($directory.organizations) |
    Where-Object { $_.code -eq 'LAB-DHCD' } |
    Select-Object -First 1
  if (-not $organization) {
    $organization = Invoke-LocalApi -Method Post -Path '/api/organization-directory/organizations' `
      -Session $super.Session -CsrfToken $super.Csrf -Body @{
        code = 'LAB-DHCD'
        name = 'UAT local · Đơn vị Đại học, Cao đẳng'
        unitGroupCode = 'UNIVERSITY'
      }
  }

  $team = @($directory.teams) |
    Where-Object { $_.code -eq 'LAB-TO-01' } |
    Select-Object -First 1
  if (-not $team) {
    $team = Invoke-LocalApi -Method Post -Path '/api/organization-directory/teams' `
      -Session $super.Session -CsrfToken $super.Csrf -Body @{
        code = 'LAB-TO-01'
        name = 'UAT local · Tổ theo dõi 01'
      }
  }

  $existingCredentials = @{}
  if (Test-Path -LiteralPath $resolvedOutput -PathType Leaf) {
    $saved = Get-Content -LiteralPath $resolvedOutput -Raw | ConvertFrom-Json
    foreach ($entry in @($saved.accounts)) {
      if ($entry.username -and $entry.password) {
        $existingCredentials[[string]$entry.username] = [string]$entry.password
      }
    }
  }

  $accountDefinitions = @(
    [ordered]@{
      username = 'uat.admin'
      displayName = 'UAT · Admin chiến dịch'
      role = 'CAMPAIGN_ADMIN'
      route = '/admin/scorecard-templates'
      apiProbe = '/api/scorecards/current'
      scope = 'Chiến dịch TNTN Hè 2026'
      organizationId = $null
      teamId = $null
    },
    [ordered]@{
      username = 'uat.reviewer'
      displayName = 'UAT · Cán bộ tổ theo dõi'
      role = 'REVIEWER'
      route = '/reviewer/queue'
      apiProbe = '/api/reviewer/queue'
      scope = 'Tổ LAB-TO-01'
      organizationId = $null
      teamId = [string]$team.id
    },
    [ordered]@{
      username = 'uat.unit.dhcd'
      displayName = 'UAT · Cán bộ khối ĐH/CĐ'
      role = 'UNIT_MEMBER'
      route = '/unit/tasks'
      apiProbe = '/api/unit/tasks'
      scope = 'Đơn vị LAB-DHCD · Khối Đại học, Cao đẳng'
      organizationId = [string]$organization.id
      teamId = $null
    }
  )

  $accounts = @(Invoke-LocalApi -Method Get -Path '/api/accounts' -Session $super.Session)
  $manifestEntries = @()

  foreach ($definition in $accountDefinitions) {
    $existing = $accounts | Where-Object { $_.username -eq $definition.username } | Select-Object -First 1
    $password = $existingCredentials[$definition.username]

    if (-not $existing) {
      $temporaryPassword = New-RandomSecret
      $password = New-RandomSecret
      $created = Invoke-LocalApi -Method Post -Path '/api/accounts' -Session $super.Session `
        -CsrfToken $super.Csrf -Body @{
          username = $definition.username
          displayName = $definition.displayName
          password = $temporaryPassword
          role = $definition.role
          organizationId = $definition.organizationId
          teamId = $definition.teamId
        }
      if ($created.role -ne $definition.role -or -not $created.passwordChangeRequired) {
        throw "Account $($definition.username) was created with an unexpected state."
      }

      $firstLogin = Open-AuthenticatedSession -Username $definition.username -Password $temporaryPassword
      try {
        $changed = Invoke-LocalApi -Method Post -Path '/api/auth/change-password' `
          -Session $firstLogin.Session -CsrfToken $firstLogin.Csrf -Body @{
            currentPassword = $temporaryPassword
            newPassword = $password
          }
        if ($changed.passwordChangeRequired) {
          throw "Account $($definition.username) still requires a password change."
        }
      }
      finally {
        Close-AuthenticatedSession -Context $firstLogin
      }
    }
    elseif (-not $password) {
      throw "Account $($definition.username) exists, but its local password is not in $resolvedOutput."
    }

    $verification = Open-AuthenticatedSession -Username $definition.username -Password $password
    try {
      if ($verification.Account.role -ne $definition.role) {
        throw "Account $($definition.username) has role $($verification.Account.role), expected $($definition.role)."
      }
      if ($verification.Account.passwordChangeRequired) {
        throw "Account $($definition.username) unexpectedly requires a password change."
      }
      Invoke-LocalApi -Method Get -Path $definition.apiProbe -Session $verification.Session | Out-Null
    }
    finally {
      Close-AuthenticatedSession -Context $verification
    }

    $manifestEntries += [pscustomobject][ordered]@{
      username = $definition.username
      password = $password
      displayName = $definition.displayName
      role = $definition.role
      route = "$($BaseUrl.TrimEnd('/'))$($definition.route)"
      scope = $definition.scope
      passwordChangeRequired = $false
      verified = $true
    }
  }

  $manifest = [ordered]@{
    schemaVersion = 1
    localOnly = $true
    generatedAt = [DateTimeOffset]::UtcNow.ToString('O')
    baseUrl = $BaseUrl.TrimEnd('/')
    superadmin = [ordered]@{
      username = 'superadmin'
      passwordFile = [System.IO.Path]::GetFullPath($SuperadminPasswordFile)
      role = 'SUPERADMIN'
      route = "$($BaseUrl.TrimEnd('/'))/superadmin/lifecycle"
      verified = $true
    }
    accounts = $manifestEntries
  }
  [System.IO.File]::WriteAllText(
    $resolvedOutput,
    ($manifest | ConvertTo-Json -Depth 8),
    [System.Text.UTF8Encoding]::new($false)
  )

  Write-Host "Local UAT accounts are ready: $resolvedOutput"
  $manifestEntries | Select-Object username, role, route, scope, verified | Format-Table -AutoSize
}
finally {
  Close-AuthenticatedSession -Context $super
}
