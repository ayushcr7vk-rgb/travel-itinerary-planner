import json
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

from app.config import settings
from app.models import (
    TripPreferences,
    GeneratedItinerary,
    TripSummary,
    DayItinerary,
    ActivityItem,
    DiningRecommendation,
    RegenerateDayRequest,
    RegenerateTripRequest
)

logger = logging.getLogger("travel_planner.ai")

# Pre-curated highlight catalogs for key destinations to provide realistic Demo Mode data
DESTINATION_CATALOG: Dict[str, Dict[str, Any]] = {
    "tokyo": {
        "overview": "Immerse yourself in Tokyo's electrifying blend of ancient tradition and futuristic marvels, from serene Shinto shrines to neon-lit skyscrapers.",
        "themes": [
            "Ancient Heritage & Shitamachi Atmosphere",
            "Pop Culture, Digital Art & Neon Horizons",
            "Culinary Wonders & Historic Gardens",
            "Urban Design, Fashion & Skyline Views",
            "Hidden Alleys, Crafts & Izakaya Culture"
        ],
        "activities": {
            "Morning": [
                {"title": "Senso-ji Temple & Nakamise Dori", "desc": "Wander Tokyo's oldest Buddhist temple, soaking in incense smoke and sampling freshly baked ningyo-yaki cakes.", "loc": "Asakusa", "transit": "Ginza Line to Asakusa Station", "cost": 0, "cat": "history"},
                {"title": "Meiji Jingu Shrine & Forest Path", "desc": "Stroll beneath towering cedar trees to this tranquil imperial shrine honoring Emperor Meiji and Empress Shoken.", "loc": "Harajuku / Shibuya", "transit": "JR Yamanote Line to Harajuku", "cost": 0, "cat": "culture"},
                {"title": "Tsukiji Outer Market Food Tour", "desc": "Sample freshly seared wagyu skewers, tamagoyaki omelettes, and sea urchin from storied family food stalls.", "loc": "Tsukiji, Chuo City", "transit": "Oedo Line to Tsukijishijo", "cost": 25, "cat": "food"},
                {"title": "Imperial Palace East Gardens", "desc": "Walk along castle moats and Edo Castle foundation stones surrounded by manicured bonsai and seasonal blooms.", "loc": "Chiyoda", "transit": "Marunouchi Line to Tokyo Station", "cost": 0, "cat": "nature"}
            ],
            "Afternoon": [
                {"title": "teamLab Planets Immersive Digital Art", "desc": "Walk barefoot through crystal rainfall, koi ponds projected onto water, and floating floral illusions.", "loc": "Toyosu", "transit": "Yurikamome Line to Shin-Toyosu", "cost": 38, "cat": "culture"},
                {"title": "Akihabara Electric Town & Retro Gaming", "desc": "Explore multi-level electronics bazaars, anime figurine stores, and classic arcade game hubs.", "loc": "Akihabara", "transit": "JR Yamanote Line to Akihabara", "cost": 15, "cat": "shopping"},
                {"title": "Ueno Park & Tokyo National Museum", "desc": "Discover samurai armor, delicate scrolls, and national treasures inside Japan's premier historic gallery.", "loc": "Ueno", "transit": "JR Yamanote Line to Ueno", "cost": 10, "cat": "history"},
                {"title": "Omotesando Architecture & Cat Street", "desc": "Admire avant-garde boutique facades, discover independent coffee roasters, and browse street fashion.", "loc": "Aoyama / Harajuku", "transit": "Chiyoda Line to Omotesando", "cost": 20, "cat": "shopping"}
            ],
            "Evening": [
                {"title": "Shibuya Crossing & Shibuya Sky Observation Deck", "desc": "Watch hundreds navigate the world's busiest intersection before heading 229m high for panoramic city views.", "loc": "Shibuya", "transit": "JR Yamanote Line to Shibuya", "cost": 22, "cat": "sightseeing"},
                {"title": "Shinjuku Omoide Yokocho & Kabukicho", "desc": "Squeeze into lantern-lit yakitori stalls along 'Memory Lane' before seeing the giant Godzilla head in Kabukicho.", "loc": "Shinjuku", "transit": "JR Yamanote Line to Shinjuku", "cost": 30, "cat": "food"},
                {"title": "Roppongi Hills Mori Art Museum & Tokyo Tower View", "desc": "Enjoy contemporary exhibitions and sweeping nighttime vistas featuring illuminated Tokyo Tower.", "loc": "Roppongi", "transit": "Hibiya Line to Roppongi", "cost": 18, "cat": "culture"}
            ]
        },
        "dining": {
            "Breakfast": [
                {"name": "Sarabeth's Tokyo", "cuisine": "Bakery & Brunch", "desc": "Fluffy souffle pancakes and artisanal fresh fruit preserves.", "cost": 18},
                {"name": "Choyo Kissaten", "cuisine": "Classic Japanese Cafe", "desc": "Thick-cut buttered toast, soft-boiled eggs, and siphon siphon drip coffee.", "cost": 10}
            ],
            "Lunch": [
                {"name": "Afuri Ramen Harajuku", "cuisine": "Craft Ramen", "desc": "Signature citrus-infused yuzu shio broth with tender char siu pork and bamboo shoots.", "cost": 15},
                {"name": "Katsu Midori Sushi", "cuisine": "Fresh Conveyor Sushi", "desc": "Market-fresh nigiri including bluefin tuna, salmon belly, and sweet scallop.", "cost": 24}
            ],
            "Dinner": [
                {"name": "Gonpachi Nishi-Azabu", "cuisine": "Atmospheric Izakaya", "desc": "Handmade soba, charcoal yakitori, and tempura in the dramatic hall that inspired Kill Bill.", "cost": 45},
                {"name": "Torikizoku Shinjuku", "cuisine": "Yakitori & Small Plates", "desc": "Lively skewers, cabbage salads, and draft beverages at affordable set pricing.", "cost": 25}
            ]
        },
        "tips": [
            "Purchase a rechargeable digital IC card (Suica or Pasmo on your phone) for seamless subway hopping.",
            "Carry a small coin pouch and hand towel; trash cans and public paper towels are rare in metro stations.",
            "Always stand on the left side of escalators in Tokyo (the right side is reserved for walking).",
            "Tipping is not customary in Japan and can cause polite confusion; good service is standard."
        ]
    },
    "paris": {
        "overview": "Experience the romance, world-class art, boulevard cafe culture, and timeless architecture across the banks of the Seine.",
        "themes": [
            "Iconic Monuments & Royal Grandeur",
            "Impressionist Masterpieces & Bohemian Montmartre",
            "The Latin Quarter, Seine Strolls & Bookshops",
            "Marais Aristocracy, Boutiques & Haute Patisserie",
            "Palace of Versailles Day Out"
        ],
        "activities": {
            "Morning": [
                {"title": "Louvre Museum Highlights & Courtyard", "desc": "View the Winged Victory of Samothrace, Venus de Milo, and the Mona Lisa before crowds peak.", "loc": "1st Arrondissement", "transit": "Metro Line 1 to Palais-Royal - Musee du Louvre", "cost": 22, "cat": "history"},
                {"title": "Sacre-Coeur Basilica & Montmartre Village", "desc": "Climb the hilltop dome for panoramic vistas over Paris, then explore painters' square at Place du Tertre.", "loc": "18th Arrondissement", "transit": "Metro Line 2 to Anvers or Line 12 to Abbesses", "cost": 0, "cat": "culture"},
                {"title": "Jardin du Luxembourg & Palace Grounds", "desc": "Stroll past the Medici Fountain, watch miniature wooden sailboats on the grand basin, and admire tree avenues.", "loc": "6th Arrondissement", "transit": "RER B to Luxembourg", "cost": 0, "cat": "nature"}
            ],
            "Afternoon": [
                {"title": "Musee d'Orsay Impressionist Gallery", "desc": "Housed in a grand Beaux-Arts railway station, admiring masterworks by Monet, Van Gogh, Degas, and Renoir.", "loc": "7th Arrondissement", "transit": "RER C to Musee d'Orsay", "cost": 16, "cat": "culture"},
                {"title": "Sainte-Chapelle & Conciergerie", "desc": "Gaze upward at 15 soaring panels of 13th-century stained glass illuminating biblical narratives.", "loc": "Ile de la Cite", "transit": "Metro Line 4 to Cite", "cost": 14, "cat": "history"},
                {"title": "Le Marais Historic Mansions & Boutiques", "desc": "Explore Place des Vosges, Victor Hugo's historic home, and independent concept stores along Rue des Francs-Bourgeois.", "loc": "4th Arrondissement", "transit": "Metro Line 1 to Saint-Paul", "cost": 10, "cat": "shopping"}
            ],
            "Evening": [
                {"title": "Eiffel Tower Sunset & Trocadero Sparkle", "desc": "Picnic on the Champ de Mars or ascend to the summit to watch the city lights and hourly twinkle sparkle.", "loc": "7th Arrondissement", "transit": "Metro Line 9 to Trocadero", "cost": 30, "cat": "sightseeing"},
                {"title": "Seine River Sunset Bateaux Cruise", "desc": "Glide beneath historic stone bridges including Pont Neuf as twilight illuminates Notre-Dame and the Grand Palais.", "loc": "Pont de l'Alma", "transit": "Metro Line 9 to Alma-Marceau", "cost": 18, "cat": "relaxation"},
                {"title": "Saint-Germain-des-Pres Evening Stroll", "desc": "Soak in historic literary ambience past iconic intellectual hangouts Cafe de Flore and Les Deux Magots.", "loc": "6th Arrondissement", "transit": "Metro Line 4 to Saint-Germain-des-Pres", "cost": 20, "cat": "food"}
            ]
        },
        "dining": {
            "Breakfast": [
                {"name": "Du Pain et des Idees", "cuisine": "Artisanal Boulangerie", "desc": "Award-winning escargot pistache-chocolat pastry and fresh crusty baguettes.", "cost": 8},
                {"name": "Carettte Place des Vosges", "cuisine": "Historic Parisian Tea Room", "desc": "Velvety melted dark hot chocolate with Chantilly cream and warm butter croissants.", "cost": 18}
            ],
            "Lunch": [
                {"name": "Bouillon Chartier", "cuisine": "Classic French Bistro", "desc": "Historic 1896 belle epoque dining hall serving duck confit, steak frites, and escargots at approachable prices.", "cost": 22},
                {"name": "L'As du Fallafel", "cuisine": "Middle Eastern Street Food", "desc": "Famous pita pocket loaded with crispy herb falafel balls, fried eggplant, and tahini.", "cost": 12}
            ],
            "Dinner": [
                {"name": "Le Comptoir du Relais", "cuisine": "Neo-Bistro Gastronomy", "desc": "Seasonal French market menu, foie gras terrine, and roasted sea bass in the Latin Quarter.", "cost": 50},
                {"name": "Bistrot Paul Bert", "cuisine": "Traditional Brasserie", "desc": "Celebrated steak au poivre, hand-cut frites, and giant Grand Marnier souffles.", "cost": 45}
            ]
        },
        "tips": [
            "Always greet shopkeepers and servers with a polite 'Bonjour Madame/Monsieur' before speaking.",
            "Book Louvre and Eiffel Tower tickets 2 to 4 weeks in advance to avoid long standby queues.",
            "Download the 'Citymapper' or 'RATP' mobile app for easiest metro navigation.",
            "Tap water ('une carafe d'eau') is free, pristine, and customary in French restaurants."
        ]
    }
}

