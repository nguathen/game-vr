# Portable build for current user. Set JAVA_HOME and ANDROID_HOME if not set.
$defaultJbr = "C:\Program Files\Android\Android Studio\jbr"
if (-not $env:JAVA_HOME -or -not (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
    if (Test-Path "$defaultJbr\bin\java.exe") { $env:JAVA_HOME = $defaultJbr }
}
if (-not $env:JAVA_HOME -or -not (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
    Write-Error "JAVA_HOME not set or invalid. Install JDK (e.g. Android Studio) and set JAVA_HOME to jbr path."
    exit 1
}
if (-not $env:ANDROID_HOME) { $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk" }
Set-Location $PSScriptRoot

$gradlew = Join-Path $PSScriptRoot "gradlew.bat"
if (-not (Test-Path $gradlew)) {
    Write-Error "gradlew.bat not found. Add Gradle Wrapper to project."
    exit 1
}
Write-Output "Building APK..."
& $gradlew --no-daemon assembleDebug 2>&1
Write-Output "Done"
Get-ChildItem -Recurse -Filter "*.apk" -ErrorAction SilentlyContinue | Select-Object FullName
