[CmdletBinding()]
param(
  [Parameter(Mandatory)]
  [uri]$BaseUrl,
  [switch]$AllowInsecureLocal,
  [switch]$AllowSelfSigned
)

$ErrorActionPreference = 'Stop'
if (-not $BaseUrl.IsAbsoluteUri) { throw 'BaseUrl must be absolute.' }
if ($BaseUrl.Scheme -ne 'https' -and -not $AllowInsecureLocal) {
  throw 'Staging smoke requires HTTPS. Use -AllowInsecureLocal only for 127.0.0.1.'
}
if ($AllowInsecureLocal -and -not @('127.0.0.1', 'localhost').Contains($BaseUrl.Host)) {
  throw '-AllowInsecureLocal is restricted to loopback hosts.'
}

$requestOptions = @{ UseBasicParsing = $true }
if ($AllowSelfSigned) { $requestOptions.SkipCertificateCheck = $true }
$root = $BaseUrl.AbsoluteUri.TrimEnd('/')
$health = Invoke-WebRequest @requestOptions -Uri "$root/healthz"
if ($health.StatusCode -ne 200 -or $health.Content.Trim() -ne 'ok') {
  throw "Frontend health check failed with status $($health.StatusCode)."
}
$login = Invoke-WebRequest @requestOptions -Uri "$root/login"
if (
  $login.StatusCode -ne 200 -or
  $login.Content -notmatch 'Neko Đoàn' -or
  $login.Content -notmatch 'brand/neko-doan-v1/neko-doan-mark.svg'
) {
  throw 'Login shell does not expose the expected Neko Đoàn identity.'
}

$requiredHeaders = @(
  'Content-Security-Policy',
  'Referrer-Policy',
  'X-Content-Type-Options',
  'X-Frame-Options',
  'Permissions-Policy',
  'X-Robots-Tag'
)
if ($BaseUrl.Scheme -eq 'https') { $requiredHeaders += 'Strict-Transport-Security' }
foreach ($header in $requiredHeaders) {
  if (-not $login.Headers.ContainsKey($header)) { throw "Missing security header: $header" }
}
if ($login.Headers['X-Robots-Tag'] -notmatch 'noindex') {
  throw 'X-Robots-Tag does not block the internal application from indexing.'
}

try {
  $session = Invoke-WebRequest @requestOptions -Uri "$root/api/auth/session"
  throw "Anonymous session endpoint unexpectedly returned $($session.StatusCode)."
}
catch {
  if ($_.Exception.Response.StatusCode.value__ -ne 401) { throw }
}

Write-Host "Staging smoke passed: $root"
