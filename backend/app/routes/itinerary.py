import logging
from fastapi import APIRouter, HTTPException, status
from app.models import (
    TripPreferences,
    GeneratedItinerary,
    DayItinerary,
    RegenerateDayRequest,
    RegenerateTripRequest
)
from app.services.ai_generator import (
    generate_itinerary,
    regenerate_day,
    regenerate_itinerary
)

logger = logging.getLogger("travel_planner.itinerary_routes")
router = APIRouter(prefix="/api/itinerary", tags=["Itinerary"])

@router.post(
    "/generate",
    response_model=GeneratedItinerary,
    status_code=status.HTTP_200_OK,
    summary="Generate personalized day-by-day travel itinerary"
)
async def api_generate_itinerary(preferences: TripPreferences):
    """
    Validates user preferences and generates a complete day-by-day itinerary
    utilizing Google Gemini Generative AI (or high-fidelity Demo Mode if API key is unconfigured).
    """
    try:
        itinerary = await generate_itinerary(preferences)
        return itinerary
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(ve)
        )
    except Exception as exc:
        logger.error(f"Failed to generate itinerary: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while generating your itinerary: {str(exc)}"
        )

@router.post(
    "/regenerate-day",
    response_model=DayItinerary,
    status_code=status.HTTP_200_OK,
    summary="Regenerate an individual day within an itinerary"
)
async def api_regenerate_day(request: RegenerateDayRequest):
    """
    Regenerates the morning, afternoon, and evening activities and dining
    recommendations for a specific day while keeping the rest of the trip intact.
    """
    try:
        updated_day = await regenerate_day(request)
        return updated_day
    except Exception as exc:
        logger.error(f"Failed to regenerate day: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to regenerate day: {str(exc)}"
        )

@router.post(
    "/regenerate",
    response_model=GeneratedItinerary,
    status_code=status.HTTP_200_OK,
    summary="Regenerate the entire itinerary with fresh variations"
)
async def api_regenerate_trip(request: RegenerateTripRequest):
    """
    Regenerates the entire itinerary with fresh recommendations based on original
    preferences and optional special focus instructions.
    """
    try:
        itinerary = await regenerate_itinerary(request)
        return itinerary
    except Exception as exc:
        logger.error(f"Failed to regenerate itinerary: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to regenerate itinerary: {str(exc)}"
        )
