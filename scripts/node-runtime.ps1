function Initialize-ProjectNode {
  $candidateExecutables = @(
    'E:\DevCache\npm-cache\_npx\1c56de6e9acc34f8\node_modules\node\bin\node.exe',
    (Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe')
  )

  $currentCommand = Get-Command node -ErrorAction SilentlyContinue
  if ($currentCommand) {
    $candidateExecutables = @($currentCommand.Source) + $candidateExecutables
  }

  foreach ($candidate in $candidateExecutables | Select-Object -Unique) {
    if (-not (Test-Path -LiteralPath $candidate)) {
      continue
    }

    $versionText = & $candidate -p 'process.versions.node'
    $version = [version]$versionText
    $supported =
      (($version.Major -eq 22) -and ($version -ge [version]'22.22.3')) -or
      (($version.Major -eq 24) -and ($version -ge [version]'24.15.0')) -or
      ($version.Major -ge 26)

    if ($supported) {
      $nodeDirectory = Split-Path -Parent $candidate
      $env:PATH = "$nodeDirectory;$env:PATH"
      Write-Host "Node runtime: $versionText ($candidate)"
      return
    }
  }

  throw 'Node 22.22.3+, 24.15.0+ or 26+ is required. No supported runtime was found.'
}