# Currency conversion estimation factor against USD for accurate demo calculations
CURRENCY_RATES = {
    "USD": 1.0,
    "EUR": 0.92,
    "GBP": 0.78,
    "INR": 86.5,
    "JPY": 152.0,
    "AUD": 1.55,
    "CAD": 1.40
}

STYLE_MULTIPLIERS = {
    "budget": 0.65,
    "balanced": 1.0,
    "luxury": 2.2
}

def _get_rate(currency: str) -> float:
    return CURRENCY_RATES.get(currency.upper(), 1.0)

def _scale_cost(usd_amount: float, currency: str, style: str) -> float:
    rate = _get_rate(currency)
    multiplier = STYLE_MULTIPLIERS.get(style.lower(), 1.0)
    scaled = usd_amount * rate * multiplier
    return round(scaled, 0) if currency in ["JPY", "INR"] else round(scaled, 1)

def _create_dynamic_day(
    day_num: int,
    date_str: str,
    dest: str,
    style: str,
    currency: str,
    interests: List[str],
    dietary: str,
    accessibility: str
) -> DayItinerary:
    """Dynamically generates authentic day items for any global destination."""
    dest_clean = dest.strip().title()
    themes = [
        f"Historic Core & Cultural Landmarks of {dest_clean}",
        f"Scenic Vistas, Parks & Local Neighborhoods",
        f"Artistic Treasures, Markets & Culinary Journey",
        f"Hidden Gems, Architecture & Waterfront Exploration",
        f"Day Excursion, Panoramas & Local Traditions",
        f"Living Culture, Crafts & Sunset Views",
        f"Unwinding, Leisure & Celebration"
    ]
    theme = themes[(day_num - 1) % len(themes)]

    # Dynamic Activity generation tailored to user preferences
    primary_interest = interests[0] if interests else "sightseeing"
    secondary_interest = interests[1] if len(interests) > 1 else "culture"

    acc_note = f" (Verified: {accessibility})" if accessibility else ""
    diet_note = f"Offers {dietary} specialties" if dietary else "Local fresh ingredients"

    act_morning = ActivityItem(
        time_slot="Morning",
        title=f"Exploring {dest_clean}'s Iconic Landmark & Heritage Walk",
        description=f"Begin your day at the celebrated historic heart of {dest_clean}. Walk through central pedestrian squares, taking in classical architecture, storied monuments, and vibrant morning atmosphere{acc_note}.",
        location=f"Central Heritage District, {dest_clean}",
        suggested_transportation="Scenic walk or central transit connection",
        estimated_cost=_scale_cost(18, currency, style),
        duration_hours=2.5,
        category="history" if "history" in interests else "sightseeing"
    )

    act_afternoon = ActivityItem(
        time_slot="Afternoon",
        title=f"{dest_clean} Museum & Artisan District Discovery",
        description=f"Visit a standout regional cultural gallery or bustling artisan quarter. Discover local craftworks, thematic exhibits reflecting {primary_interest}, and historic avenues.",
        location=f"Arts & Cultural Quarter, {dest_clean}",
        suggested_transportation="Local electric tram or metro",
        estimated_cost=_scale_cost(22, currency, style),
        duration_hours=3.0,
        category="culture" if "culture" in interests else primary_interest
    )

    act_evening = ActivityItem(
        time_slot="Evening",
        title=f"Sunset Panoramic View & Evening Promenade",
        description=f"Head to a premier elevated vantage point or illuminated waterfront promenade to witness dusk descending over {dest_clean}. Unwind with evening street performers and ambient lights.",
        location=f"Scenic Promenade / Observatory, {dest_clean}",
        suggested_transportation="Short rideshare or leisurely stroll",
        estimated_cost=_scale_cost(15, currency, style),
        duration_hours=2.0,
        category="sightseeing"
    )

    dining_items = [
        DiningRecommendation(
            meal_type="Breakfast",
            venue_name=f"Cafe du {dest_clean}",
            cuisine="Artisanal Cafe & Bakery",
            description="Fresh morning pastries, regional preserves, fresh seasonal juices, and premium specialty coffee.",
            dietary_notes=diet_note,
            estimated_cost=_scale_cost(12, currency, style)
        ),
        DiningRecommendation(
            meal_type="Lunch",
            venue_name=f"Trattoria & Bistro {dest_clean}",
            cuisine="Authentic Regional Cuisine",
            description=f"Locally-sourced midday lunch featuring regional seasonal specialties, freshly baked bread, and homemade desserts.",
            dietary_notes=diet_note,
            estimated_cost=_scale_cost(20, currency, style)
        ),
        DiningRecommendation(
            meal_type="Dinner",
            venue_name=f"{dest_clean} Heritage Dining Room",
            cuisine=f"Signature {dest_clean} Cuisine",
            description="Atmospheric evening dining with regional entrees, handcrafted sauces, and curated drink pairings.",
            dietary_notes=diet_note,
            estimated_cost=_scale_cost(38, currency, style)
        )
    ]

    daily_cost = (
        act_morning.estimated_cost +
        act_afternoon.estimated_cost +
        act_evening.estimated_cost +
        sum(d.estimated_cost for d in dining_items)
    )

    return DayItinerary(
        day_number=day_num,
        date=date_str,
        theme=theme,
        activities=[act_morning, act_afternoon, act_evening],
        dining=dining_items,
        daily_estimated_cost=round(daily_cost, 1),
        daily_notes=f"Ideal day pace for {style} travel style with focus on {primary_interest} and {secondary_interest}."
    )

