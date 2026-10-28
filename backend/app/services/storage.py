import json
import uuid
import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from pathlib import Path

from app.config import settings
from app.models import (
    TripCreateRequest,
    TripUpdateRequest,
    TripResponse,
    GeneratedItinerary
)

logger = logging.getLogger("travel_planner.storage")

class StorageService:
    def __init__(self):
        self.supabase_client = None
        if settings.is_supabase_active:
            try:
                from supabase import create_client, Client
                self.supabase_client: Optional[Client] = create_client(
                    settings.SUPABASE_URL,
                    settings.SUPABASE_KEY
                )
                logger.info("Supabase client initialized successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize Supabase client: {e}. Falling back to local storage.")
                self.supabase_client = None

        # Ensure local storage file exists
        if not settings.LOCAL_STORAGE_FILE.exists():
            self._save_local_data([])

    def _read_local_data(self) -> List[Dict[str, Any]]:
        try:
            if settings.LOCAL_STORAGE_FILE.exists():
                with open(settings.LOCAL_STORAGE_FILE, "r", encoding="utf-8") as f:
                    content = f.read().strip()
                    if content:
                        return json.loads(content)
            return []
        except Exception as e:
            logger.error(f"Error reading local trips file: {e}")
            return []

    def _save_local_data(self, data: List[Dict[str, Any]]) -> None:
        try:
            with open(settings.LOCAL_STORAGE_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Error saving local trips file: {e}")

    @property
    def storage_mode(self) -> str:
        return "supabase" if self.supabase_client else "local"

    def get_status(self) -> Dict[str, Any]:
        return {
            "mode": self.storage_mode,
            "supabase_configured": settings.is_supabase_active,
            "local_file": str(settings.LOCAL_STORAGE_FILE),
            "total_local_trips": len(self._read_local_data())
        }

    async def list_trips(self, user_id: Optional[str] = None) -> List[TripResponse]:
        """Retrieve all saved trips."""
        if self.supabase_client:
            try:
                query = self.supabase_client.table("trips").select("*, itineraries(*)")
                if user_id:
                    query = query.eq("user_id", user_id)
                response = query.order("created_at", desc=True).execute()

                trips: List[TripResponse] = []
                for row in response.data:
                    # Construct TripResponse from Supabase relational join
                    itinerary_data = row.get("itineraries", [{}])[0] if row.get("itineraries") else {}
                    # Build GeneratedItinerary object if present
                    if itinerary_data and "days" in itinerary_data:
                        itinerary = GeneratedItinerary(
                            trip_summary={
                                "destination": row["destination"],
                                "total_days": row["total_days"],
                                "travelers": row["travelers"],
                                "travel_style": row["travel_style"],
                                "budget": float(row["budget"]),
                                "currency": row["currency"],
                                "total_estimated_cost": float(row.get("total_estimated_cost") or 0),
                                "remaining_budget": float(row.get("remaining_budget") or 0),
                                "budget_status": "Within budget"
                            },
                            overview=itinerary_data.get("summary", ""),
                            days=itinerary_data.get("days", []),
                            practical_tips=itinerary_data.get("practical_tips", []),
                            is_demo=row.get("is_demo", False),
                            ai_model=itinerary_data.get("ai_model_used", "gemini-3.8-flash")
                        )
                    else:
                        itinerary = None

                    trips.append(
                        TripResponse(
                            id=row["id"],
                            title=row["title"],
                            destination=row["destination"],
                            start_date=str(row["start_date"]),
                            end_date=str(row["end_date"]),
                            total_days=row["total_days"],
                            budget=float(row["budget"]),
                            currency=row["currency"],
                            travelers=row["travelers"],
                            travel_style=row["travel_style"],
                            interests=row.get("interests") or [],
                            dietary_preferences=row.get("dietary_preferences") or "",
                            accessibility_requirements=row.get("accessibility_requirements") or "",
                            total_estimated_cost=float(row.get("total_estimated_cost") or 0),
                            remaining_budget=float(row.get("remaining_budget") or 0),
                            is_demo=row.get("is_demo", False),
                            notes=row.get("notes") or "",
                            itinerary=itinerary,
                            created_at=row["created_at"],
                            updated_at=row["updated_at"]
                        )
                    )
                return trips
            except Exception as e:
                logger.error(f"Supabase list_trips error: {e}. Falling back to local.")

        # Local storage fallback
        raw_items = self._read_local_data()
        results: List[TripResponse] = []
        for item in raw_items:
            try:
                results.append(TripResponse.model_validate(item))
            except Exception as err:
                logger.warning(f"Error parsing local trip {item.get('id')}: {err}")
        return sorted(results, key=lambda x: x.created_at, reverse=True)

    async def get_trip(self, trip_id: str) -> Optional[TripResponse]:
        """Retrieve single trip by ID."""
        trips = await self.list_trips()
        for t in trips:
            if t.id == trip_id:
                return t
        return None

    async def save_trip(self, request: TripCreateRequest, user_id: Optional[str] = None) -> TripResponse:
        """Create and persist a new trip with its itinerary."""
        trip_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()
        pref = request.preferences
        itin = request.itinerary

        title = request.title or f"{pref.destination.title()} Expedition ({pref.total_days} Days)"

        trip_obj = TripResponse(
            id=trip_id,
            title=title,
            destination=pref.destination,
            start_date=pref.start_date,
            end_date=pref.end_date,
            total_days=pref.total_days,
            budget=pref.budget,
            currency=pref.currency,
            travelers=pref.travelers,
            travel_style=pref.travel_style,
            interests=pref.interests,
            dietary_preferences=pref.dietary_preferences or "",
            accessibility_requirements=pref.accessibility_requirements or "",
            total_estimated_cost=itin.trip_summary.total_estimated_cost,
            remaining_budget=itin.trip_summary.remaining_budget,
            is_demo=itin.is_demo,
            notes=request.notes or "",
            itinerary=itin,
            created_at=now_iso,
            updated_at=now_iso
        )

        # Attempt Supabase persistence
        if self.supabase_client:
            try:
                trip_payload = {
                    "id": trip_id,
                    "user_id": user_id,
                    "title": title,
                    "destination": pref.destination,
                    "start_date": pref.start_date,
                    "end_date": pref.end_date,
                    "total_days": pref.total_days,
                    "budget": pref.budget,
                    "currency": pref.currency,
                    "travelers": pref.travelers,
                    "travel_style": pref.travel_style,
                    "interests": pref.interests,
                    "dietary_preferences": pref.dietary_preferences,
                    "accessibility_requirements": pref.accessibility_requirements,
                    "total_estimated_cost": itin.trip_summary.total_estimated_cost,
                    "remaining_budget": itin.trip_summary.remaining_budget,
                    "is_demo": itin.is_demo,
                    "notes": request.notes
                }
                self.supabase_client.table("trips").insert(trip_payload).execute()

                itinerary_payload = {
                    "trip_id": trip_id,
                    "summary": itin.overview,
                    "practical_tips": itin.practical_tips,
                    "days": [d.model_dump() for d in itin.days],
                    "ai_model_used": itin.ai_model
                }
                self.supabase_client.table("itineraries").insert(itinerary_payload).execute()
                logger.info(f"Trip {trip_id} saved to Supabase successfully.")
                return trip_obj
            except Exception as e:
                logger.error(f"Error saving trip to Supabase: {e}. Persisting to local fallback.")

        # Local storage persistence
        local_data = self._read_local_data()
        local_data.insert(0, trip_obj.model_dump())
        self._save_local_data(local_data)
        logger.info(f"Trip {trip_id} saved to local storage.")
        return trip_obj

    async def update_trip(self, trip_id: str, request: TripUpdateRequest) -> Optional[TripResponse]:
        """Update an existing trip."""
        now_iso = datetime.now(timezone.utc).isoformat()

        if self.supabase_client:
            try:
                update_fields: Dict[str, Any] = {"updated_at": now_iso}
                if request.title is not None:
                    update_fields["title"] = request.title
                if request.notes is not None:
                    update_fields["notes"] = request.notes
                if request.itinerary is not None:
                    update_fields["total_estimated_cost"] = request.itinerary.trip_summary.total_estimated_cost
                    update_fields["remaining_budget"] = request.itinerary.trip_summary.remaining_budget

                    self.supabase_client.table("itineraries").update({
                        "summary": request.itinerary.overview,
                        "practical_tips": request.itinerary.practical_tips,
                        "days": [d.model_dump() for d in request.itinerary.days],
                        "updated_at": now_iso
                    }).eq("trip_id", trip_id).execute()

                self.supabase_client.table("trips").update(update_fields).eq("id", trip_id).execute()
                return await self.get_trip(trip_id)
            except Exception as e:
                logger.error(f"Error updating trip in Supabase: {e}. Trying local.")

        local_data = self._read_local_data()
        for idx, item in enumerate(local_data):
            if item.get("id") == trip_id:
                if request.title is not None:
                    item["title"] = request.title
                if request.notes is not None:
                    item["notes"] = request.notes
                if request.itinerary is not None:
                    item["itinerary"] = request.itinerary.model_dump()
                    item["total_estimated_cost"] = request.itinerary.trip_summary.total_estimated_cost
                    item["remaining_budget"] = request.itinerary.trip_summary.remaining_budget
                item["updated_at"] = now_iso
                local_data[idx] = item
                self._save_local_data(local_data)
                return TripResponse.model_validate(item)

        return None

    async def delete_trip(self, trip_id: str) -> bool:
        """Delete a saved trip."""
        if self.supabase_client:
            try:
                self.supabase_client.table("trips").delete().eq("id", trip_id).execute()
                logger.info(f"Trip {trip_id} deleted from Supabase.")
                return True
            except Exception as e:
                logger.error(f"Error deleting trip from Supabase: {e}.")

        local_data = self._read_local_data()
        initial_len = len(local_data)
        filtered = [item for item in local_data if item.get("id") != trip_id]
        if len(filtered) < initial_len:
            self._save_local_data(filtered)
            logger.info(f"Trip {trip_id} deleted from local storage.")
            return True
        return False

storage_service = StorageService()
