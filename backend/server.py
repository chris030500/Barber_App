from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
import uuid

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'barbershop_db')]

# Create the main app
app = FastAPI(title="BarberShop API")

# Create API router with prefix
api_router = APIRouter(prefix="/api")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class User(BaseModel):
    user_id: str = Field(default_factory=lambda: f"user_{uuid.uuid4().hex[:12]}")
    email: EmailStr
    name: str
    picture: Optional[str] = None
    role: str = "client"  # client, barber, admin
    phone: Optional[str] = None
    barbershop_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    role: str = "client"
    phone: Optional[str] = None

class Barbershop(BaseModel):
    shop_id: str = Field(default_factory=lambda: f"shop_{uuid.uuid4().hex[:12]}")
    owner_user_id: str
    name: str
    address: str
    phone: str
    description: Optional[str] = None
    photos: List[str] = []  # base64 images
    working_hours: dict = {}  # {"monday": {"open": "09:00", "close": "18:00"}, ...}
    location: Optional[dict] = None  # {"lat": float, "lng": float}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BarbershopCreate(BaseModel):
    owner_user_id: str
    name: str
    address: str
    phone: str
    description: Optional[str] = None
    working_hours: dict = {}

class Barber(BaseModel):
    barber_id: str = Field(default_factory=lambda: f"barber_{uuid.uuid4().hex[:12]}")
    shop_id: str
    user_id: str
    bio: Optional[str] = None
    specialties: List[str] = []
    portfolio: List[str] = []  # base64 images
    availability: dict = {}  # {"monday": ["09:00-12:00", "14:00-18:00"], ...}
    status: str = "available"  # available, busy, unavailable
    rating: float = 0.0
    total_reviews: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BarberCreate(BaseModel):
    shop_id: str
    user_id: str
    bio: Optional[str] = None
    specialties: List[str] = []
    availability: dict = {}

class Service(BaseModel):
    service_id: str = Field(default_factory=lambda: f"service_{uuid.uuid4().hex[:12]}")
    shop_id: str
    name: str
    description: Optional[str] = None
    price: float
    duration: int  # minutes
    image: Optional[str] = None  # base64
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ServiceCreate(BaseModel):
    shop_id: str
    name: str
    description: Optional[str] = None
    price: float
    duration: int

class Appointment(BaseModel):
    appointment_id: str = Field(default_factory=lambda: f"appt_{uuid.uuid4().hex[:12]}")
    shop_id: str
    barber_id: str
    client_user_id: str
    service_id: str
    scheduled_time: datetime
    status: str = "scheduled"  # scheduled, confirmed, in_progress, completed, cancelled
    notes: Optional[str] = None
    reminder_sent: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AppointmentCreate(BaseModel):
    shop_id: str
    barber_id: str
    client_user_id: str
    service_id: str
    scheduled_time: datetime
    notes: Optional[str] = None

class ClientHistory(BaseModel):
    history_id: str = Field(default_factory=lambda: f"hist_{uuid.uuid4().hex[:12]}")
    client_user_id: str
    barber_id: str
    appointment_id: str
    photos: List[str] = []  # base64 images
    preferences: dict = {}  # haircut preferences
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PushToken(BaseModel):
    token_id: str = Field(default_factory=lambda: f"token_{uuid.uuid4().hex[:12]}")
    user_id: str
    token: str
    platform: str  # ios, android, web
    device_info: Optional[dict] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PushTokenCreate(BaseModel):
    user_id: str
    token: str
    platform: str
    device_info: Optional[dict] = None

# ==================== ENDPOINTS ====================

@api_router.get("/")
async def root():
    return {"message": "BarberShop API v1.0", "status": "running"}

# ==================== USERS ====================

@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate):
    try:
        user = User(**user_data.dict())
        result = await db.users.insert_one(user.dict())
        return user
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@api_router.get("/users", response_model=List[User])
async def list_users(role: Optional[str] = None, email: Optional[str] = None, limit: int = 100):
    query = {}
    if role:
        query["role"] = role
    if email:
        query["email"] = email
    users = await db.users.find(query, {"_id": 0}).limit(limit).to_list(limit)
    return users

# ==================== BARBERSHOPS ====================

@api_router.post("/barbershops", response_model=Barbershop)
async def create_barbershop(shop_data: BarbershopCreate):
    try:
        shop = Barbershop(**shop_data.dict())
        await db.barbershops.insert_one(shop.dict())
        return shop
    except Exception as e:
        logger.error(f"Error creating barbershop: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/barbershops/{shop_id}", response_model=Barbershop)
async def get_barbershop(shop_id: str):
    shop = await db.barbershops.find_one({"shop_id": shop_id}, {"_id": 0})
    if not shop:
        raise HTTPException(status_code=404, detail="Barbershop not found")
    return shop

@api_router.get("/barbershops", response_model=List[Barbershop])
async def list_barbershops(limit: int = 100):
    shops = await db.barbershops.find({}, {"_id": 0}).limit(limit).to_list(limit)
    return shops

