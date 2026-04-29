# Daily Basket — Grocery E-Commerce App

## Overview
Unified mobile e-commerce app (Zepto + Amazon inspired) with role-based access:
- **Customer** flow: Browse, search, cart, checkout, live tracking, bill view
- **Staff/Admin** flow: Dashboard, inventory CRUD with discounts/delisting, orders console with status advancement, balance sheet (daily revenue/tax breakdown), printable bill slips

## Tech
- **Backend:** FastAPI + MongoDB (Motor), JWT phone+password auth, bcrypt
- **Frontend:** Expo Router (SDK 54), React Native, react-native-reanimated, lucide icons, AsyncStorage, axios

## Auth
- Phone + Password (custom JWT) — no SMS cost
- Roles: customer, staff, admin (admin/staff share staff console)
- Demo Admin: `9999999999` / `admin123`

## Payment
- COD, UPI (placeholder), Card (placeholder), Wallet (placeholder)
- Razorpay / Stripe gateway can be wired later

## Delivery Tracking
- Simulated movement of rider from store to customer using Reanimated
- Live progress (%), ETA, timeline, animated pulsing rider marker

## Bill Slip
- Printable receipt-style screen using mono-spaced font with shop info, customer info, itemised list

## Backend models (collections)
- users {id, phone, name, role, password_hash, addresses, preferences}
- categories {id, name, icon, color}
- products {id, name, price, discount_pct, category_id, image, unit, stock, active}
- orders {id, order_no, user_id, items[], address, payment_method, payment_status, status, totals, rider, tracking_started_at}
- shop_settings {id:'main', name, address, phone, gst, tagline}

## Routes (all /api)
- POST /auth/register, /auth/login; GET /auth/me
- GET /categories; POST /categories (admin)
- GET /products; GET/POST/PUT/DELETE /products/{id}; PATCH /products/{id}/active (admin)
- POST /orders; GET /orders (mine); GET /orders/all (admin); GET /orders/{id}; PATCH /orders/{id}/status; GET /orders/{id}/tracking; GET /orders/{id}/bill
- GET /admin/dashboard; GET /admin/balance-sheet
- GET/PUT /shop-settings
- PUT /me

## Smart Business Enhancement
**FREE Delivery threshold (₹199)**: Orders auto qualify for free delivery, with cart UX prompting customers to add ₹X more — a proven AOV booster from Zepto/Amazon.

## Future Roadmap
- Real Stripe / Razorpay integration
- SMS OTP via Twilio
- Real GPS tracking via delivery rider app
- Web mirror site (Next.js sharing the same /api)
- Push notifications for order updates
