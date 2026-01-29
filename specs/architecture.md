# Architecture

> Status: Active
> Last Updated: 2026-01-29

---

## 1. Project Overview

**VR Quest Game** — Game VR đơn giản chạy trên Meta Quest Browser, hỗ trợ In-App Purchase (IAP).

**Target Platform:** Meta Quest 2/3/Pro (Quest Browser — WebXR)
**Genre:** Simple VR Game (target shooting mini-game)
**Monetization:** IAP via Web Monetization / custom payment flow
**Access:** Hosted web app, truy cập qua Quest Browser

---

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | A-Frame 1.6 (WebXR) |
| Language | JavaScript (ES Modules) |
| 3D Engine | Three.js (via A-Frame) |
| Physics | aframe-physics-system (cannon.js) |
| UI | A-Frame HTML UI / custom VR panels |
| IAP Backend | Node.js + Express (REST API) |
| Database | SQLite (via better-sqlite3) |
| Payment | Meta Digital Goods API (Quest) / Stripe (dev fallback) |
| Dev Server | Vite |
| Deploy | TWA APK via Meta Quest Store (ALPHA channel) |
| Tunnel | Cloudflare Tunnel (dev) → production hosting TBD |

---

## 3. Directory Structure

```
vr/
├── .claude/                    # Claude Code configuration
├── specs/                      # Specifications and tracking
├── src/
│   ├── index.html              # Entry point - Main Menu
│   ├── game.html               # Game scene
│   ├── shop.html               # IAP Shop
│   ├── css/
│   │   └── style.css           # UI styling
│   ├── js/
│   │   ├── core/
│   │   │   ├── game-manager.js     # Game state machine
│   │   │   ├── scene-manager.js    # Scene transitions
│   │   │   └── audio-manager.js    # Sound effects
│   │   ├── player/
│   │   │   └── vr-controls.js      # VR controller input
│   │   ├── game/
│   │   │   ├── target-system.js    # Target spawning & hit detection
│   │   │   └── score-manager.js    # Score tracking (localStorage)
│   │   ├── iap/
│   │   │   ├── iap-manager.js      # Purchase flow (client)
│   │   │   └── iap-products.js     # Product definitions
│   │   └── components/
│   │       ├── grabbable.js        # A-Frame grab component
│   │       ├── target.js           # A-Frame target component
│   │       └── vr-ui-button.js     # VR interactive button
│   └── assets/
│       ├── models/                 # 3D models (.glb)
│       ├── sounds/                 # Audio files
│       └── textures/               # Images/textures
├── server/
│   ├── index.js                # Express server
│   ├── routes/
│   │   └── iap.js              # IAP endpoints
│   ├── db/
│   │   └── database.js         # SQLite setup
│   └── middleware/
│       └── auth.js             # Simple auth
├── package.json
├── vite.config.js
└── SETUP.md
```

---

## 4. Core Services

### GameManager (game-manager.js)
- State machine: Menu → Playing → Paused → GameOver
- Save/load progress via localStorage

### TargetSystem (target-system.js)
- Spawn targets ở random positions trong VR space
- Hit detection khi player bắn/chạm target
- Scoring: +10 points mỗi target

### IAPManager (iap-manager.js)
- Client-side: hiển thị products, gọi API mua hàng
- Redirect tới Stripe Checkout
- Webhook nhận kết quả payment
- Grant items sau khi payment success

### ScoreManager (score-manager.js)
- Track current score, high score
- Coins balance (dùng cho IAP items)
- Persist via localStorage

---

## 5. Data Models

### Player Data (localStorage)
```json
{
  "highScore": 0,
  "coins": 0,
  "isPremium": false,
  "purchasedItems": []
}
```

### IAP Product
```javascript
{
  id: "coin_pack_100",
  name: "100 Coins",
  description: "Get 100 coins to unlock extras",
  price: 0.99,          // USD
  type: "consumable",   // consumable | non_consumable
  coinAmount: 100       // for consumable
}
```

### Purchase Record (SQLite)
```sql
CREATE TABLE purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  stripe_session TEXT,
  status TEXT DEFAULT 'pending',  -- pending, completed, failed
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. Game Flow

```
Quest Browser → index.html (Main Menu)
    ↓ Enter VR          ↓ Shop
game.html             shop.html
    ↓                    ↓
