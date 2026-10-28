import logging
from typing import List
from fastapi import APIRouter, HTTPException, status
from app.models import (
    TripCreateRequest,
    TripUpdateRequest,
    TripResponse
)
from app.services.storage import storage_service

logger = logging.getLogger("travel_planner.trips_routes")
router = APIRouter(prefix="/api/trips", tags=["Trips"])

@router.get(
    "",
    response_model=List[TripResponse],
    status_code=status.HTTP_200_OK,
    summary="Retrieve all saved trips"
)
async def api_get_saved_trips():
    """
    Retrieves all saved trips from Supabase (or local store if Supabase is unconfigured).
    """
    try:
        return await storage_service.list_trips()
    except Exception as exc:
        logger.error(f"Error fetching saved trips: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve saved trips"
        )

@router.get(
    "/{trip_id}",
    response_model=TripResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve a specific trip by ID"
)
async def api_get_trip_by_id(trip_id: str):
    trip = await storage_service.get_trip(trip_id)
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip with ID {trip_id} not found"
        )
    return trip

@router.post(
    "",
    response_model=TripResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save a generated trip"
)
async def api_create_saved_trip(request: TripCreateRequest):
    try:
        saved_trip = await storage_service.save_trip(request)
        return saved_trip
    except Exception as exc:
        logger.error(f"Error saving trip: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save trip: {str(exc)}"
        )

@router.put(
    "/{trip_id}",
    response_model=TripResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a saved trip title, notes, or itinerary content"
)
async def api_update_saved_trip(trip_id: str, request: TripUpdateRequest):
    updated = await storage_service.update_trip(trip_id, request)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip with ID {trip_id} not found or could not be updated"
        )
    return updated

@router.delete(
    "/{trip_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a saved trip"
)
async def api_delete_saved_trip(trip_id: str):
    success = await storage_service.delete_trip(trip_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip with ID {trip_id} not found"
        )
    return {"message": "Trip successfully deleted", "id": trip_id}
