# Quest VR Deploy Script
# Usage:
#   .\quest-deploy.ps1                    # Full deploy (build + APK + install)
#   .\quest-deploy.ps1 -SkipApk           # Code change only (build + sync components + restart app)
#   .\quest-deploy.ps1 -RestartServer     # Kill old server + start new one (use after editing server/ code)

param(
    [switch]$SkipApk,
    [switch]$RestartServer
)

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot
$QuestWrapper = Join-Path $ProjectRoot "quest-wrapper"
$AppPackage = "com.nvr.vrquest"
$BrowserPackage = "com.oculus.browser"
$Hostname = "vr.proxyit.online"

# Portable paths: use env or defaults (no hardcoded user)
$defaultJbr = "C:\Program Files\Android\Android Studio\jbr"
if (-not $env:JAVA_HOME -or -not (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
    if (Test-Path "$defaultJbr\bin\java.exe") { $env:JAVA_HOME = $defaultJbr }
}
if (-not $env:ANDROID_HOME) { $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk" }
$ADB = Join-Path $env:ANDROID_HOME "platform-tools\adb.exe"
$GradleBat = Join-Path $QuestWrapper "gradlew.bat"
if (-not (Test-Path $ADB)) { Write-Host "ADB not found at $ADB. Set ANDROID_HOME." -ForegroundColor Red; exit 1 }
if (-not (Test-Path $GradleBat)) { Write-Host "gradlew.bat not found at $GradleBat." -ForegroundColor Red; exit 1 }

function Write-Step($num, $total, $msg) {
    Write-Host "`n[$num/$total] $msg" -ForegroundColor Yellow
}
function Write-OK($msg) {
    Write-Host "  $msg" -ForegroundColor Green
}
function Write-Err($msg) {
    Write-Host "  $msg" -ForegroundColor Red
}

# --- Check ADB device ---
Write-Host "=== Quest VR Deploy ===" -ForegroundColor Cyan
$ErrorActionPreference = "Continue"
$devicesRaw = & $ADB devices 2>&1
$ErrorActionPreference = "Stop"
$devices = ($devicesRaw | Out-String)
if ($devices -notmatch "\tdevice") {
    Write-Err "No Quest device connected. Check ADB."
    exit 1
}
Write-OK "Quest connected"

$totalSteps = if ($SkipApk) { 3 } else { 6 }
$step = 0

# --- Step: Sync A-Frame components to public/ ---
$step++
Write-Step $step $totalSteps "Syncing A-Frame components to public/"
$srcComponents = Join-Path $ProjectRoot "client\src\js\components"
$pubComponents = Join-Path $ProjectRoot "client\public\js\components"
if (!(Test-Path $pubComponents)) { New-Item -ItemType Directory -Path $pubComponents -Force | Out-Null }
Copy-Item "$srcComponents\*" $pubComponents -Force
Write-OK "Components synced"

# --- Step: Vite build ---
$step++
Write-Step $step $totalSteps "Building frontend (Vite)"
$clientDir = Join-Path $ProjectRoot "client"
Set-Location $clientDir
$ErrorActionPreference = "Continue"
$buildResult = node -e "const {build} = require('vite'); build().then(() => { console.log('BUILD_OK'); process.exit(0); }).catch(e => { console.error(e.message); process.exit(1); })" 2>&1
$ErrorActionPreference = "Stop"
if ($LASTEXITCODE -ne 0) {
    Write-Err "Vite build failed!"
    Write-Host ($buildResult | Out-String)
    exit 1
}
Write-OK "dist/ built"

# --- Step: Server ---
$step++
Write-Step $step $totalSteps "Checking server"
$serverOk = $false
try {
    $r = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    $serverOk = $true
} catch {}

if ($RestartServer -and $serverOk) {
    Write-Host "  Killing old server..." -ForegroundColor Gray
    Get-Process -Name "node" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -match "server[/\\]index\.js" -or $_.CommandLine -match "server\\index\.js" } |
        Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    $serverOk = $false
}

if ($serverOk) {
    Write-OK "Server already running on :3001"
} else {
    Write-Host "  Starting server..." -ForegroundColor Gray
    Start-Process -FilePath "node" -ArgumentList "server/index.js" -WorkingDirectory $ProjectRoot -WindowStyle Minimized
    Start-Sleep -Seconds 3
    Write-OK "Server started"
}

if (-not $SkipApk) {
    # --- Step: Update TWA + build APK ---
    $step++
    Write-Step $step $totalSteps "Building APK"

    # Update build.gradle (version bump)
    $buildGradle = Join-Path $QuestWrapper "app\build.gradle"
    $content = Get-Content $buildGradle -Raw
    if ($content -match 'versionCode (\d+)') {
        $oldVer = [int]$Matches[1]
        $newVer = $oldVer + 1
        $content = $content -replace "versionCode $oldVer", "versionCode $newVer"
    }
    Set-Content $buildGradle $content

    # Clean & build (gradlew is inside quest-wrapper)
    $appBuild = Join-Path $QuestWrapper "app\build"
    if (Test-Path $appBuild) { Remove-Item -Recurse -Force $appBuild }
    $prevDir = Get-Location; Set-Location $QuestWrapper
    & $GradleBat --no-daemon assembleRelease 2>&1 | Out-Null
    Set-Location $prevDir
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Gradle build failed!"
        exit 1
    }
    Write-OK "APK built (versionCode: $newVer)"

    # --- Step: Install APK ---
    $step++
    Write-Step $step $totalSteps "Installing APK on Quest"
    $apk = Join-Path $QuestWrapper "app\build\outputs\apk\release\app-release.apk"
    & $ADB install -r $apk 2>&1 | Out-Null
    Write-OK "APK installed"
}

# --- Always: Restart app on Quest ---
$step++
Write-Step $step $totalSteps "Restarting app on Quest"
& $ADB shell am force-stop $AppPackage 2>$null
& $ADB shell am force-stop $BrowserPackage 2>$null
Start-Sleep -Seconds 1
& $ADB shell monkey -p $AppPackage -c android.intent.category.LAUNCHER 1 2>$null
Write-OK "App restarted"

# --- Done ---
Write-Host "`n=== Deploy Complete ===" -ForegroundColor Cyan
Write-Host "Hostname: $Hostname" -ForegroundColor Gray
Write-Host ""