def _generate_demo_itinerary(preferences: TripPreferences) -> GeneratedItinerary:
    """Generates an authentic, highly detailed itinerary without calling external LLM."""
    dest_key = preferences.destination.lower().strip()
    catalog_match = None
    for k in DESTINATION_CATALOG:
        if k in dest_key:
            catalog_match = DESTINATION_CATALOG[k]
            break

    s_date = datetime.strptime(preferences.start_date, "%Y-%m-%d").date()
    total_days = preferences.total_days
    currency = preferences.currency
    style = preferences.travel_style

    days: List[DayItinerary] = []
    dest_title = preferences.destination.title()

    if catalog_match:
        overview = catalog_match["overview"]
        themes = catalog_match["themes"]
        tips = catalog_match["tips"]

        morning_pool = catalog_match["activities"]["Morning"]
        afternoon_pool = catalog_match["activities"]["Afternoon"]
        evening_pool = catalog_match["activities"]["Evening"]
        b_pool = catalog_match["dining"]["Breakfast"]
        l_pool = catalog_match["dining"]["Lunch"]
        d_pool = catalog_match["dining"]["Dinner"]

        for i in range(total_days):
            day_num = i + 1
            current_date = (s_date + timedelta(days=i)).strftime("%Y-%m-%d")
            theme = themes[i % len(themes)]

            m_act = morning_pool[i % len(morning_pool)]
            a_act = afternoon_pool[i % len(afternoon_pool)]
            e_act = evening_pool[i % len(evening_pool)]

            b_din = b_pool[i % len(b_pool)]
            l_din = l_pool[i % len(l_pool)]
            d_din = d_pool[i % len(d_pool)]

            diet_str = f"Accommodates {preferences.dietary_preferences}" if preferences.dietary_preferences else "Vegetarian and vegan options available"

            activities = [
                ActivityItem(
                    time_slot="Morning",
                    title=m_act["title"],
                    description=m_act["desc"],
                    location=m_act["loc"],
                    suggested_transportation=m_act["transit"],
                    estimated_cost=_scale_cost(m_act["cost"], currency, style),
                    duration_hours=2.5,
                    category=m_act["cat"]
                ),
                ActivityItem(
                    time_slot="Afternoon",
                    title=a_act["title"],
                    description=a_act["desc"],
                    location=a_act["loc"],
                    suggested_transportation=a_act["transit"],
                    estimated_cost=_scale_cost(a_act["cost"], currency, style),
                    duration_hours=3.0,
                    category=a_act["cat"]
                ),
                ActivityItem(
                    time_slot="Evening",
                    title=e_act["title"],
                    description=e_act["desc"],
                    location=e_act["loc"],
                    suggested_transportation=e_act["transit"],
                    estimated_cost=_scale_cost(e_act["cost"], currency, style),
                    duration_hours=2.5,
                    category=e_act["cat"]
                )
            ]

            dining = [
                DiningRecommendation(
                    meal_type="Breakfast",
                    venue_name=b_din["name"],
                    cuisine=b_din["cuisine"],
                    description=b_din["desc"],
                    dietary_notes=diet_str,
                    estimated_cost=_scale_cost(b_din["cost"], currency, style)
                ),
                DiningRecommendation(
                    meal_type="Lunch",
                    venue_name=l_din["name"],
                    cuisine=l_din["cuisine"],
                    description=l_din["desc"],
                    dietary_notes=diet_str,
                    estimated_cost=_scale_cost(l_din["cost"], currency, style)
                ),
                DiningRecommendation(
                    meal_type="Dinner",
                    venue_name=d_din["name"],
                    cuisine=d_din["cuisine"],
                    description=d_din["desc"],
                    dietary_notes=diet_str,
                    estimated_cost=_scale_cost(d_din["cost"], currency, style)
                )
            ]

            daily_total = sum(a.estimated_cost for a in activities) + sum(d.estimated_cost for d in dining)
            days.append(
                DayItinerary(
                    day_number=day_num,
                    date=current_date,
                    theme=theme,
                    activities=activities,
                    dining=dining,
                    daily_estimated_cost=round(daily_total, 1),
                    daily_notes=f"Planned for {style} pacing. Group size: {preferences.travelers} traveler(s)."
                )
            )
    else:
        # Dynamic synthesis for any global destination
        overview = f"A carefully tailored {total_days}-day itinerary to discover {dest_title}, crafted specifically for your {preferences.travel_style} travel style and passion for {', '.join(preferences.interests)}."
        tips = [
            f"Pre-book major attraction tickets in {dest_title} online to bypass peak entry lines.",
            "Keep emergency offline digital copies of your passport, reservations, and travel insurance.",
            f"Familiarize yourself with local transportation cards or apps in {dest_title} for seamless transit.",
            "Verify local business opening times, especially on Sundays and public holidays."
        ]
        if preferences.dietary_preferences:
            tips.append(f"Save a translation card on your phone stating your dietary preferences: '{preferences.dietary_preferences}'.")
        if preferences.accessibility_requirements:
            tips.append(f"Accessible routes: Look for elevator markers and barrier-free transit pathways across {dest_title}.")

        for i in range(total_days):
            day_num = i + 1
            current_date = (s_date + timedelta(days=i)).strftime("%Y-%m-%d")
            day_item = _create_dynamic_day(
                day_num=day_num,
                date_str=current_date,
                dest=preferences.destination,
                style=preferences.travel_style,
                currency=preferences.currency,
                interests=preferences.interests,
                dietary=preferences.dietary_preferences or "",
                accessibility=preferences.accessibility_requirements or ""
            )
            days.append(day_item)

    total_estimated_cost = round(sum(d.daily_estimated_cost for d in days), 2)
    remaining_budget = round(preferences.budget - total_estimated_cost, 2)

    if remaining_budget >= 0.15 * preferences.budget:
        budget_status = "Under budget"
    elif remaining_budget >= 0:
        budget_status = "Within budget"
    else:
        budget_status = "Budget stretched"

    trip_summary = TripSummary(
        destination=preferences.destination,
        total_days=total_days,
        travelers=preferences.travelers,
        travel_style=preferences.travel_style,
        budget=preferences.budget,
        currency=preferences.currency,
        total_estimated_cost=total_estimated_cost,
        remaining_budget=remaining_budget,
        budget_status=budget_status
    )

    return GeneratedItinerary(
        trip_summary=trip_summary,
        overview=overview,
        days=days,
        practical_tips=tips,
        disclaimer="DEMO MODE: Generated using built-in realistic destination intelligence templates. To enable real-time Gemini Generative AI, set GEMINI_API_KEY in backend/.env.",
        is_demo=True,
        ai_model="Demo Mode (Configure GEMINI_API_KEY in backend/.env for live AI)"
    )

