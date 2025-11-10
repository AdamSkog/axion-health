from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Supabase (matches frontend env var names)
    NEXT_PUBLIC_SUPABASE_URL: str
    NEXT_PUBLIC_SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None  # Admin key for tool operations (bypasses RLS)

    # AI Services
    GOOGLE_API_KEY: str
    PERPLEXITY_API_KEY: str

    # Sahha
    SAHHA_CLIENT_ID: str
    SAHHA_CLIENT_SECRET: str
    SAHHA_SAMPLE_PROFILE_ID: Optional[str] = None  # For development: use Sahha sample profile instead of user_id

    # Vector Storage
    PINECONE_API_KEY: str

    # Optional settings
    API_PORT: int = 8000
    API_HOST: str = "0.0.0.0"
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
