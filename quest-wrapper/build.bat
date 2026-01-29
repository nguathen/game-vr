@echo off
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set ANDROID_HOME=C:\Users\zohof\AppData\Local\Android\Sdk
cd /d C:\Users\zohof\Desktop\projects\vr\quest-wrapper
echo Building APK... > build-log.txt 2>&1
call C:\Users\zohof\.gradle\wrapper\dists\gradle-8.13-bin\5xuhj0ry160q40clulazy9h7d\gradle-8.13\bin\gradle.bat --no-daemon assembleDebug >> build-log.txt 2>&1
echo Exit code: %ERRORLEVEL% >> build-log.txt 2>&1
dir /s /b *.apk >> build-log.txt 2>&1
