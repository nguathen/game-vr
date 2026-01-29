$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "C:\Users\zohof\AppData\Local\Android\Sdk"
Set-Location "C:\Users\zohof\Desktop\projects\vr\quest-wrapper"
Write-Output "Building APK..."
& "C:\Users\zohof\.gradle\wrapper\dists\gradle-8.13-bin\5xuhj0ry160q40clulazy9h7d\gradle-8.13\bin\gradle.bat" --no-daemon assembleDebug 2>&1
Write-Output "Done"
Get-ChildItem -Recurse -Filter "*.apk" | Select-Object FullName
