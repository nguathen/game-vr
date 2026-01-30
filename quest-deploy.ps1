# Quest VR Deploy Script
# Usage:
#   .\quest-deploy.ps1                    # Full deploy (build + tunnel + APK + install)
#   .\quest-deploy.ps1 -SkipApk           # Code change only (build + sync components + restart app)
#   .\quest-deploy.ps1 -TunnelUrl "https://xxx.trycloudflare.com"  # Reuse existing tunnel
#   .\quest-deploy.ps1 -Quick             # Fastest: just build web + restart app (no APK, no tunnel)
#   .\quest-deploy.ps1 -RestartServer     # Kill old server + start new one (use after editing server/ code)

param(
    [string]$TunnelUrl = "",
    [switch]$SkipApk,
    [switch]$Quick,
    [switch]$RestartServer
)

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot
$QuestWrapper = Join-Path $ProjectRoot "quest-wrapper"
$ADB = "C:\Users\zohof\AppData\Local\Android\Sdk\platform-tools\adb.exe"
$GradleBat = "C:\Users\zohof\.gradle\wrapper\dists\gradle-8.13-bin\5xuhj0ry160q40clulazy9h7d\gradle-8.13\bin\gradle.bat"
$AppPackage = "com.nvr.iaptest"
$BrowserPackage = "com.oculus.browser"

$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "C:\Users\zohof\AppData\Local\Android\Sdk"

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
$devices = & $ADB devices 2>&1
if ($devices -notmatch "\bdevice\b") {
    Write-Err "No Quest device connected. Check ADB."
    exit 1
}
Write-OK "Quest connected"

if ($Quick) { $SkipApk = $true }

$totalSteps = if ($SkipApk) { 3 } else { 6 }
$step = 0

# --- Step: Sync A-Frame components to public/ ---
$step++
Write-Step $step $totalSteps "Syncing A-Frame components to public/"
$srcComponents = Join-Path $ProjectRoot "src\js\components"
$pubComponents = Join-Path $ProjectRoot "public\js\components"
if (!(Test-Path $pubComponents)) { New-Item -ItemType Directory -Path $pubComponents -Force | Out-Null }
Copy-Item "$srcComponents\*" $pubComponents -Force
Write-OK "Components synced"

# --- Step: Vite build ---
$step++
Write-Step $step $totalSteps "Building frontend (Vite)"
Set-Location $ProjectRoot
$buildResult = node -e "const {build} = require('vite'); build().then(() => { console.log('BUILD_OK'); process.exit(0); }).catch(e => { console.error(e.message); process.exit(1); })" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Err "Vite build failed!"
    Write-Host $buildResult
    exit 1
}
Write-OK "dist/ built"

if (-not $Quick) {
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

    # --- Step: Tunnel ---
    if (-not $SkipApk -or -not $TunnelUrl) {
        $step++
        if ($TunnelUrl) {
            Write-Step $step $totalSteps "Using provided tunnel"
            Write-OK $TunnelUrl
        } else {
            Write-Step $step $totalSteps "Starting Cloudflare tunnel"
            $tunnelLog = Join-Path $ProjectRoot "tunnel-log.txt"
            if (Test-Path $tunnelLog) { Remove-Item $tunnelLog }
            Start-Process -FilePath "npx.cmd" -ArgumentList "--yes","cloudflared","tunnel","--url","http://localhost:3001" -RedirectStandardError $tunnelLog -WindowStyle Hidden

            $maxWait = 30
            $waited = 0
            while ($waited -lt $maxWait) {
                Start-Sleep -Seconds 2
                $waited += 2
                if (Test-Path $tunnelLog) {
                    $match = Get-Content $tunnelLog | Select-String "https://[a-z0-9-]+\.trycloudflare\.com"
                    if ($match) {
                        $TunnelUrl = $match.Matches[0].Value.Trim()
                        break
                    }
                }
            }
            if (-not $TunnelUrl) {
                Write-Err "Tunnel failed after ${maxWait}s"
                exit 1
            }
            Write-OK "Tunnel: $TunnelUrl"
        }
    }

    if (-not $SkipApk) {
        $hostname = ($TunnelUrl -replace 'https://','').Trim().TrimEnd('/')

        # --- Step: Update TWA + build APK ---
        $step++
        Write-Step $step $totalSteps "Building APK"

        # Update build.gradle
        $buildGradle = Join-Path $QuestWrapper "app\build.gradle"
        $content = Get-Content $buildGradle -Raw
        if ($content -match 'versionCode (\d+)') {
            $oldVer = [int]$Matches[1]
            $newVer = $oldVer + 1
            $content = $content -replace "versionCode $oldVer", "versionCode $newVer"
        }
        $content = $content -replace "hostName: '[^']+'", "hostName: '$hostname'"
        Set-Content $buildGradle $content

        # Update strings.xml
        $stringsXml = Join-Path $QuestWrapper "app\src\main\res\values\strings.xml"
        $strContent = Get-Content $stringsXml -Raw
        $strContent = $strContent -replace 'https://[^"]*trycloudflare\.com', "https://$hostname"
        Set-Content $stringsXml $strContent

        # Update manifest.json
        $manifest = Join-Path $ProjectRoot "src\manifest.json"
        if (Test-Path $manifest) {
            $mContent = Get-Content $manifest -Raw
            $mContent = $mContent -replace 'https://[^"]*trycloudflare\.com[^"]*', "https://$hostname/"
            Set-Content $manifest $mContent
        }

        # Clean & build
        $appBuild = Join-Path $QuestWrapper "app\build"
        if (Test-Path $appBuild) { Remove-Item -Recurse -Force $appBuild }
        & $GradleBat --no-daemon -p $QuestWrapper assembleRelease 2>&1 | Out-Null
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
if ($TunnelUrl) {
    Write-Host "Tunnel: $TunnelUrl" -ForegroundColor Gray
    Write-Host "Keep terminal open to maintain tunnel." -ForegroundColor Gray
}
Write-Host ""
