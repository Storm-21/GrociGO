from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
import uuid
import random
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field

# ---------- DB ----------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# ---------- App ----------
app = FastAPI(title="Daily Basket API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALG = "HS256"


# ---------- Helpers ----------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def create_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=30),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


async def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    if not creds:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return user


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") not in ("admin", "staff"):
        raise HTTPException(403, "Staff/Admin only")
    return user


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------- Models ----------
class RegisterIn(BaseModel):
    phone: str
    password: str
    name: str


class LoginIn(BaseModel):
    phone: str
    password: str


class CategoryIn(BaseModel):
    name: str
    icon: str = "ShoppingBasket"
    color: str = "#FF4C29"


class ProductIn(BaseModel):
    name: str
    description: str = ""
    price: float
    discount_pct: float = 0
    category_id: str
    image: str = ""
    unit: str = "1 pc"
    stock: int = 100
    active: bool = True


class CartItemIn(BaseModel):
    product_id: str
    quantity: int


class AddressIn(BaseModel):
    line1: str
    line2: str = ""
    city: str
    pincode: str
    label: str = "Home"


class OrderIn(BaseModel):
    items: List[CartItemIn]
    address: AddressIn
    payment_method: str  # cod, stripe, razorpay
    notes: str = ""


class OrderStatusIn(BaseModel):
    status: str  # placed, preparing, out_for_delivery, delivered, cancelled


class ShopSettingsIn(BaseModel):
    name: str
    address: str
    phone: str
    gst: str = ""
    tagline: str = ""


# ---------- Auth ----------
@api_router.post("/auth/register")
async def register(data: RegisterIn):
    phone = data.phone.strip()
    if len(phone) < 6:
        raise HTTPException(400, "Phone too short")
    if await db.users.find_one({"phone": phone}):
        raise HTTPException(400, "Phone already registered")
    role = "customer"  # public registration is always customer; staff is created by admin
    user = {
        "id": str(uuid.uuid4()),
        "phone": phone,
        "name": data.name,
        "role": role,
        "password_hash": hash_password(data.password),
        "created_at": now_iso(),
        "addresses": [],
        "preferences": {},
    }
    await db.users.insert_one(user)
    user.pop("password_hash", None)
    user.pop("_id", None)
    return {"access_token": create_token(user["id"], role), "user": user}


@api_router.post("/auth/login")
async def login(data: LoginIn):
    user = await db.users.find_one({"phone": data.phone.strip()})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(401, "Invalid phone or password")
    user.pop("password_hash", None)
    user.pop("_id", None)
    return {"access_token": create_token(user["id"], user["role"]), "user": user}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


# ---------- Categories ----------
@api_router.get("/categories")
async def list_categories():
    return await db.categories.find({}, {"_id": 0}).to_list(500)


@api_router.post("/categories")
async def create_category(data: CategoryIn, _admin: dict = Depends(require_admin)):
    cat = {"id": str(uuid.uuid4()), **data.dict(), "created_at": now_iso()}
    await db.categories.insert_one(cat)
    cat.pop("_id", None)
    return cat


# ---------- Products ----------
@api_router.get("/products")
async def list_products(category_id: Optional[str] = None, q: Optional[str] = None, include_inactive: bool = False):
    query = {}
    if not include_inactive:
        query["active"] = True
    if category_id:
        query["category_id"] = category_id
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    items = await db.products.find(query, {"_id": 0}).to_list(1000)
    return items


@api_router.get("/products/{pid}")
async def get_product(pid: str):
    p = await db.products.find_one({"id": pid}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Not found")
    return p


@api_router.post("/products")
async def create_product(data: ProductIn, _admin: dict = Depends(require_admin)):
    p = {"id": str(uuid.uuid4()), **data.dict(), "created_at": now_iso()}
    await db.products.insert_one(p)
    p.pop("_id", None)
    return p


@api_router.put("/products/{pid}")
async def update_product(pid: str, data: ProductIn, _admin: dict = Depends(require_admin)):
    res = await db.products.update_one({"id": pid}, {"$set": data.dict()})
    if not res.matched_count:
        raise HTTPException(404, "Not found")
    return await db.products.find_one({"id": pid}, {"_id": 0})


@api_router.delete("/products/{pid}")
async def delete_product(pid: str, _admin: dict = Depends(require_admin)):
    await db.products.delete_one({"id": pid})
    return {"ok": True}


@api_router.patch("/products/{pid}/active")
async def toggle_active(pid: str, active: bool, _admin: dict = Depends(require_admin)):
    await db.products.update_one({"id": pid}, {"$set": {"active": active}})
    return {"ok": True, "active": active}


# ---------- Orders ----------
def calc_price(p: dict, qty: int) -> float:
    price = p["price"] * (1 - (p.get("discount_pct", 0) / 100))
    return round(price * qty, 2)


@api_router.post("/orders")
async def place_order(data: OrderIn, user: dict = Depends(get_current_user)):
    if not data.items:
        raise HTTPException(400, "Empty cart")
    enriched_items = []
    subtotal = 0.0
    for it in data.items:
        p = await db.products.find_one({"id": it.product_id}, {"_id": 0})
        if not p or not p.get("active"):
            raise HTTPException(400, f"Product unavailable: {it.product_id}")
        line = calc_price(p, it.quantity)
        subtotal += line
        enriched_items.append({
            "product_id": p["id"],
            "name": p["name"],
            "image": p.get("image", ""),
            "unit": p.get("unit", ""),
            "price": p["price"],
            "discount_pct": p.get("discount_pct", 0),
            "quantity": it.quantity,
            "line_total": line,
        })
    delivery_fee = 0 if subtotal >= 199 else 25
    tax = round(subtotal * 0.05, 2)
    total = round(subtotal + delivery_fee + tax, 2)
    order = {
        "id": str(uuid.uuid4()),
        "order_no": f"DB{int(datetime.now().timestamp())}{random.randint(10, 99)}",
        "user_id": user["id"],
        "user_name": user["name"],
        "user_phone": user["phone"],
        "items": enriched_items,
        "address": data.address.dict(),
        "payment_method": data.payment_method,
        "payment_status": "pending" if data.payment_method == "cod" else "paid",
        "subtotal": round(subtotal, 2),
        "delivery_fee": delivery_fee,
        "tax": tax,
        "total": total,
        "status": "placed",
        "notes": data.notes,
        "created_at": now_iso(),
        "rider": {
            "name": "Ravi Kumar",
            "phone": "+91 98765 43210",
            "vehicle": "DL 9C 1234",
        },
        "tracking_started_at": now_iso(),
    }
    await db.orders.insert_one(order)
    order.pop("_id", None)
    return order


@api_router.get("/orders")
async def my_orders(user: dict = Depends(get_current_user)):
    return await db.orders.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api_router.get("/orders/all")
async def all_orders(_admin: dict = Depends(require_admin), status: Optional[str] = None):
    q = {}
    if status:
        q["status"] = status
    return await db.orders.find(q, {"_id": 0}).sort("created_at", -1).to_list(1000)


@api_router.get("/orders/{oid}")
async def get_order(oid: str, user: dict = Depends(get_current_user)):
    o = await db.orders.find_one({"id": oid}, {"_id": 0})
    if not o:
        raise HTTPException(404, "Not found")
    if user["role"] == "customer" and o["user_id"] != user["id"]:
        raise HTTPException(403, "Forbidden")
    return o


@api_router.patch("/orders/{oid}/status")
async def update_status(oid: str, data: OrderStatusIn, _admin: dict = Depends(require_admin)):
    valid = ["placed", "preparing", "out_for_delivery", "delivered", "cancelled"]
    if data.status not in valid:
        raise HTTPException(400, "Invalid status")
    res = await db.orders.update_one({"id": oid}, {"$set": {"status": data.status, "tracking_started_at": now_iso()}})
    if not res.matched_count:
        raise HTTPException(404, "Not found")
    return {"ok": True}


@api_router.get("/orders/{oid}/tracking")
async def tracking(oid: str, user: dict = Depends(get_current_user)):
    o = await db.orders.find_one({"id": oid}, {"_id": 0})
    if not o:
        raise HTTPException(404, "Not found")
    if user["role"] == "customer" and o["user_id"] != user["id"]:
        raise HTTPException(403, "Forbidden")
    # Simulate movement: position progresses 0->1 over 12 minutes since tracking_started_at
    started = datetime.fromisoformat(o.get("tracking_started_at", o["created_at"]))
    elapsed = (datetime.now(timezone.utc) - started).total_seconds()
    # Status-based progress
    status = o["status"]
    base = {"placed": 0.05, "preparing": 0.15, "out_for_delivery": min(0.25 + elapsed / 720, 0.95), "delivered": 1.0, "cancelled": 0}
    progress = base.get(status, 0)
    eta_min = max(int((1 - progress) * 15), 1) if status not in ("delivered", "cancelled") else 0
    # Simulated coords (store at 28.61, 77.20 -> customer 28.63, 77.22)
    store = {"lat": 28.6139, "lng": 77.2090}
    cust = {"lat": 28.6280, "lng": 77.2200}
    rider = {
        "lat": store["lat"] + (cust["lat"] - store["lat"]) * progress,
        "lng": store["lng"] + (cust["lng"] - store["lng"]) * progress,
    }
    return {
        "order_id": oid,
        "status": status,
        "progress": round(progress, 3),
        "eta_min": eta_min,
        "store": store,
        "customer": cust,
        "rider": rider,
        "rider_info": o.get("rider", {}),
        "timeline": [
            {"label": "Order placed", "done": True, "at": o["created_at"]},
            {"label": "Preparing", "done": status in ("preparing", "out_for_delivery", "delivered")},
            {"label": "Out for delivery", "done": status in ("out_for_delivery", "delivered")},
            {"label": "Delivered", "done": status == "delivered"},
        ],
    }


@api_router.get("/orders/{oid}/bill")
async def bill(oid: str, user: dict = Depends(get_current_user)):
    o = await db.orders.find_one({"id": oid}, {"_id": 0})
    if not o:
        raise HTTPException(404, "Not found")
    if user["role"] == "customer" and o["user_id"] != user["id"]:
        raise HTTPException(403, "Forbidden")
    shop = await db.shop_settings.find_one({"id": "main"}, {"_id": 0}) or {}
    return {"order": o, "shop": shop}


# ---------- Admin Reports ----------
@api_router.get("/admin/dashboard")
async def admin_dashboard(_admin: dict = Depends(require_admin)):
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    today_orders = await db.orders.find({"created_at": {"$gte": today_start}}, {"_id": 0}).to_list(1000)
    pending = [o for o in today_orders if o["status"] in ("placed", "preparing", "out_for_delivery")]
    delivered = [o for o in today_orders if o["status"] == "delivered"]
    revenue = round(sum(o["total"] for o in today_orders if o["status"] != "cancelled"), 2)
    low_stock = await db.products.find({"stock": {"$lt": 10}, "active": True}, {"_id": 0}).to_list(50)
    total_products = await db.products.count_documents({})
    return {
        "today_orders": len(today_orders),
        "today_pending": len(pending),
        "today_delivered": len(delivered),
        "today_revenue": revenue,
        "low_stock_count": len(low_stock),
        "total_products": total_products,
        "low_stock_items": low_stock[:10],
    }


@api_router.get("/admin/balance-sheet")
async def balance_sheet(_admin: dict = Depends(require_admin), days: int = 7):
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    orders = await db.orders.find({"created_at": {"$gte": since}}, {"_id": 0}).to_list(5000)
    by_day = {}
    for o in orders:
        day = o["created_at"][:10]
        d = by_day.setdefault(day, {"day": day, "orders": 0, "revenue": 0.0, "tax": 0.0, "delivery": 0.0})
        if o["status"] != "cancelled":
            d["orders"] += 1
            d["revenue"] += o["total"]
            d["tax"] += o.get("tax", 0)
            d["delivery"] += o.get("delivery_fee", 0)
    rows = sorted(by_day.values(), key=lambda x: x["day"], reverse=True)
    for r in rows:
        r["revenue"] = round(r["revenue"], 2)
        r["tax"] = round(r["tax"], 2)
    summary = {
        "total_orders": sum(r["orders"] for r in rows),
        "total_revenue": round(sum(r["revenue"] for r in rows), 2),
        "total_tax": round(sum(r["tax"] for r in rows), 2),
    }
    return {"days": rows, "summary": summary}


# ---------- Shop Settings ----------
@api_router.get("/shop-settings")
async def get_shop():
    s = await db.shop_settings.find_one({"id": "main"}, {"_id": 0})
    return s or {}


@api_router.put("/shop-settings")
async def update_shop(data: ShopSettingsIn, _admin: dict = Depends(require_admin)):
    payload = {"id": "main", **data.dict(), "updated_at": now_iso()}
    await db.shop_settings.update_one({"id": "main"}, {"$set": payload}, upsert=True)
    return payload


# ---------- User profile ----------
class ProfileIn(BaseModel):
    name: Optional[str] = None
    addresses: Optional[List[AddressIn]] = None
    preferences: Optional[dict] = None


@api_router.put("/me")
async def update_me(data: ProfileIn, user: dict = Depends(get_current_user)):
    upd = {}
    if data.name is not None:
        upd["name"] = data.name
    if data.addresses is not None:
        upd["addresses"] = [a.dict() for a in data.addresses]
    if data.preferences is not None:
        upd["preferences"] = data.preferences
    if upd:
        await db.users.update_one({"id": user["id"]}, {"$set": upd})
    return await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})


