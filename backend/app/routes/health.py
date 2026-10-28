from datetime import datetime, timezone
from fastapi import APIRouter
from app.config import settings
from app.services.storage import storage_service

router = APIRouter(tags=["Health"])

@router.get("/health")
async def health_check():
    """
    Health check endpoint returning system operational status,
    AI engine status (Live Gemini API vs Demo Mode),
    and persistence mode (Supabase Cloud vs Local File Store).
    """
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ai": {
            "mode": "gemini" if settings.is_ai_active else "demo",
            "model": settings.GEMINI_MODEL if settings.is_ai_active else "Built-in Destination Intelligence (Demo)",
            "configured": settings.is_ai_active,
            "info": "Configured with live Gemini API" if settings.is_ai_active else "Running in Demo Mode. Add GEMINI_API_KEY in backend/.env for live Generative AI."
        },
        "storage": storage_service.get_status()
    }
