import pytest
from fastapi.testclient import TestClient
import sys
from pathlib import Path

# Add backend directory to sys.path so imports work cleanly
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "ai" in data
    assert "storage" in data

def test_generate_itinerary_valid():
    payload = {
        "destination": "Tokyo",
        "start_date": "2026-11-01",
        "end_date": "2026-11-03",
        "budget": 2000,
        "currency": "USD",
        "travelers": 2,
        "travel_style": "balanced",
        "interests": ["culture", "food", "history"],
        "dietary_preferences": "Vegetarian",
        "accessibility_requirements": "None"
    }
    response = client.post("/api/itinerary/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "trip_summary" in data
    assert data["trip_summary"]["destination"] == "Tokyo"
    assert data["trip_summary"]["total_days"] == 3
    assert len(data["days"]) == 3
    assert "practical_tips" in data
    assert len(data["practical_tips"]) > 0

    # Verify first day structure
    day1 = data["days"][0]
    assert day1["day_number"] == 1
    assert len(day1["activities"]) >= 3
    assert len(day1["dining"]) >= 3
    assert day1["daily_estimated_cost"] > 0

def test_generate_itinerary_validation_date_error():
    # End date before start date should fail validation
    payload = {
        "destination": "Paris",
        "start_date": "2026-11-05",
        "end_date": "2026-11-01",
        "budget": 1500,
        "currency": "EUR",
        "travelers": 1,
        "travel_style": "budget",
        "interests": ["sightseeing"]
    }
    response = client.post("/api/itinerary/generate", json=payload)
    assert response.status_code == 422

def test_generate_itinerary_negative_budget():
    payload = {
        "destination": "Rome",
        "start_date": "2026-11-01",
        "end_date": "2026-11-03",
        "budget": -500,
        "currency": "EUR",
        "travelers": 1,
        "travel_style": "budget",
        "interests": ["history"]
    }
    response = client.post("/api/itinerary/generate", json=payload)
    assert response.status_code == 422

def test_regenerate_day():
    payload = {
        "preferences": {
            "destination": "Tokyo",
            "start_date": "2026-11-01",
            "end_date": "2026-11-03",
            "budget": 2000,
            "currency": "USD",
            "travelers": 2,
            "travel_style": "balanced",
            "interests": ["culture", "food"]
        },
        "day_number": 2,
        "date": "2026-11-02",
        "focus_note": "more outdoor parks and walking"
    }
    response = client.post("/api/itinerary/regenerate-day", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["day_number"] == 2
    assert len(data["activities"]) >= 3
    assert len(data["dining"]) >= 3

def test_trips_crud_lifecycle():
    # 1. First generate an itinerary
    gen_payload = {
        "destination": "Swiss Alps",
        "start_date": "2026-12-10",
        "end_date": "2026-12-12",
        "budget": 3000,
        "currency": "USD",
        "travelers": 2,
        "travel_style": "luxury",
        "interests": ["nature", "relaxation"]
    }
    gen_res = client.post("/api/itinerary/generate", json=gen_payload)
    assert gen_res.status_code == 200
    itinerary_data = gen_res.json()

    # 2. Save the trip
    save_payload = {
        "title": "Winter in Swiss Alps",
        "preferences": gen_payload,
        "itinerary": itinerary_data,
        "notes": "Remember snow boots and camera batteries"
    }
    create_res = client.post("/api/trips", json=save_payload)
    assert create_res.status_code == 201
    created_trip = create_res.json()
    trip_id = created_trip["id"]
    assert created_trip["title"] == "Winter in Swiss Alps"

    # 3. Retrieve list
    list_res = client.get("/api/trips")
    assert list_res.status_code == 200
    trips = list_res.json()
    assert any(t["id"] == trip_id for t in trips)

    # 4. Retrieve single
    get_res = client.get(f"/api/trips/{trip_id}")
    assert get_res.status_code == 200
    assert get_res.json()["destination"] == "Swiss Alps"

    # 5. Update
    update_res = client.put(f"/api/trips/{trip_id}", json={"title": "Updated Swiss Alps Holiday"})
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "Updated Swiss Alps Holiday"

    # 6. Delete
    delete_res = client.delete(f"/api/trips/{trip_id}")
    assert delete_res.status_code == 200
    assert delete_res.json()["id"] == trip_id

    # 7. Verify deletion
    get_again = client.get(f"/api/trips/{trip_id}")
    assert get_again.status_code == 404
