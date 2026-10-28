import os
from pathlib import Path
from dotenv import load_dotenv

# Base backend directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env file if present
ENV_PATH = BASE_DIR / ".env"
load_dotenv(dotenv_path=ENV_PATH)

class Settings:
    PROJECT_NAME: str = "Personalized Travel Itinerary Planner API"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"

    # AI Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "").strip()
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash").strip()

    # Supabase Configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "").strip()
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "").strip()

    # Storage & App modes
    DATA_DIR: Path = BASE_DIR / "data"
    LOCAL_STORAGE_FILE: Path = DATA_DIR / "local_trips.json"

    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

    @property
    def is_ai_active(self) -> bool:
        return bool(self.GEMINI_API_KEY)

    @property
    def is_supabase_active(self) -> bool:
        return bool(self.SUPABASE_URL and self.SUPABASE_KEY)

settings = Settings()
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
