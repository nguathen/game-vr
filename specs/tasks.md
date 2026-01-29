# Task Management

> Last Updated: 2026-01-29
> Purpose: Active work queue. Keep this file short.
> [View Completed Tasks Archive](./tasks-archive.md)

---

## Overview

| Status | Count |
|--------|-------|
| In Progress | 0 |
| Pending | 0 |
| Completed | 8 |

> Note: TASK-001 (Unity) deprecated. TASK-010~014 completed (WebXR app).
> TASK-015~016 completed (Meta IAP integration + TWA APK upload to ALPHA).

---

## In Progress

_None_

---

## Pending

### TASK-017: Production Hosting Setup
**Priority:** Critical
**Status:** Completed ✅ (2026-01-29)
**Assignee:** /dev
**Dependencies:** None

**Description:**
Deploy web app to stable production hosting (thay thế Cloudflare quick tunnel):
- Deploy frontend (Vite build) + backend (Express) to a stable host (VPS/Cloudflare Workers/Vercel)
- HTTPS with stable domain (không thay đổi mỗi lần restart)
- Update TWA APK `hostName` và `fullScopeUrl` với production domain
- Rebuild & re-upload APK to Meta Store

**Acceptance Criteria:**
- [ ] Web app accessible via stable HTTPS URL
- [ ] TWA APK points to production URL
- [ ] APK uploaded to Meta ALPHA channel with production URL
- [ ] App loads correctly on Quest

---

### TASK-018: Meta Quest Store Submission
**Priority:** High
**Status:** Completed ✅ (2026-01-29)
**Assignee:** /dev
**Dependencies:** TASK-017

**Description:**
Hoàn tất store submission trên Meta Developer Dashboard:
- Upload app icon, screenshots, cover image
- Fill store listing (description, category, tags)
- Set content rating
- Configure pricing (free app with IAP)
- Submit for review (ALPHA → production release)

**Acceptance Criteria:**
- [x] Store listing complete (icon, screenshots, description)
- [x] Content rating configured (IARC Certificate: 7db5425c-6e00-4808-a51d-015aac50502b)
- [x] App submitted for review (Jan 29, 2026)
- [ ] IAP add-ons visible in store (pending review approval)

---

### TASK-019: App Icon & Splash Screen
**Priority:** Medium
**Status:** Completed ✅ (2026-01-29)
**Assignee:** /dev
**Dependencies:** None

**Description:**
Replace placeholder icons with real assets:
- App icon (512x512 PNG) cho Quest Store + APK
- Splash screen image cho TWA loading
- Store cover image (landscape)
- Screenshots từ Quest (in-game)

**Acceptance Criteria:**
- [ ] Real app icon in APK (mipmap-hdpi/ic_launcher.png)
- [ ] Real splash screen (drawable/splash.png)
- [ ] Store assets ready for submission

---

### TASK-020: Release Signing Key
**Priority:** High
**Status:** Completed ✅ (2026-01-29)
**Assignee:** /dev
**Dependencies:** None

**Description:**
Tạo release signing key và build release APK:
- Generate production keystore (không dùng debug key)
- Configure release build type in build.gradle
- Build signed release APK
- Upload release APK to Meta Store
- Backup keystore securely (mất key = không update app được)

**Acceptance Criteria:**
- [ ] Production keystore generated & backed up
- [ ] Release APK builds successfully
- [ ] Release APK uploaded to Meta Store
- [ ] Keystore stored securely (not in git)

---

## Recently Completed

| Task | Title | Completed |
|------|-------|-----------|
| TASK-010 | Project Setup (WebXR + A-Frame) | 2026-01-29 |
| TASK-011 | VR Game Scene + Player Controls | 2026-01-29 |
| TASK-012 | Target Shooting Game Logic | 2026-01-29 |
| TASK-013 | IAP Backend + Stripe Integration | 2026-01-29 |
| TASK-014 | Main Menu + Polish | 2026-01-29 |
| TASK-015 | Meta Digital Goods API Integration | 2026-01-29 |
| TASK-016 | TWA APK Build + Meta Store Upload | 2026-01-29 |
| TASK-019 | App Icon & Splash Screen | 2026-01-29 |
| TASK-020 | Release Signing Key | 2026-01-29 |
| TASK-018 | Meta Quest Store Submission | 2026-01-29 |

[View all completed tasks →](./tasks-archive.md)
