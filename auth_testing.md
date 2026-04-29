# Auth Testing Playbook (GrociGO)

## Roles
- **customer**: Google login (default, anyone logging in via Google who isn't in admin allowlist)
- **admin**: Google login from an email in `shop_settings.admin_emails` allowlist
- **staff**: ID + password issued by admin (NOT via Google)

## Test Identities

### Admin (Google)
- Add your Gmail to `shop_settings.admin_emails` array, then Google-login.
- Default admin allowlist contains: `admin@grocigo.com` (placeholder — admin should add their own gmail via admin portal Shop Settings → Admin Emails).

### Staff (ID/password)
- Created by admin via Portal → Staff → "+ New staff"
- Login at `/portal/login` with the auto-generated `STF######` ID + 10-char password

### Customer (Google)
- Click "Continue with Google" on the customer app
- Any non-admin Gmail account works

## Endpoints
- POST `/api/auth/google-callback` body `{session_id}` → returns `{access_token, user}`
- POST `/api/auth/staff-login` body `{staff_id, password}` → returns `{access_token, user}`
- GET `/api/auth/me` header: `Authorization: Bearer <jwt>` (or cookie `session_token`)
- POST `/api/auth/logout`

## Quick test (mongosh)
```
mongosh grocery_app --quiet --eval "
db.shop_settings.updateOne({id:'main'}, {\$set: {admin_emails: ['your.email@gmail.com']}});
print('Admin email allowlist: ' + JSON.stringify(db.shop_settings.findOne({id:'main'}).admin_emails));
"
```

## Notes
- Tokens use both Bearer header AND cookie. Frontend uses Bearer (AsyncStorage).
- Customer can browse even without login; auth required only for cart/checkout.
- Staff cannot edit prices, discounts, or active flag (admin-only).
