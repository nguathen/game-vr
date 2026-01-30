$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "C:\Users\zohof\AppData\Local\Android\Sdk"

Remove-Item -Recurse -Force "C:\Users\zohof\Desktop\projects\vr\quest-wrapper\app\build" -ErrorAction SilentlyContinue

& "C:\Users\zohof\.gradle\wrapper\dists\gradle-8.13-bin\5xuhj0ry160q40clulazy9h7d\gradle-8.13\bin\gradle.bat" --no-daemon -p "C:\Users\zohof\Desktop\projects\vr\quest-wrapper" assembleRelease

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nAPK built successfully!" -ForegroundColor Green
    $apk = "C:\Users\zohof\Desktop\projects\vr\quest-wrapper\app\build\outputs\apk\release\app-release.apk"
    Write-Host "APK: $apk"

    # Install via ADB
    Write-Host "`nInstalling on Quest via ADB..." -ForegroundColor Yellow
    adb install -r $apk
} else {
    Write-Host "Build failed!" -ForegroundColor Red
}
