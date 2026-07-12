from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, SessionLocal
from routers.api import router as api_router
import models
import auth

# Initialize Database Schema Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AssetFlow Standalone Backend",
    description="Standalone Python (FastAPI) Backend for Enterprise Asset & Resource Management",
    version="1.0.0"
)

# CORS Configuration
origins = [
    "http://localhost:5173", # Vite Dev Server default
    "http://127.0.0.1:5173",
    "http://localhost:3000", # Alternative React Port
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seeding Logic
def seed_database():
    db = SessionLocal()
    try:
        # 1. Seed Admin User
        admin_email = "admin@assetflow.com"
        admin = db.query(models.User).filter(models.User.email == admin_email).first()
        if not admin:
            hashed_pass = auth.get_password_hash("pass1111")
            admin_user = models.User(
                name="System Admin",
                email=admin_email,
                password_hash=hashed_pass,
                role="Admin",
                status="Active"
            )
            db.add(admin_user)
            db.commit()
            print(f"Database Seeded: Created administrator account '{admin_email}' with password 'pass1111'.")

        # 2. Seed Default Categories
        categories = [
            {"name": "Electronics", "code": "ELE"},
            {"name": "Furniture", "code": "FUR"},
            {"name": "Vehicles", "code": "VEH"}
        ]
        for cat in categories:
            existing = db.query(models.AssetCategory).filter(models.AssetCategory.name == cat["name"]).first()
            if not existing:
                new_cat = models.AssetCategory(name=cat["name"], code=cat["code"], status="Active")
                db.add(new_cat)
                db.commit()
                print(f"Database Seeded: Created category '{cat['name']}'.")
    finally:
        db.close()

# Execute Seed
seed_database()

# Register Router
app.include_router(api_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to AssetFlow Standalone Backend. Access API documentation at /docs"}
