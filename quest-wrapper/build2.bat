@echo off
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set ANDROID_HOME=C:\Users\zohof\AppData\Local\Android\Sdk
cd /d C:\Users\zohof\Desktop\projects\vr\quest-wrapper
call C:\Users\zohof\.gradle\wrapper\dists\gradle-8.13-bin\5xuhj0ry160q40clulazy9h7d\gradle-8.13\bin\gradle.bat --no-daemon assembleDebug > build-log2.txt 2>&1
echo EXIT: %ERRORLEVEL% >> build-log2.txt 2>&1
