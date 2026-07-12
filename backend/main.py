from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, SessionLocal
from routers.api import router as api_router
import models
import auth
from dotenv import load_dotenv

# Load Environment Variables
load_dotenv()

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

from fastapi.staticfiles import StaticFiles
import os

# Create and mount static uploads directory
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response


import seed

# Execute Seed
seed.seed_database()

# Register Router
app.include_router(api_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to AssetFlow Standalone Backend. Access API documentation at /docs"}