# ---------- Health ----------
@api_router.get("/")
async def root():
    return {"app": "Daily Basket API", "ok": True}


# ---------- Seed ----------
SEED_CATEGORIES = [
    {"name": "Fruits & Veggies", "icon": "Apple", "color": "#30A46C"},
    {"name": "Dairy & Eggs", "icon": "Milk", "color": "#FFB224"},
    {"name": "Snacks & Drinks", "icon": "Coffee", "color": "#FF4C29"},
    {"name": "Bakery", "icon": "Croissant", "color": "#A855F7"},
    {"name": "Personal Care", "icon": "Sparkles", "color": "#0EA5E9"},
    {"name": "Household", "icon": "Home", "color": "#EF4444"},
    {"name": "Frozen", "icon": "Snowflake", "color": "#06B6D4"},
    {"name": "Cooking Essentials", "icon": "ChefHat", "color": "#F59E0B"},
]

SEED_PRODUCTS = [
    ("Fresh Bananas", "Fruits & Veggies", 49, 20, "1 dozen", "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400"),
    ("Red Apples", "Fruits & Veggies", 180, 10, "1 kg", "https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?w=400"),
    ("Tomatoes", "Fruits & Veggies", 40, 0, "1 kg", "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400"),
    ("Onions", "Fruits & Veggies", 35, 0, "1 kg", "https://images.unsplash.com/photo-1580201092675-a0a6a6cafbb1?w=400"),
    ("Amul Milk", "Dairy & Eggs", 64, 0, "1 L", "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400"),
    ("Free Range Eggs", "Dairy & Eggs", 90, 5, "6 pcs", "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400"),
    ("Curd", "Dairy & Eggs", 50, 0, "400 g", "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400"),
    ("Lays Classic", "Snacks & Drinks", 20, 0, "52 g", "https://images.unsplash.com/photo-1613919113640-25732ec5e61f?w=400"),
    ("Coca Cola", "Snacks & Drinks", 40, 5, "750 ml", "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400"),
    ("Dark Chocolate", "Snacks & Drinks", 150, 15, "100 g", "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400"),
    ("Whole Wheat Bread", "Bakery", 45, 0, "400 g", "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400"),
    ("Croissants", "Bakery", 120, 10, "4 pcs", "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400"),
    ("Colgate Toothpaste", "Personal Care", 110, 5, "150 g", "https://images.unsplash.com/photo-1559591935-c6c92c6dc8b9?w=400"),
    ("Dove Soap", "Personal Care", 60, 0, "100 g", "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400"),
    ("Surf Excel", "Household", 290, 8, "1 kg", "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400"),
    ("Vim Dishwash", "Household", 70, 0, "500 ml", "https://images.unsplash.com/photo-1583947582886-f40ec95dd752?w=400"),
    ("Frozen Peas", "Frozen", 90, 0, "500 g", "https://images.unsplash.com/photo-1614961233913-a5113a4a34ed?w=400"),
    ("Chicken Nuggets", "Frozen", 250, 12, "400 g", "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400"),
    ("Basmati Rice", "Cooking Essentials", 220, 10, "1 kg", "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400"),
    ("Sunflower Oil", "Cooking Essentials", 180, 0, "1 L", "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400"),
    ("Toor Dal", "Cooking Essentials", 160, 5, "1 kg", "https://images.unsplash.com/photo-1626197031507-c17099753214?w=400"),
    ("Salt", "Cooking Essentials", 25, 0, "1 kg", "https://images.unsplash.com/photo-1518110925495-b37653e35389?w=400"),
]


