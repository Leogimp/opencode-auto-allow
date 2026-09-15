$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$pluginFile = Join-Path $repoRoot "tui.tsx"
if (-not (Test-Path -LiteralPath $pluginFile)) {
    throw "Plugin source not found: $pluginFile"
}

$configDir = Join-Path $env:USERPROFILE ".config\opencode"
$configFile = Join-Path $configDir "tui.json"
if (-not (Test-Path -LiteralPath $configDir)) {
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
}

$spec = $pluginFile.Replace('\', '\\')
$raw = $null
if (Test-Path -LiteralPath $configFile) {
    $raw = Get-Content -LiteralPath $configFile -Raw
}

if ($null -ne $raw -and $raw.Contains($spec)) {
    Write-Host "Already registered in $configFile"
    exit 0
}

if ($null -eq $raw -or $raw.Trim() -eq "") {
    $raw = "{`n  `"`$schema`": `"https://opencode.ai/tui.json`",`n  `"plugin`": [`n    `"$spec`"`n  ]`n}"
    Set-Content -LiteralPath $configFile -Value $raw -Encoding UTF8
    Write-Host "Created $configFile with plugin entry"
    exit 0
}

if ($raw -match '"plugin"\s*:\s*\[') {
    $raw = $raw -replace '"plugin"\s*:\s*\[', ('"plugin": [' + "`n    `"$spec`",")
    Set-Content -LiteralPath $configFile -Value $raw -Encoding UTF8
    Write-Host "Registered $pluginFile in $configFile"
    exit 0
}

$raw = $raw -replace '^\s*\{', ('{' + "`n  `"plugin`": [`n    `"$spec`"`n  ],")
Set-Content -LiteralPath $configFile -Value $raw -Encoding UTF8
Write-Host "Registered $pluginFile in $configFile"