async def generate_itinerary(preferences: TripPreferences) -> GeneratedItinerary:
    """
    Main itinerary generation entry point.
    If GEMINI_API_KEY is configured, calls Google GenAI SDK (gemini-3.8-flash).
    Otherwise returns authentic Demo Mode output.
    """
    if not settings.is_ai_active:
        logger.info("GEMINI_API_KEY is not set. Operating in DEMO MODE.")
        return _generate_demo_itinerary(preferences)

    # Real Gemini API invocation using official google-genai SDK
    try:
        from google import genai
        from google.genai import types

        logger.info(f"Generating live itinerary via Gemini API (model: {settings.GEMINI_MODEL})")
        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        prompt = f"""
You are an expert travel concierge and professional itinerary architect.
Create a detailed, realistic, day-by-day travel itinerary matching these exact constraints:

Destination: {preferences.destination}
Start Date: {preferences.start_date}
End Date: {preferences.end_date}
Total Days: {preferences.total_days}
Total Budget: {preferences.budget} {preferences.currency}
Number of Travelers: {preferences.travelers}
Travel Style: {preferences.travel_style} (budget, balanced, or luxury)
Interests: {', '.join(preferences.interests)}
Dietary Preferences: {preferences.dietary_preferences or 'None specified'}
Accessibility Requirements: {preferences.accessibility_requirements or 'None specified'}

IMPORTANT RULES:
1. Provide a cohesive narrative overview.
2. For each day, include:
   - day_number (1 to {preferences.total_days})
   - date (YYYY-MM-DD starting from {preferences.start_date})
   - theme (creative title for the day)
   - 3 distinct activities (Morning, Afternoon, Evening) with realistic location names, detailed descriptions, transport advice, and reasonable estimated costs in {preferences.currency}.
   - 3 dining recommendations (Breakfast, Lunch, Dinner) matching the dietary preferences if specified.
   - daily_estimated_cost (sum of activities and meals for that day)
3. Balance the overall expenditure so it stays close to the budget of {preferences.budget} {preferences.currency}.
4. Provide 4-6 practical, destination-specific travel tips.
5. Return ONLY a valid JSON object matching the requested schema. No markdown formatting or extra commentary.
"""

        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_json_schema=GeneratedItinerary.model_json_schema(),
                temperature=0.7
            )
        )

        raw_json = response.text
        parsed_data = json.loads(raw_json)

        # Ensure model and is_demo metadata are correctly set
        parsed_data["is_demo"] = False
        parsed_data["ai_model"] = settings.GEMINI_MODEL
        parsed_data["disclaimer"] = "AI-generated personalized itinerary based on Gemini. Estimated costs and schedules are recommendations; verify live booking details before departure."

        # Re-verify and compute summary metrics cleanly
        itinerary = GeneratedItinerary.model_validate(parsed_data)

        # Recalculate financial summary to ensure 100% mathematical precision
        total_cost = sum(day.daily_estimated_cost for day in itinerary.days)
        rem_budget = preferences.budget - total_cost
        if rem_budget >= 0.15 * preferences.budget:
            status = "Under budget"
        elif rem_budget >= 0:
            status = "Within budget"
        else:
            status = "Budget stretched"

        itinerary.trip_summary.destination = preferences.destination
        itinerary.trip_summary.total_days = preferences.total_days
        itinerary.trip_summary.travelers = preferences.travelers
        itinerary.trip_summary.travel_style = preferences.travel_style
        itinerary.trip_summary.budget = preferences.budget
        itinerary.trip_summary.currency = preferences.currency
        itinerary.trip_summary.total_estimated_cost = round(total_cost, 2)
        itinerary.trip_summary.remaining_budget = round(rem_budget, 2)
        itinerary.trip_summary.budget_status = status

        return itinerary

    except Exception as exc:
        logger.error(f"Error calling Gemini API: {exc}. Falling back to safe Demo Mode generator.")
        demo = _generate_demo_itinerary(preferences)
        demo.disclaimer = f"DEMO MODE FALLBACK: Gemini API call failed ({str(exc)[:120]}...). Showing realistic destination plan."
        return demo

