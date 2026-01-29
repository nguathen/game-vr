@echo off
set JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.17.10-hotspot
set ANDROID_HOME=C:\Users\nguag\AppData\Local\Android\Sdk
cd /d C:\Users\nguag\OneDrive\Desktop\projects\game-vr\quest-wrapper
call C:\Users\nguag\.gradle\wrapper\dists\gradle-8.13-bin\5xuhj0ry160q40clulazy9h7d\gradle-8.13\bin\gradle.bat --no-daemon assembleDebug 2>&1
echo EXIT: %ERRORLEVEL%
