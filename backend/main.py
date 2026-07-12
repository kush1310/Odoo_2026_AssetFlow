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

import seed

# Execute Seed
seed.seed_database()

# Register Router
app.include_router(api_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to AssetFlow Standalone Backend. Access API documentation at /docs"}
