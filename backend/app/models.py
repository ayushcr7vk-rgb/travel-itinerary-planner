from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator, model_validator

class ActivityItem(BaseModel):
    time_slot: str = Field(..., description="Morning, Afternoon, or Evening")
    title: str = Field(..., min_length=2, max_length=150)
    description: str = Field(..., min_length=5, max_length=1000)
    location: str = Field(..., min_length=2, max_length=150)
    suggested_transportation: str = Field(default="Walking or public metro")
    estimated_cost: float = Field(default=0.0, ge=0.0)
    duration_hours: float = Field(default=2.0, ge=0.5, le=12.0)
    category: str = Field(default="sightseeing")

class DiningRecommendation(BaseModel):
    meal_type: str = Field(..., description="Breakfast, Lunch, or Dinner")
    venue_name: str = Field(..., min_length=2, max_length=150)
    cuisine: str = Field(default="Local cuisine")
    description: str = Field(..., min_length=5, max_length=500)
    dietary_notes: str = Field(default="Standard options available")
    estimated_cost: float = Field(default=15.0, ge=0.0)

class DayItinerary(BaseModel):
    day_number: int = Field(..., ge=1)
    date: str = Field(..., description="Date string YYYY-MM-DD or formatted")
    theme: str = Field(default="Exploration and Highlights")
    activities: List[ActivityItem] = Field(default_factory=list)
    dining: List[DiningRecommendation] = Field(default_factory=list)
    daily_estimated_cost: float = Field(default=0.0, ge=0.0)
    daily_notes: Optional[str] = Field(default=None)

class TripSummary(BaseModel):
    destination: str
    total_days: int
    travelers: int
    travel_style: str
    budget: float
    currency: str
    total_estimated_cost: float
    remaining_budget: float
    budget_status: str = Field(description="'Under budget', 'Within budget', or 'Budget stretched'")

class TripPreferences(BaseModel):
    destination: str = Field(..., min_length=2, max_length=150, description="City, region, or country")
    start_date: str = Field(..., description="Start date in YYYY-MM-DD format")
    end_date: str = Field(..., description="End date in YYYY-MM-DD format")
    budget: float = Field(..., gt=0, description="Total budget in selected currency")
    currency: str = Field(default="USD", max_length=10)
    travelers: int = Field(default=1, ge=1, le=50, description="Number of travelers")
    travel_style: str = Field(default="balanced", description="budget, balanced, or luxury")
    interests: List[str] = Field(
        default_factory=lambda: ["culture", "food", "sightseeing"],
        description="adventure, nature, food, history, culture, shopping, relaxation"
    )
    dietary_preferences: Optional[str] = Field(default="", max_length=200)
    accessibility_requirements: Optional[str] = Field(default="", max_length=200)

    @field_validator("start_date", "end_date")
    @classmethod
    def validate_date_format(cls, v: str) -> str:
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError("Date must be in YYYY-MM-DD format")
        return v

    @model_validator(mode="after")
    def validate_date_range(self) -> "TripPreferences":
        s_date = datetime.strptime(self.start_date, "%Y-%m-%d").date()
        e_date = datetime.strptime(self.end_date, "%Y-%m-%d").date()
        if e_date < s_date:
            raise ValueError("end_date must be on or after start_date")
        duration = (e_date - s_date).days + 1
        if duration > 14:
            raise ValueError("Itineraries are supported for trips up to 14 days")
        return self

    @property
    def total_days(self) -> int:
        s_date = datetime.strptime(self.start_date, "%Y-%m-%d").date()
        e_date = datetime.strptime(self.end_date, "%Y-%m-%d").date()
        return (e_date - s_date).days + 1

class GeneratedItinerary(BaseModel):
    trip_summary: TripSummary
    overview: str = Field(description="Inspiring trip introduction and narrative")
    days: List[DayItinerary] = Field(default_factory=list)
    practical_tips: List[str] = Field(default_factory=list)
    disclaimer: str = Field(default="Estimated costs are AI-generated suggestions. Verify live opening hours and prices before travel.")
    is_demo: bool = Field(default=False)
    ai_model: str = Field(default="gemini-3.8-flash")

class RegenerateDayRequest(BaseModel):
    preferences: TripPreferences
    day_number: int = Field(..., ge=1)
    date: str
    focus_note: Optional[str] = Field(default="", description="Specific request, e.g., 'more outdoor activities'")

class RegenerateTripRequest(BaseModel):
    preferences: TripPreferences
    special_instructions: Optional[str] = Field(default="")

class TripCreateRequest(BaseModel):
    title: Optional[str] = None
    preferences: TripPreferences
    itinerary: GeneratedItinerary
    notes: Optional[str] = ""

class TripUpdateRequest(BaseModel):
    title: Optional[str] = None
    notes: Optional[str] = None
    itinerary: Optional[GeneratedItinerary] = None

class TripResponse(BaseModel):
    id: str
    title: str
    destination: str
    start_date: str
    end_date: str
    total_days: int
    budget: float
    currency: str
    travelers: int
    travel_style: str
    interests: List[str]
    dietary_preferences: Optional[str] = ""
    accessibility_requirements: Optional[str] = ""
    total_estimated_cost: float
    remaining_budget: float
    is_demo: bool
    notes: Optional[str] = ""
    itinerary: GeneratedItinerary
    created_at: str
    updated_at: str
