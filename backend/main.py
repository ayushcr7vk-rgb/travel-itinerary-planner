import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import health, itinerary, trips

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("travel_planner")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("==================================================")
    logger.info(f"{settings.PROJECT_NAME} v{settings.VERSION} started")
    logger.info(f"AI Engine: {'LIVE GEMINI (' + settings.GEMINI_MODEL + ')' if settings.is_ai_active else 'DEMO MODE (No API Key)'}")
    logger.info(f"Persistence Engine: {'SUPABASE CLOUD' if settings.is_supabase_active else 'LOCAL STORAGE (backend/data/local_trips.json)'}")
    logger.info("==================================================")
    yield
    logger.info("Application shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Powered Personalized Travel Itinerary Planner with Google Gemini, Supabase, and FastAPI.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include route routers
app.include_router(health.router)
app.include_router(itinerary.router)
app.include_router(trips.router)

@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/health",
        "ai_active": settings.is_ai_active,
        "storage_mode": "supabase" if settings.is_supabase_active else "local"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
