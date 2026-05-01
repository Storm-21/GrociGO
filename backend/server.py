# ===== CLEAN GROCI GO BACKEND (NO EMERGENT, WORKING LOGIN) =====

from dotenv import load_dotenv
from pathlib import Path
import os
import uuid
import random
import string
from datetime import datetime, timezone, timedelta
from typing import Optional, List

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel

# ---------- ENV ----------

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]

# ---------- DB ----------

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# ---------- APP ----------

app = FastAPI(title="GrociGO API")
api = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# ---------- HELPERS ----------

def now():
return datetime.now(timezone.utc).isoformat()

def hash_pw(p):
return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()

def verify_pw(p, h):
return bcrypt.checkpw(p.encode(), h.encode())

def create_token(uid, role):
return jwt.encode(
{"sub": uid, "role": role, "exp": datetime.now(timezone.utc) + timedelta(days=30)},
JWT_SECRET,
algorithm="HS256"
)

async def get_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(security)):
if not creds:
raise HTTPException(401, "No token")
try:
payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=["HS256"])
except:
raise HTTPException(401, "Invalid token")
user = await db.users.find_one({"id": payload["sub"]})
if not user:
raise HTTPException(401, "User not found")
return user

# ---------- MODELS ----------

class StaffLogin(BaseModel):
staff_id: str
password: str

class CreateStaff(BaseModel):
name: str

# ---------- ROOT ----------

@api.get("/")
def root():
return {"status": "GrociGO API running"}

# ---------- LOGIN ----------

@api.post("/auth/staff-login")
async def login(data: StaffLogin):
user = await db.users.find_one({"staff_id": data.staff_id})
if not user:
raise HTTPException(401, "Invalid staff ID or password")
if not verify_pw(data.password, user["password_hash"]):
raise HTTPException(401, "Invalid staff ID or password")

```
return {
    "access_token": create_token(user["id"], user["role"]),
    "user": {
        "id": user["id"],
        "name": user["name"],
        "role": user["role"]
    }
}
```

# ---------- CREATE STAFF (NO AUTH FOR NOW) ----------

@api.post("/admin/staff")
async def create_staff(data: CreateStaff):
staff_id = "STF" + "".join(random.choices(string.digits, k=5))
password = "".join(random.choices(string.ascii_letters + string.digits, k=8))

```
user = {
    "id": str(uuid.uuid4()),
    "staff_id": staff_id,
    "name": data.name,
    "role": "staff",
    "password_hash": hash_pw(password),
    "created_at": now()
}

await db.users.insert_one(user)

return {
    "staff_id": staff_id,
    "password": password
}
```

# ---------- SEED ADMIN ----------

@app.on_event("startup")
async def seed_admin():
admin = await db.users.find_one({"role": "admin"})
if not admin:
await db.users.insert_one({
"id": str(uuid.uuid4()),
"staff_id": "ADMIN001",
"name": "Admin",
"role": "admin",
"password_hash": hash_pw("admin123"),
"created_at": now()
})

app.include_router(api)
