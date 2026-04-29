"""Backend tests for Daily Basket Grocery App.
Covers auth, categories, products, orders, admin reports, shop settings.
"""
import os
import pytest
import requests

BASE_URL = "https://daily-mart-12.preview.emergentagent.com"
API = f"{BASE_URL}/api"

ADMIN_PHONE = "9999999999"
ADMIN_PASSWORD = "admin123"
CUST_PHONE = "8888888888"
CUST_PASSWORD = "test123"
CUST_NAME = "Test Customer"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"phone": ADMIN_PHONE, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    body = r.json()
    assert body["user"]["role"] == "admin"
    return body["access_token"]


@pytest.fixture(scope="module")
def customer_token():
    # Try login first; if fails, register
    r = requests.post(f"{API}/auth/login", json={"phone": CUST_PHONE, "password": CUST_PASSWORD})
    if r.status_code != 200:
        r = requests.post(f"{API}/auth/register", json={
            "phone": CUST_PHONE, "password": CUST_PASSWORD, "name": CUST_NAME
        })
        assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    body = r.json()
    assert body["user"]["role"] == "customer"
    return body["access_token"]


def auth_h(t):
    return {"Authorization": f"Bearer {t}"}


# ---------- AUTH ----------
class TestAuth:
    def test_admin_login(self, admin_token):
        r = requests.get(f"{API}/auth/me", headers=auth_h(admin_token))
        assert r.status_code == 200
        u = r.json()
        assert u["role"] == "admin"
        assert u["phone"] == ADMIN_PHONE

    def test_customer_register_or_login(self, customer_token):
        r = requests.get(f"{API}/auth/me", headers=auth_h(customer_token))
        assert r.status_code == 200
        u = r.json()
        assert u["role"] == "customer"
        assert u["phone"] == CUST_PHONE

    def test_me_unauth(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_login_invalid(self):
        r = requests.post(f"{API}/auth/login", json={"phone": ADMIN_PHONE, "password": "wrong"})
        assert r.status_code == 401


# ---------- CATEGORIES ----------
class TestCategories:
    def test_list_categories(self):
        r = requests.get(f"{API}/categories")
        assert r.status_code == 200
        cats = r.json()
        assert isinstance(cats, list)
        assert len(cats) == 8, f"expected 8 categories, got {len(cats)}"
        for c in cats:
            assert "id" in c and "name" in c and "color" in c


# ---------- PRODUCTS ----------
class TestProducts:
    def test_list_products(self):
        r = requests.get(f"{API}/products")
        assert r.status_code == 200
        prods = r.json()
        assert isinstance(prods, list)
        assert len(prods) >= 22, f"expected >=22 products, got {len(prods)}"
        assert all(p["active"] is True for p in prods)

    def test_get_product_by_id(self):
        prods = requests.get(f"{API}/products").json()
        pid = prods[0]["id"]
        r = requests.get(f"{API}/products/{pid}")
        assert r.status_code == 200
        assert r.json()["id"] == pid

    def test_create_product_forbidden_customer(self, customer_token):
        cats = requests.get(f"{API}/categories").json()
        payload = {
            "name": "TEST_Forbidden", "price": 10, "category_id": cats[0]["id"],
            "unit": "1pc", "stock": 5, "active": True,
        }
        r = requests.post(f"{API}/products", json=payload, headers=auth_h(customer_token))
        assert r.status_code == 403

    def test_create_product_admin(self, admin_token):
        cats = requests.get(f"{API}/categories").json()
        payload = {
            "name": "TEST_Product1", "description": "test", "price": 99.5,
            "discount_pct": 10, "category_id": cats[0]["id"],
            "image": "", "unit": "1 pc", "stock": 50, "active": True,
        }
        r = requests.post(f"{API}/products", json=payload, headers=auth_h(admin_token))
        assert r.status_code == 200, r.text
        p = r.json()
        assert p["name"] == "TEST_Product1"
        # Verify GET
        g = requests.get(f"{API}/products/{p['id']}")
        assert g.status_code == 200
        # cleanup
        requests.delete(f"{API}/products/{p['id']}", headers=auth_h(admin_token))

    def test_toggle_active(self, admin_token):
        cats = requests.get(f"{API}/categories").json()
        payload = {"name": "TEST_Toggle", "price": 1, "category_id": cats[0]["id"]}
        c = requests.post(f"{API}/products", json=payload, headers=auth_h(admin_token))
        pid = c.json()["id"]
        r = requests.patch(f"{API}/products/{pid}/active", params={"active": False},
                           headers=auth_h(admin_token))
        assert r.status_code == 200
        assert r.json()["active"] is False
        # Verify it disappears from active listing
        listing = requests.get(f"{API}/products").json()
        assert all(p["id"] != pid for p in listing)
        requests.delete(f"{API}/products/{pid}", headers=auth_h(admin_token))


# ---------- ORDERS ----------
@pytest.fixture(scope="module")
def placed_order(customer_token):
    prods = requests.get(f"{API}/products").json()
    p = prods[0]
    payload = {
        "items": [{"product_id": p["id"], "quantity": 2}],
        "address": {"line1": "TEST 1", "line2": "", "city": "Delhi", "pincode": "110001", "label": "Home"},
        "payment_method": "cod",
        "notes": "TEST order",
    }
    r = requests.post(f"{API}/orders", json=payload, headers=auth_h(customer_token))
    assert r.status_code == 200, r.text
    return r.json()


class TestOrders:
    def test_place_order(self, placed_order):
        o = placed_order
        assert o["status"] == "placed"
        assert "subtotal" in o and "tax" in o and "total" in o and "order_no" in o
        assert o["order_no"].startswith("DB")
        assert o["total"] > 0

    def test_my_orders(self, customer_token, placed_order):
        r = requests.get(f"{API}/orders", headers=auth_h(customer_token))
        assert r.status_code == 200
        ids = [o["id"] for o in r.json()]
        assert placed_order["id"] in ids

    def test_orders_all_admin(self, admin_token, placed_order):
        r = requests.get(f"{API}/orders/all", headers=auth_h(admin_token))
        assert r.status_code == 200
        ids = [o["id"] for o in r.json()]
        assert placed_order["id"] in ids

    def test_orders_all_customer_forbidden(self, customer_token):
        r = requests.get(f"{API}/orders/all", headers=auth_h(customer_token))
        assert r.status_code == 403

    def test_update_status(self, admin_token, placed_order):
        oid = placed_order["id"]
        r = requests.patch(f"{API}/orders/{oid}/status", json={"status": "preparing"},
                           headers=auth_h(admin_token))
        assert r.status_code == 200
        # verify
        g = requests.get(f"{API}/orders/{oid}", headers=auth_h(admin_token))
        assert g.json()["status"] == "preparing"

    def test_tracking(self, customer_token, placed_order):
        oid = placed_order["id"]
        r = requests.get(f"{API}/orders/{oid}/tracking", headers=auth_h(customer_token))
        assert r.status_code == 200
        t = r.json()
        for k in ("rider", "progress", "eta_min", "timeline", "store", "customer"):
            assert k in t
        assert "lat" in t["rider"] and "lng" in t["rider"]

    def test_bill(self, customer_token, placed_order):
        oid = placed_order["id"]
        r = requests.get(f"{API}/orders/{oid}/bill", headers=auth_h(customer_token))
        assert r.status_code == 200
        b = r.json()
        assert "shop" in b and "order" in b
        assert b["shop"].get("name") == "Daily Basket"


# ---------- ADMIN REPORTS ----------
class TestAdminReports:
    def test_dashboard(self, admin_token):
        r = requests.get(f"{API}/admin/dashboard", headers=auth_h(admin_token))
        assert r.status_code == 200
        d = r.json()
        for k in ("today_orders", "today_revenue", "low_stock_count"):
            assert k in d

    def test_balance_sheet(self, admin_token):
        r = requests.get(f"{API}/admin/balance-sheet", params={"days": 7},
                         headers=auth_h(admin_token))
        assert r.status_code == 200
        b = r.json()
        assert "days" in b and "summary" in b
        assert isinstance(b["days"], list)
        for k in ("total_orders", "total_revenue", "total_tax"):
            assert k in b["summary"]

    def test_dashboard_forbidden_customer(self, customer_token):
        r = requests.get(f"{API}/admin/dashboard", headers=auth_h(customer_token))
        assert r.status_code == 403


# ---------- SHOP SETTINGS ----------
class TestShopSettings:
    def test_get_shop(self):
        r = requests.get(f"{API}/shop-settings")
        assert r.status_code == 200
        s = r.json()
        assert s.get("name") == "Daily Basket"
        assert "address" in s and "phone" in s

    def test_update_shop_admin(self, admin_token):
        # Read current
        cur = requests.get(f"{API}/shop-settings").json()
        new_tag = "TEST tagline updated"
        payload = {
            "name": cur.get("name", "Daily Basket"),
            "address": cur.get("address", "addr"),
            "phone": cur.get("phone", "+91"),
            "gst": cur.get("gst", ""),
            "tagline": new_tag,
        }
        r = requests.put(f"{API}/shop-settings", json=payload, headers=auth_h(admin_token))
        assert r.status_code == 200
        # Verify
        g = requests.get(f"{API}/shop-settings").json()
        assert g["tagline"] == new_tag
        # Restore
        payload["tagline"] = cur.get("tagline", "")
        requests.put(f"{API}/shop-settings", json=payload, headers=auth_h(admin_token))

    def test_update_shop_forbidden_customer(self, customer_token):
        r = requests.put(f"{API}/shop-settings",
                         json={"name": "x", "address": "y", "phone": "z"},
                         headers=auth_h(customer_token))
        assert r.status_code == 403
