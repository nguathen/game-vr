# Build TWA APK and deploy to Quest via ADB.
# Run from repo root: .\build-deploy-quest.ps1
# Options: -SkipDeploy (build only), -SkipClean (do not clean app/build)

param(
    [switch]$SkipDeploy,
    [switch]$SkipClean
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$questWrapper = Join-Path $scriptDir "quest-wrapper"
$gradlew = Join-Path $questWrapper "gradlew.bat"
$apkPath = Join-Path $questWrapper "app\build\outputs\apk\release\app-release.apk"

# Fallbacks for JAVA_HOME / ANDROID_HOME
$defaultJbr = "C:\Program Files\Android\Android Studio\jbr"
if (-not $env:JAVA_HOME -or -not (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
    if (Test-Path "$defaultJbr\bin\java.exe") { $env:JAVA_HOME = $defaultJbr }
}
if (-not $env:JAVA_HOME -or -not (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
    Write-Error "JAVA_HOME not set or invalid. Set JAVA_HOME to Android Studio jbr path."
    exit 1
}
if (-not $env:ANDROID_HOME) { $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk" }

if (-not (Test-Path $gradlew)) {
    Write-Error "gradlew.bat not found at $gradlew"
    exit 1
}

if (-not $SkipClean) {
    $appBuild = Join-Path $questWrapper "app\build"
    if (Test-Path $appBuild) {
        Remove-Item -Recurse -Force $appBuild -ErrorAction SilentlyContinue
    }
}

Push-Location $questWrapper
try {
    & $gradlew --no-daemon assembleRelease
    $buildOk = ($LASTEXITCODE -eq 0)
} finally {
    Pop-Location
}

if (-not $buildOk) {
    Write-Host "Build failed." -ForegroundColor Red
    exit 1
}

Write-Host "APK built: $apkPath" -ForegroundColor Green

if ($SkipDeploy) {
    Write-Host "Skip deploy (use -SkipDeploy to keep this behavior)."
    exit 0
}

if (-not (Test-Path $apkPath)) {
    Write-Error "APK not found at $apkPath"
    exit 1
}

Write-Host "Installing on Quest via ADB..." -ForegroundColor Yellow
& adb install -r $apkPath
if ($LASTEXITCODE -ne 0) {
    Write-Host "ADB install failed. Is Quest connected and USB debugging on?" -ForegroundColor Red
    exit 1
}
Write-Host "Deploy done." -ForegroundColor Green
exit 0