@app.on_event("startup")
async def startup():
    # Indexes
    await db.users.create_index("phone", unique=True)
    await db.products.create_index("category_id")
    await db.orders.create_index("user_id")
    await db.orders.create_index("created_at")

    # Seed admin
    admin_phone = os.environ.get("ADMIN_PHONE", "9999999999")
    admin_pw = os.environ.get("ADMIN_PASSWORD", "admin123")
    if not await db.users.find_one({"phone": admin_phone}):
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "phone": admin_phone,
            "name": "Shop Admin",
            "role": "admin",
            "password_hash": hash_password(admin_pw),
            "created_at": now_iso(),
            "addresses": [],
            "preferences": {},
        })

    # Seed shop settings
    if not await db.shop_settings.find_one({"id": "main"}):
        await db.shop_settings.insert_one({
            "id": "main",
            "name": "Daily Basket",
            "address": "Shop No. 12, Market Street, New Delhi - 110001",
            "phone": "+91 98765 43210",
            "gst": "07ABCDE1234F1Z5",
            "tagline": "Fresh groceries delivered in minutes",
            "updated_at": now_iso(),
        })

    # Seed categories & products
    if await db.categories.count_documents({}) == 0:
        cats_by_name = {}
        for c in SEED_CATEGORIES:
            cid = str(uuid.uuid4())
            cat = {"id": cid, **c, "created_at": now_iso()}
            await db.categories.insert_one(cat)
            cats_by_name[c["name"]] = cid
        for name, cat_name, price, disc, unit, img in SEED_PRODUCTS:
            await db.products.insert_one({
                "id": str(uuid.uuid4()),
                "name": name,
                "description": f"Premium quality {name.lower()}",
                "price": float(price),
                "discount_pct": float(disc),
                "category_id": cats_by_name[cat_name],
                "image": img,
                "unit": unit,
                "stock": random.randint(20, 100),
                "active": True,
                "created_at": now_iso(),
            })


# ---------- Mount ----------
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
