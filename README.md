# GrociGO 🥬

> Grocery e-commerce platform with **customer mobile/web app** + **staff/admin web portal** in one codebase.

## What's inside

| Surface | URL | Login | Tech |
|---|---|---|---|
| **Customer app** (mobile + web) | `/` | Google (Emergent) | React Native / Expo Router |
| **Staff/Admin portal** | `/portal/login` | Admin: Google · Staff: ID + password | Same project, web-optimised layouts |

## Features

### Customer
- Google sign-in (no passwords)
- Browse categories (vegetables hidden by default; admin can unhide)
- Search, product detail, cart, checkout
- Payments: **Cash on Delivery** + **Razorpay** (UPI / Cards / NetBanking / Wallets) — admin pastes their Razorpay keys in Shop Settings
- Live animated delivery tracking with ETA + timeline
- Order history + downloadable bill receipt

### Staff (ID + password issued by admin)
- View orders, advance status, print bill slips
- Edit catalog (name, image, description, unit, stock, category)
- ❌ Cannot edit prices, discounts, or list/delist products

### Admin (Google login from allowlisted Gmail)
- Everything staff can do, plus:
- Set prices, discounts, list/delist products
- Create & manage staff (auto-generates `STF######` ID + 10-char password)
- Live dashboard, balance sheet (7/14/30 days), CSV export of orders
- Customise theme (color presets), logo, cover, store contact info
- Manage admin email allowlist + Razorpay keys

## Project structure
```
/app
├── backend/            # FastAPI + MongoDB
│   ├── server.py       # Single-file API: auth, products, orders, admin, payments
│   ├── requirements.txt
│   └── .env            # MONGO_URL, JWT_SECRET, ADMIN_PHONE, ADMIN_PASSWORD
├── frontend/           # Expo Router (RN + web)
│   ├── app/
│   │   ├── (auth)/login.tsx       # Customer Google login
│   │   ├── (customer)/...         # Customer tabs (home, cart, orders, profile)
│   │   ├── portal/                # Staff/admin web portal
│   │   ├── product/[id].tsx, checkout.tsx, track/[id].tsx, bill/[id].tsx
│   │   └── _layout.tsx, index.tsx
│   ├── src/                       # api, auth, theme, cart, portalShell
│   └── .env                       # EXPO_PUBLIC_BACKEND_URL (auto)
├── auth_testing.md     # Auth testing playbook
└── memory/             # PRD, test_credentials, etc.
```

## Local dev (after cloning from GitHub)
```bash
# Backend
cd backend
pip install -r requirements.txt
# Edit .env: set MONGO_URL, JWT_SECRET, ADMIN_PHONE, ADMIN_PASSWORD
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend
cd ../frontend
yarn install
# Edit .env: set EXPO_PUBLIC_BACKEND_URL=http://localhost:8001
yarn start
```

## First-run admin setup
1. Open `/portal/login` and sign in with `ADMIN001` / `admin123` (default).
2. Go to **Shop Settings**:
   - Update store info (name, address, phone, email, owner, GST).
   - Add **your Gmail to "Admin emails" allowlist** so you can use Google login from now on.
   - (Optional) Paste your **Razorpay Key ID + Secret** to enable online payments.
3. Sign out, then sign in with Google. From this point you can manage everything via Gmail.

## Default credentials
Located in `/app/memory/test_credentials.md`:
- Admin (fallback): `ADMIN001` / `admin123`
- Customer: any Google account

## Deploy / Publish
- **GitHub push:** Use Emergent UI → "Save to GitHub" button (top sidebar).
- **APK / iOS app:** Use Emergent UI → "Publish" button (top right) — generates `.apk` + `.ipa` for sideload or store submission.
- **Web hosting:** Same Emergent deployment serves the web build at `/`.

## Tech notes
- **Custom JWT** for app sessions; **session_token cookie** for Google auth flow (web).
- **Role checks:** `require_admin` (admin OR staff), `require_super_admin` (admin only). Staff cannot mutate price / discount / active flag.
- **Razorpay:** server-side `order.create` + signature verification using HMAC-SHA256.
- **Vegetables hidden:** `categories.hidden_for_customer = true` filters customer GETs; admin sees all.

## License
MIT — your shop, your code.
