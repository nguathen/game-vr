# Meta Quest Store Submission Guide

> Quick reference for submitting apps to Meta Quest Store.
> Based on NVR IAP Test submission (Jan 29, 2026).

---

## Prerequisites

1. **Meta Developer Account** with organization created
2. **App created** on Meta Developer Dashboard
3. **APK uploaded** to at least ALPHA channel via `ovr-platform-util.exe`
4. **IARC content rating** (created during submission)
5. **Privacy Policy URL** (publicly accessible, e.g. Google Sites)

## Assets Needed

| Asset | Size | Notes |
|-------|------|-------|
| App Icon | 512x512 PNG | **Must have solid background** (no transparency) |
| Landscape Cover | 2560x1440 PNG | Main store image |
| Square Cover | 1440x1440 PNG | |
| Portrait Cover | 1008x1440 PNG | |
| Hero Cover | 3000x900 PNG | Has safe area - important content in center |
| Screenshots | 2560x1440 PNG | Min 3, max 8. Can upload multiple at once |

## Submission Steps

### 1. App Metadata Tab

Complete 6 sections in order:

#### Name
- App Name (max 50 chars)
- Short Description (max 150 chars, no special chars at start)

#### Categorization
- Category (e.g. Games > Action)
- Select all supported input methods
- Supported languages

#### Specs
- Supported Quest headsets (Quest 2, 3, Pro)
- Internet requirement
- Supported orientations
- Space requirements
- Search keywords (single words only, no spaces in keywords)

#### Details
- Developer name (auto from team)
- Publisher name
- **Website URL** (required - can use same as privacy policy)
- **Privacy Policy URL** (required - must be publicly accessible)
- External support link (optional)
- Terms of Service (optional)

#### Assets
- Upload all images (see table above)
- Icon requires solid background, no transparency
- Hero cover has safe area preview - check before confirming

#### Content Rating
- Set Country of Origin
- Set Developer Contact Email
- Click "Add Certificate" → "Request new"
- Complete IARC questionnaire (opens in new tab):
  - App type, violence, fear, sexuality, gambling, language, substances, humor
  - Digital purchases (yes if IAP)
  - User interaction, location sharing
- After completing → certificate auto-created with ratings for all regions

### 2. Pricing Tab

- Listing Type: **Full release** (cannot change after submission)
- Price: Select from dropdown (Free, $0.99, $1.99, etc.)

### 3. Build Tab

- Build must be in **Production Channel** with **Draft** status
- If build is only in ALPHA:
  1. Go to Release Channels → Production (Store)
  2. Channel Actions → Change Current Build
  3. Select build → Status: Draft → Submit
- Back in Build tab: select the build from dropdown
- "Does your app contain ads?" (auto-set based on build)

### 4. Submission Tab

- Contact Email (for Meta review team, not public)
- Test credentials: Yes/No
- Notes for Reviewer (optional)
- **Confirm app sharing preferences** (click "View preferences" → Confirm)
  - Default: Casting, Livestreaming, Video recording enabled

### 5. Submit

- Click **Save Changes** first
- Then **Submit for Review**
- Status changes to "Submitted"

## Post-Submission

- Wait for Meta review (typically days)
- Once approved → choose to release immediately or schedule
- Between approval and release, users can wishlist
- Prices locked for 30 days after approval

## Common Issues

| Issue | Fix |
|-------|-----|
| Icon rejected "solid background" | Use RGB mode, draw solid rect before icon content |
| Privacy Policy URL invalid | Use Google Sites or GitHub Pages (must be publicly reachable) |
| Keywords rejected | Use single words only, no multi-word phrases |
| Build dropdown disabled | Add build to Production channel first (not just ALPHA) |
| Submit button disabled | Check all tabs are complete, sharing preferences confirmed |

## CLI Upload Command

```powershell
.\ovr-platform-util.exe upload-quest-build `
    --app-id <APP_ID> `
    --app-secret <APP_SECRET> `
    --apk "path\to\app-release.apk" `
    --channel ALPHA `
    --age-group TEENS_AND_ADULTS
```

## Dashboard URL

```
https://developers.meta.com/horizon/manage/applications/<APP_ID>/submissions/
```