@api_router.put("/barbershops/{shop_id}", response_model=Barbershop)
async def update_barbershop(shop_id: str, updates: dict):
    result = await db.barbershops.update_one(
        {"shop_id": shop_id},
        {"$set": updates}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Barbershop not found")
    shop = await db.barbershops.find_one({"shop_id": shop_id}, {"_id": 0})
    return shop

# ==================== BARBERS ====================

@api_router.post("/barbers", response_model=Barber)
async def create_barber(barber_data: BarberCreate):
    try:
        barber = Barber(**barber_data.dict())
        await db.barbers.insert_one(barber.dict())
        return barber
    except Exception as e:
        logger.error(f"Error creating barber: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/barbers/{barber_id}", response_model=Barber)
async def get_barber(barber_id: str):
    barber = await db.barbers.find_one({"barber_id": barber_id}, {"_id": 0})
    if not barber:
        raise HTTPException(status_code=404, detail="Barber not found")
    return barber

@api_router.get("/barbers", response_model=List[Barber])
async def list_barbers(shop_id: Optional[str] = None, limit: int = 100):
    query = {"shop_id": shop_id} if shop_id else {}
    barbers = await db.barbers.find(query, {"_id": 0}).limit(limit).to_list(limit)
    return barbers

@api_router.put("/barbers/{barber_id}", response_model=Barber)
async def update_barber(barber_id: str, updates: dict):
    result = await db.barbers.update_one(
        {"barber_id": barber_id},
        {"$set": updates}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Barber not found")
    barber = await db.barbers.find_one({"barber_id": barber_id}, {"_id": 0})
    return barber

# ==================== SERVICES ====================

@api_router.post("/services", response_model=Service)
async def create_service(service_data: ServiceCreate):
    try:
        service = Service(**service_data.dict())
        await db.services.insert_one(service.dict())
        return service
    except Exception as e:
        logger.error(f"Error creating service: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/services/{service_id}", response_model=Service)
async def get_service(service_id: str):
    service = await db.services.find_one({"service_id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service

@api_router.get("/services", response_model=List[Service])
async def list_services(shop_id: Optional[str] = None, limit: int = 100):
    query = {"shop_id": shop_id} if shop_id else {}
    services = await db.services.find(query, {"_id": 0}).limit(limit).to_list(limit)
    return services

# ==================== APPOINTMENTS ====================

@api_router.post("/appointments", response_model=Appointment)
async def create_appointment(appt_data: AppointmentCreate):
    try:
        appointment = Appointment(**appt_data.dict())
        await db.appointments.insert_one(appointment.dict())
        return appointment
    except Exception as e:
        logger.error(f"Error creating appointment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/appointments/{appointment_id}", response_model=Appointment)
async def get_appointment(appointment_id: str):
    appt = await db.appointments.find_one({"appointment_id": appointment_id}, {"_id": 0})
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appt

@api_router.get("/appointments", response_model=List[Appointment])
async def list_appointments(
    client_user_id: Optional[str] = None,
    barber_id: Optional[str] = None,
    shop_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100
):
    query = {}
    if client_user_id:
        query["client_user_id"] = client_user_id
    if barber_id:
        query["barber_id"] = barber_id
    if shop_id:
        query["shop_id"] = shop_id
    if status:
        query["status"] = status
    
    appointments = await db.appointments.find(query, {"_id": 0}).limit(limit).to_list(limit)
    return appointments

@api_router.put("/appointments/{appointment_id}", response_model=Appointment)
async def update_appointment(appointment_id: str, updates: dict):
    updates["updated_at"] = datetime.now(timezone.utc)
    result = await db.appointments.update_one(
        {"appointment_id": appointment_id},
        {"$set": updates}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")
    appt = await db.appointments.find_one({"appointment_id": appointment_id}, {"_id": 0})
    return appt

@api_router.delete("/appointments/{appointment_id}")
async def delete_appointment(appointment_id: str):
    result = await db.appointments.delete_one({"appointment_id": appointment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return {"message": "Appointment deleted successfully"}

# ==================== CLIENT HISTORY ====================

@api_router.post("/client-history")
async def create_client_history(history: ClientHistory):
    try:
        await db.client_history.insert_one(history.dict())
        return history
    except Exception as e:
        logger.error(f"Error creating client history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/client-history/{client_user_id}")
async def get_client_history(client_user_id: str, limit: int = 50):
    history = await db.client_history.find(
        {"client_user_id": client_user_id},
        {"_id": 0}
    ).limit(limit).to_list(limit)
    return history

# ==================== PUSH TOKENS ====================

@api_router.post("/push-tokens")
async def register_push_token(token_data: PushTokenCreate):
    try:
        # Check if token already exists for this user
        existing = await db.push_tokens.find_one({
            "user_id": token_data.user_id,
            "token": token_data.token
        })
        
        if existing:
            return {"message": "Token already registered"}
        
        token = PushToken(**token_data.dict())
        await db.push_tokens.insert_one(token.dict())
        return {"message": "Token registered successfully"}
    except Exception as e:
        logger.error(f"Error registering push token: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/push-tokens/{user_id}")
async def get_user_tokens(user_id: str):
    tokens = await db.push_tokens.find(
        {"user_id": user_id},
        {"_id": 0}
    ).to_list(100)
    return tokens

# ==================== ADMIN DASHBOARD ====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(shop_id: str):
    try:
        # Count appointments by status
        total_appointments = await db.appointments.count_documents({"shop_id": shop_id})
        completed_appointments = await db.appointments.count_documents({
            "shop_id": shop_id,
            "status": "completed"
        })
        
        # Count barbers
        total_barbers = await db.barbers.count_documents({"shop_id": shop_id})
        
        # Get today's appointments
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        today_appointments = await db.appointments.count_documents({
            "shop_id": shop_id,
            "scheduled_time": {"$gte": today_start, "$lt": today_end}
        })
        
        return {
            "total_appointments": total_appointments,
            "completed_appointments": completed_appointments,
            "total_barbers": total_barbers,
            "today_appointments": today_appointments
        }
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Include router in app
app.include_router(api_router)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
