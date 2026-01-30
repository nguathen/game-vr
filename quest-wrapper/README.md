# Quest TWA Wrapper

APK wrapper to deploy the web app to Meta Quest Store as a Trusted Web Activity (TWA).

## Prerequisites

- Android Studio (for JDK and Android SDK)
- Gradle 8.13
- `ovr-platform-util.exe` (Meta's upload tool)
- Nginx reverse proxy (`vr.proxyit.online` → `localhost:3001`)

## Project Structure

```
quest-wrapper/
├── app/
│   ├── build.gradle              # TWA config, dependencies, tunnel URL
│   ├── src/main/
│   │   ├── AndroidManifest.xml   # Quest VR manifest with billing components
│   │   ├── java/com/nvr/vrquest/
│   │   │   ├── LauncherActivity.java   # TWA launcher (extends androidbrowserhelper)
│   │   │   ├── Application.java        # App class
│   │   │   └── DelegationService.java  # Billing + Platform SDK handlers
│   │   └── res/
│   │       ├── values/strings.xml      # Asset statements (domain verification)
│   │       ├── values/colors.xml
│   │       ├── xml/filepaths.xml
│   │       ├── xml/shortcuts.xml
│   │       ├── drawable/splash.png
│   │       └── mipmap-hdpi/ic_launcher.png
├── build.gradle                  # Root build (AGP 8.7.3)
├── gradle.properties             # AndroidX enabled
├── settings.gradle
├── ovr-platform-util.exe         # Meta upload tool
└── upload.ps1                    # Upload script
```

## Key Dependencies

```groovy
implementation 'com.meta.androidbrowserhelper:androidbrowserhelper:2.5.0'
implementation 'com.meta.androidbrowserhelper:horizonplatformsdk:1.1.0'
implementation 'com.meta.androidbrowserhelper:horizonpermissions:1.0.0'
implementation 'com.meta.androidbrowserhelper:horizonbilling:1.0.0-alpha11'
```

## Step-by-Step Build & Deploy

### 1. Start Dev Server

```bash
npm run dev
```

Server runs on `http://localhost:3001`.

### 2. Build APK

**Bump `versionCode`** each time you upload (Meta rejects duplicate version codes).

Hostname is set to `vr.proxyit.online` in `build.gradle`, `strings.xml`, and `manifest.json`.

```bat
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set ANDROID_HOME=C:\Users\zohof\AppData\Local\Android\Sdk
cd quest-wrapper
gradle --no-daemon assembleDebug
```

Output: `app/build/outputs/apk/debug/app-debug.apk`

### 5. Upload to Meta Store (ALPHA Channel)

```bat
ovr-platform-util.exe upload-quest-build ^
  --app-id 34536747552582674 ^
  --app-secret 1a691ec84398748160a621b25ccb8941 ^
  --apk app/build/outputs/apk/debug/app-debug.apk ^
  --channel ALPHA ^
  --age-group TEENS_AND_ADULTS
```

### 6. Install on Quest

Option A — **Via ADB**:
```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

Option B — **Via Meta Store**: Add yourself as alpha tester in Meta Developer Dashboard, then install from Quest Store.

## Meta App Info

| Field | Value |
|-------|-------|
| App ID | 34536747552582674 |
| Package | com.nvr.vrquest |
| Platform | ANDROID_6DOF |
| Compile SDK | 32 |
| Target SDK | 32 |
| Min SDK | 29 |

## IAP Add-ons

| SKU | Type | Price | Meta ID |
|-----|------|-------|---------|
| coin_pack_100 | Consumable | $0.99 | 1931951704084280 |
| coin_pack_500 | Consumable | $3.99 | 1407190347865657 |
| premium_unlock | Durable | $4.99 | 1875017593156560 |

## How It Works

This is a **Trusted Web Activity** (TWA) — not a WebView. The app uses Meta's forked `androidbrowserhelper` library which launches your web app inside the Quest's built-in browser with full Digital Goods API support for IAP.

Key components:
- **LauncherActivity** — opens the TWA pointing to `vr.proxyit.online`
- **DelegationService** — registers billing and platform SDK handlers
- **PaymentActivity/PaymentService** — handles `org.chromium.intent.action.PAY` for Quest billing
- **horizonos.pwa.APP_MODE** — set to `immersive` for VR mode

## Troubleshooting

- **"Horizon SDK not found"** on upload: Make sure you're using the TWA structure with `androidbrowserhelper` library (not a plain WebView).
- **Hostname change**: Update `hostName`, `fullScopeUrl` in build.gradle + `assetStatements` in strings.xml + `ovr_scope_url` in manifest.json, bump `versionCode`, rebuild & re-upload.
- **Build fails**: Ensure `android.useAndroidX=true` in `gradle.properties`.