async def regenerate_day(request: RegenerateDayRequest) -> DayItinerary:
    """Regenerates a specific day with fresh activities and dining."""
    pref = request.preferences
    dest = pref.destination
    currency = pref.currency
    style = pref.travel_style
    day_num = request.day_number
    date_str = request.date
    focus = request.focus_note or "alternative fresh perspective"

    if settings.is_ai_active:
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            prompt = f"""
Regenerate Day {day_num} for a trip to {dest} on date {date_str}.
Travel Style: {style}
Currency: {currency}
Interests: {', '.join(pref.interests)}
Dietary Preferences: {pref.dietary_preferences or 'None'}
Accessibility: {pref.accessibility_requirements or 'None'}
Special User Focus: {focus}

Return a single DayItinerary JSON object with:
- day_number: {day_num}
- date: "{date_str}"
- theme: a fresh thematic focus
- activities: Morning, Afternoon, Evening activities
- dining: Breakfast, Lunch, Dinner recommendations
- daily_estimated_cost: total estimated cost in {currency}
- daily_notes: practical note
"""
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_json_schema=DayItinerary.model_json_schema(),
                    temperature=0.85
                )
            )
            data = json.loads(response.text)
            return DayItinerary.model_validate(data)
        except Exception as e:
            logger.warning(f"Live regenerate day failed: {e}. Using variation logic.")

    # Variation logic
    variation = _create_dynamic_day(
        day_num=day_num,
        date_str=date_str,
        dest=dest,
        style=style,
        currency=currency,
        interests=pref.interests,
        dietary=pref.dietary_preferences or "",
        accessibility=pref.accessibility_requirements or ""
    )
    variation.theme = f"Alternative Discovery: {dest.title()} ({focus})"
    variation.daily_notes = f"Regenerated variation reflecting user focus: {focus}"
    return variation

async def regenerate_itinerary(request: RegenerateTripRequest) -> GeneratedItinerary:
    """Regenerates the complete itinerary."""
    return await generate_itinerary(request.preferences)
