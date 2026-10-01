from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.database import Base, engine
from app.routes import router

# Initialize SQLite database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FitBuddy - AI Workout & Nutrition Planner",
    description="A smart fitness companion powered by FastAPI, SQLite, and Google Gemini.",
    version="1.0.0"
)

# Resolve project root and static assets directory
BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"

if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# Register routes
app.include_router(router)
