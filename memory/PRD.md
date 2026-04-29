# GrociGO — Grocery E-Commerce Platform

## Overview
Two-app system on a single backend:
- **Customer mobile app** (Expo): OTP login (dev mode), browse, cart, checkout, live tracking
- **Staff portal website** (`/portal/*`): Sidebar layout (desktop) + drawer (mobile), staff/admin login with ID + password

Color theme: **greenish-turquoise** (primary `#0D9488`, accent `#5EEAD4`) — admin can switch to any preset (Emerald, Cyan, Forest, Indigo, Coral) or paste custom hex.

## Tech
- **Backend:** FastAPI + MongoDB (Motor), JWT, bcrypt
- **Frontend:** Expo Router (SDK 54), responsive layouts via `useWindowDimensions`, lucide icons, axios, AsyncStorage, Reanimated

## Backend endpoints (all `/api`)
- **Auth (customer):** POST `/auth/request-otp`, POST `/auth/verify-otp`
- **Auth (staff):** POST `/auth/staff-login`
- **Staff mgmt (admin):** POST/GET/DELETE `/admin/staff` — generates `STF######` IDs + 10-char passwords
- **Catalog:** GET `/categories?include_hidden=`, POST/PUT/DELETE `/categories/{id}`, GET/POST/PUT/DELETE `/products/{id}`, PATCH `/products/{id}/active`
- **Orders:** POST `/orders`, GET `/orders` (mine), GET `/orders/all` (admin), PATCH `/orders/{id}/status`, GET `/orders/{id}/tracking`, GET `/orders/{id}/bill`
- **Admin:** GET `/admin/dashboard`, GET `/admin/balance-sheet`
- **Settings:** GET/PUT `/shop-settings` (name, address, phone, email, owner_name, gst, tagline, primary_color, accent_color, logo_base64, cover_base64)

## Customer flow (mobile-first)
1. Splash → OTP login (3-step wizard: phone → OTP → name)
2. Home: 10-min badge, search, banners, category grid (vegetables hidden), flash deals, all products
3. Categories tab: vertical sidebar + product grid
4. Product detail: hero image, price, discount, add to cart
5. Cart: line items, FREE delivery threshold (₹199), checkout button
6. Checkout: address + payment selection (COD / UPI / Card / Wallet placeholders) + notes
7. Track: animated rider marker over a tinted map, ETA, timeline, call rider, view bill
8. Orders: history with status pills, track + bill buttons
9. Bill: receipt-style printable

## Staff portal flow (web-first, responsive)
- **Login** (`/portal/login`): split hero on desktop, single card on mobile
- **Dashboard**: today's revenue (big card), orders / pending / delivered / products / low-stock alerts
- **Inventory**: table view (image, name, category, stock, price, discount, status, actions). Add/edit/toggle/delete via modal. Hidden-from-customer categories still listed for admin.
- **Orders Console**: tabbed (New / Preparing / Out / Delivered), one-click status advancement, "Print Bill" button → goes to bill receipt
- **Reports**: summary cards (revenue, orders, tax) + daily breakdown table for 7/14/30-day windows
- **Staff (admin only)**: list staff, "+ New staff" creates an account and shows the auto-generated ID + password in a modal with copy buttons (password only shown once)
- **Shop Settings (admin only)**: update store info, owner, phone, email, GST. Theme presets (color picker) + base64 logo / cover banner. Saves apply on customer app refresh.

## Hidden category logic
- `categories.hidden_for_customer` flag (default false). "Fruits & Veggies" seeded with `true`.
- `GET /categories` filters by default; pass `include_hidden=true` (admin) to see all.
- `GET /products` excludes products from hidden categories unless `include_inactive=true`.
- Admin can toggle this flag from Inventory → category management when shop starts selling them.

## Notes / MOCKED
- **OTP** is **DEV MODE**: every request returns `123456`. Replace with Twilio/MSG91 by editing `request_otp` in server.py.
- **Payment** gateways are **MOCKED**: COD works, UPI/Card/Wallet are accepted as labels (Stripe/Razorpay can be wired in).
- **Delivery tracking** is **SIMULATED**: rider coords interpolated based on order status + elapsed time.

## Smart Business Enhancement
- **₹199 FREE-delivery threshold** with cart UX prompting "Add ₹X more for FREE delivery" — proven AOV booster from Zepto/Amazon playbook.
- **One-click theme rebrand**: Admin changes brand color from a single dropdown — instantly transforming the customer app's look without a code change.

## Roadmap
- Real Stripe / Razorpay integration
- Twilio / MSG91 for production OTP
- Real GPS tracking via delivery rider's app
- App icon & splash customization (requires native rebuild via Emergent publish button)
- Public-facing marketing website