Target Shooting     Stripe Checkout
    ↓                    ↓
Game Over →         Webhook → Grant
Score + Retry         Item → Save
```

---

## 7. API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/products | Danh sách IAP products |
| POST | /api/checkout | Tạo Stripe checkout session |
| POST | /api/webhook | Stripe webhook (payment result) |
| GET | /api/purchases/:sessionId | Check purchase status |

---

## 8. External Integrations

| Service | Purpose | Integration |
|---------|---------|-------------|
| Meta Digital Goods API | IAP on Quest | PaymentRequest API + horizonbilling |
| Meta Quest Store | App distribution | TWA APK via ovr-platform-util |
| Cloudflare Tunnel | Dev HTTPS tunnel | npx cloudflared |
| Stripe | Dev mode fallback | Stripe Checkout (localhost only) |

---

## 9. Configuration

| Key | Source | Note |
|-----|--------|------|
| STRIPE_SECRET_KEY | .env | Stripe API key |
| STRIPE_WEBHOOK_SECRET | .env | Webhook verification |
| PORT | .env | Server port (default 3000) |

---

## ADRs (Architecture Decision Records)

### ADR-001: Unity cho VR Development
**Status:** Deprecated
**Date:** 2026-01-29
**Note:** Chuyển sang WebXR, xem ADR-002.

### ADR-002: WebXR (A-Frame) thay thế Unity
**Status:** Accepted
**Date:** 2026-01-29

**Context:** Unity cần GUI editor, không phù hợp với CLI-based development workflow. Cần giải pháp có thể code và test hoàn toàn từ terminal.

**Decision:** Dùng A-Frame (WebXR) + Node.js backend. IAP qua Stripe thay vì Meta Quest Store.

**Consequences:**
- Positive: Code hoàn toàn từ CLI, test trên browser, deploy dễ dàng
- Positive: Không cần Meta Developer account cho IAP (dùng Stripe)
- Positive: Cross-platform (Quest Browser, PC VR, mobile AR)
- Negative: Performance thấp hơn native Unity (nhưng đủ cho game đơn giản)
- Negative: Không có Meta Quest Store distribution (phải host web riêng)
- Risks: WebXR trên Quest Browser có thể có quirks

**Alternatives Considered:**
1. Unity — deprecated: cần GUI editor
2. Babylon.js — rejected: A-Frame dễ dùng hơn cho VR, declarative HTML

### ADR-003: Meta Digital Goods API thay thế Stripe cho Quest IAP
**Status:** Accepted
**Date:** 2026-01-29

**Context:** Stripe Checkout không hoạt động trong Quest TWA. Meta yêu cầu dùng Digital Goods API cho IAP trên Quest Store.

**Decision:** Dùng Meta Digital Goods API (PaymentRequest API + `https://store.meta.com/billing`) cho production. Giữ dev mode fallback (instant grant) khi chạy localhost.

**Consequences:**
- Positive: IAP hoạt động native trên Quest Store
- Positive: Meta handle payment processing, refunds
- Negative: Chỉ hoạt động trên Quest (không cross-platform)
- Negative: Cần TWA APK wrapper, không chạy standalone web

### ADR-004: TWA (Trusted Web Activity) cho Quest Store Distribution
**Status:** Accepted
**Date:** 2026-01-29

**Context:** Meta Quest Store yêu cầu APK có Horizon SDK. Plain WebView APK bị reject ("Horizon SDK not found").

**Decision:** Dùng Meta's forked androidbrowserhelper library để build TWA APK. App mở trong Quest's built-in browser với full Digital Goods API support.

**Consequences:**
- Positive: Pass Meta's server-side APK validation
- Positive: Full billing integration (PaymentActivity, PaymentService)
- Negative: Tunnel URL hardcoded, cần rebuild khi URL thay đổi
- Risk: Production cần stable hosting (không dùng Cloudflare quick tunnel)

### ADR Template

```markdown
### ADR-XXX: [Title]

**Status:** Proposed | Accepted | Deprecated
**Date:** YYYY-MM-DD

**Context:**
Why is this decision needed?

**Decision:**
What was decided?

**Consequences:**
- Positive: ...
- Negative: ...
- Risks: ...

**Alternatives Considered:**
1. Option A - rejected because...
2. Option B - rejected because...
```
