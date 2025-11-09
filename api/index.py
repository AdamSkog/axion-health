from fastapi import FastAPI, Header, HTTPException, Depends, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from services.supabase_client import get_user_scoped_client
from services.sahha import sahha_client
from services.pinecone_client import add_journal_entry, search_journal_entries, delete_journal_entry
from agents.gemini_orchestrator import generate_insights, process_query
from models import HealthDataRequest, JournalEntryCreate, AgentQuery
from typing import Annotated
from datetime import datetime, timedelta
import logging
import random

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Axion Health API",
    description="AI-powered health data aggregator with agentic RAG system",
    version="1.0.0"
)

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Dependency to extract and validate JWT token
async def get_current_user_token(authorization: str = Header(None)) -> str:
    """
    Extract JWT token from Authorization header.

    Args:
        authorization: Authorization header value (Bearer <token>)

    Returns:
        JWT token string

    Raises:
        HTTPException: If authorization header is missing or invalid
    """
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="No authorization header provided"
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization format. Expected 'Bearer <token>'"
        )

    token = authorization.replace("Bearer ", "")

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Token is empty"
        )

    return token


# Type alias for dependency injection
TokenDep = Annotated[str, Depends(get_current_user_token)]


def generate_mock_biomarkers(days: int) -> list[dict]:
    """
    Generate realistic mock biomarker data for development/testing.

    Args:
        days: Number of days to generate data for

    Returns:
        List of mock biomarker data points covering all supported biomarker types
    """
    biomarkers = []
    end_date = datetime.utcnow()

    # Generate daily data points for all biomarker types
    for i in range(days):
        date = end_date - timedelta(days=i)
        timestamp = date.isoformat()

        # Activity metrics
        biomarkers.extend([
            {"type": "steps", "value": random.randint(3000, 12000), "unit": "steps",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
            {"type": "floors_climbed", "value": random.randint(5, 25), "unit": "floors",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
            {"type": "active_hours", "value": round(random.uniform(2, 6), 1), "unit": "hours",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
            {"type": "active_duration", "value": random.randint(30, 240), "unit": "minutes",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
            {"type": "activity_low_intensity_duration", "value": random.randint(60, 180), "unit": "minutes",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
            {"type": "activity_medium_intensity_duration", "value": random.randint(20, 90), "unit": "minutes",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
            {"type": "activity_high_intensity_duration", "value": random.randint(0, 60), "unit": "minutes",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
            {"type": "activity_sedentary_duration", "value": random.randint(300, 600), "unit": "minutes",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
            {"type": "active_energy_burned", "value": random.randint(300, 800), "unit": "kcal",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
            {"type": "total_energy_burned", "value": random.randint(2000, 3000), "unit": "kcal",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
        ])

        # Body metrics
        biomarkers.extend([
            {"type": "height", "value": 175, "unit": "cm",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
            {"type": "weight", "value": round(random.uniform(70, 85), 1), "unit": "kg",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
            {"type": "body_mass_index", "value": round(random.uniform(22, 27), 1), "unit": "kg/m²",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
            {"type": "body_fat", "value": round(random.uniform(15, 25), 1), "unit": "%",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
            {"type": "fat_mass", "value": round(random.uniform(12, 20), 1), "unit": "kg",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
            {"type": "lean_mass", "value": round(random.uniform(55, 70), 1), "unit": "kg",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
            {"type": "waist_circumference", "value": round(random.uniform(75, 90), 1), "unit": "cm",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
            {"type": "resting_energy_burned", "value": random.randint(1500, 1800), "unit": "kcal",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
        ])

        # Sleep metrics
        biomarkers.extend([
            {"type": "sleep_duration", "value": round(random.uniform(6.5, 9.0), 1), "unit": "hours",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
            {"type": "sleep_debt", "value": round(random.uniform(0, 4), 1), "unit": "hours",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
            {"type": "sleep_interruptions", "value": random.randint(0, 5), "unit": "count",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
            {"type": "sleep_in_bed_duration", "value": round(random.uniform(7, 10), 1), "unit": "hours",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
            {"type": "sleep_awake_duration", "value": round(random.uniform(0.5, 2), 1), "unit": "hours",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
            {"type": "sleep_light_duration", "value": round(random.uniform(2, 4), 1), "unit": "hours",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
            {"type": "sleep_rem_duration", "value": round(random.uniform(1, 2.5), 1), "unit": "hours",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
            {"type": "sleep_deep_duration", "value": round(random.uniform(1, 2), 1), "unit": "hours",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
            {"type": "sleep_efficiency", "value": round(random.uniform(80, 95), 1), "unit": "%",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
        ])

        # Vital metrics
        biomarkers.extend([
            {"type": "heart_rate", "value": random.randint(60, 85), "unit": "bpm",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
            {"type": "heart_rate_resting", "value": random.randint(55, 70), "unit": "bpm",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
            {"type": "heart_rate_sleep", "value": random.randint(50, 65), "unit": "bpm",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
            {"type": "heart_rate_variability_sdnn", "value": random.randint(20, 60), "unit": "ms",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
            {"type": "heart_rate_variability_rmssd", "value": random.randint(15, 80), "unit": "ms",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
            {"type": "respiratory_rate", "value": random.randint(12, 20), "unit": "breaths/min",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
            {"type": "respiratory_rate_sleep", "value": random.randint(10, 16), "unit": "breaths/min",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
            {"type": "oxygen_saturation", "value": round(random.uniform(95, 99), 1), "unit": "%",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
            {"type": "oxygen_saturation_sleep", "value": round(random.uniform(94, 98), 1), "unit": "%",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
            {"type": "vo2_max", "value": round(random.uniform(35, 55), 1), "unit": "mL/kg/min",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
            {"type": "blood_glucose", "value": random.randint(80, 120), "unit": "mg/dL",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
            {"type": "blood_pressure_systolic", "value": random.randint(110, 135), "unit": "mmHg",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
            {"type": "blood_pressure_diastolic", "value": random.randint(70, 85), "unit": "mmHg",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
            {"type": "body_temperature_basal", "value": round(random.uniform(36.5, 37.5), 1), "unit": "celsius",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
            {"type": "skin_temperature_sleep", "value": round(random.uniform(33, 34), 1), "unit": "celsius",
             "startDateTime": timestamp, "endDateTime": timestamp, "source": "mock"},
        ])

    logger.info(f"Generated {len(biomarkers)} mock biomarker data points for {days} days")
    return biomarkers


# Health check endpoint
@app.get("/api/health")
async def health_check():
    """Health check endpoint to verify API is running"""
    return {
        "status": "healthy",
        "service": "axion-health-api",
        "version": "1.0.0"
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "Axion Health API",
        "description": "AI-powered health data aggregator",
        "docs": "/docs",
        "health": "/api/health"
    }


# Health Data Endpoints
@app.get("/api/health-data")
async def get_health_data(
    token: TokenDep,
    days: int = Query(default=7, ge=1, le=90, description="Number of days to fetch")
):
    """
    Fetch user's health data from Sahha Sandbox API.

    This endpoint:
    1. Extracts user_id from JWT token
    2. Gets or creates Sahha profile for the user
    3. Fetches biomarker data for the specified date range
    4. Returns formatted health metrics

    Args:
        token: JWT token from Authorization header (injected)
        days: Number of days of data to fetch (1-90)

    Returns:
        Health data with biomarkers
    """
    try:
        # Get user-scoped Supabase client
        user_client = get_user_scoped_client(token)

        # Get user info from token
        user_response = user_client.auth.get_user(token)
        user_id = user_response.user.id

        logger.info(f"Fetching health data for user {user_id}")

        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)

        biomarkers = None
        data_source = "sahha"

        # Try to fetch from Sahha
        try:
            # Ensure user has a Sahha profile
            try:
                sahha_client.create_profile(str(user_id))
            except Exception as e:
                logger.warning(f"Error creating Sahha profile (may already exist): {e}")

            # Define all biomarker types we want to fetch (matching user's working example)
            biomarker_types = [
                # Activity metrics
                "steps", "floors_climbed", "active_hours", "active_duration",
                "activity_low_intensity_duration", "activity_medium_intensity_duration",
                "activity_high_intensity_duration", "activity_sedentary_duration",
                "active_energy_burned", "total_energy_burned",
                # Body metrics
                "height", "weight", "body_mass_index", "body_fat", "fat_mass", "lean_mass",
                "waist_circumference", "resting_energy_burned",
                # Characteristic metrics
                "age", "biological_sex", "date_of_birth",
                # Sleep metrics
                "sleep_start_time", "sleep_end_time", "sleep_duration", "sleep_debt",
                "sleep_interruptions", "sleep_in_bed_duration", "sleep_awake_duration",
                "sleep_light_duration", "sleep_rem_duration", "sleep_deep_duration",
                "sleep_regularity", "sleep_latency", "sleep_efficiency",
                # Vital metrics
                "heart_rate_resting", "heart_rate_sleep",
                "heart_rate_variability_sdnn", "heart_rate_variability_rmssd",
                "respiratory_rate", "respiratory_rate_sleep",
                "oxygen_saturation", "oxygen_saturation_sleep", "vo2_max",
                "blood_glucose", "blood_pressure_systolic", "blood_pressure_diastolic",
                "body_temperature_basal", "skin_temperature_sleep"
            ]

            # Fetch biomarkers from Sahha with all categories and types
            biomarkers = sahha_client.get_biomarkers(
                external_id=str(user_id),
                start_date=start_date.isoformat(),
                end_date=end_date.isoformat(),
                categories=["activity", "body", "characteristic", "sleep", "vitals"],
                types=biomarker_types
            )

            logger.info(f"Successfully fetched {len(biomarkers)} biomarkers from Sahha API")

            # If Sahha returns empty but no error, it's valid (profile has no data yet)
            # Fall back to mock data to give users something to see
            if not biomarkers:
                logger.info("Sahha returned no biomarker data. Using mock data for demo.")
                biomarkers = generate_mock_biomarkers(days)
                data_source = "mock"

        except Exception as sahha_error:
            logger.warning(f"Failed to fetch from Sahha API: {type(sahha_error).__name__}: {sahha_error}. Using mock data as fallback.")
            # Fall back to mock data for development/testing
            biomarkers = generate_mock_biomarkers(days)
            data_source = "mock"

        # Optional: Store in Supabase for caching (uncomment if needed)
        # for biomarker in biomarkers:
        #     user_client.table("health_metrics").insert({
        #         "user_id": str(user_id),
        #         "timestamp": biomarker.get("startDateTime"),
        #         "metric_type": biomarker.get("type"),
        #         "value": biomarker.get("value"),
        #         "unit": biomarker.get("unit"),
        #         "source": data_source
        #     }).execute()

        return {
            "success": True,
            "data": biomarkers,
            "count": len(biomarkers),
            "source": data_source,
            "date_range": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching health data: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch health data: {str(e)}"
        )


@app.get("/api/health-scores")
async def get_health_scores_endpoint(
    token: TokenDep,
    days: int = Query(default=7, ge=1, le=90, description="Number of days to fetch")
):
    """
    Fetch user's health scores from Sahha (Wellbeing, Activity, Sleep, Readiness).

    This endpoint provides aggregated health scores with factors and goals.

    Args:
        token: JWT token from Authorization header (injected)
        days: Number of days of data to fetch (1-90)

    Returns:
        Health scores with factor breakdowns
    """
    try:
        # Get user-scoped Supabase client
        user_client = get_user_scoped_client(token)

        # Get user info from token
        user_response = user_client.auth.get_user(token)
        user_id = user_response.user.id

        logger.info(f"Fetching health scores for user {user_id}")

        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)

        scores = None

        # Try to fetch from Sahha
        try:
            # Ensure user has a Sahha profile
            try:
                sahha_client.create_profile(str(user_id))
            except Exception as e:
                logger.warning(f"Error creating Sahha profile (may already exist): {e}")

            # Get profile token
            profile_token = sahha_client.get_profile_token(str(user_id))

            # Fetch health scores from Sahha
            scores = sahha_client.get_health_scores(
                profile_token=profile_token,
                start_date=start_date.isoformat(),
                end_date=end_date.isoformat()
            )

            logger.info(f"Successfully fetched health scores from Sahha API")

            # If Sahha returns empty, return empty array (scores are optional)
            if not scores:
                logger.info("Sahha returned no score data.")
                scores = []

        except Exception as sahha_error:
            logger.warning(f"Failed to fetch scores from Sahha API: {type(sahha_error).__name__}: {sahha_error}. Returning empty scores.")
            scores = []

        return {
            "success": True,
            "scores": scores,
            "count": len(scores) if isinstance(scores, list) else 0,
            "date_range": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching health scores: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch health scores: {str(e)}"
        )


@app.post("/api/health-data/sync")
async def sync_health_data(token: TokenDep):
    """
    Manually trigger sync of health data from Sahha to Supabase.
    This stores data locally for faster access and offline analysis.

    Args:
        token: JWT token from Authorization header (injected)

    Returns:
        Sync status and count of synced metrics
    """
    try:
        user_client = get_user_scoped_client(token)
        user_response = user_client.auth.get_user(token)
        user_id = user_response.user.id

        logger.info(f"Syncing health data for user {user_id}")

        # Get profile token
        profile_token = sahha_client.get_profile_token(str(user_id))

        # Fetch last 30 days of data
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=30)

        biomarkers = sahha_client.get_biomarkers(
            profile_token=profile_token,
            start_date=start_date.isoformat(),
            end_date=end_date.isoformat(),
            categories=["activity", "vitals"]
        )

        # Store in Supabase
        synced_count = 0
        for biomarker in biomarkers:
            try:
                user_client.table("health_metrics").insert({
                    "user_id": str(user_id),
                    "timestamp": biomarker.get("startDateTime"),
                    "metric_type": biomarker.get("type"),
                    "value": float(biomarker.get("value", 0)),
                    "unit": biomarker.get("unit"),
                    "source": "sahha"
                }).execute()
                synced_count += 1
            except Exception as e:
                logger.warning(f"Error inserting biomarker: {e}")
                continue

        return {
            "success": True,
            "synced_count": synced_count,
            "total_fetched": len(biomarkers),
            "date_range": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error syncing health data: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to sync health data: {str(e)}"
        )


# Journal Endpoints
@app.post("/api/journal")
async def create_journal_entry(
    token: TokenDep,
    entry: JournalEntryCreate = Body(...)
):
    """
    Create a new journal entry with automatic RAG ingestion.

    This endpoint:
    1. Saves entry to Supabase (RLS enforced)
    2. Generates embedding using Gemini
    3. Stores in Pinecone for semantic search

    Args:
        token: JWT token from Authorization header (injected)
        entry: Journal entry data (date and content)

    Returns:
        Created journal entry
    """
    try:
        user_client = get_user_scoped_client(token)
        user_response = user_client.auth.get_user(token)
        user_id = str(user_response.user.id)

        logger.info(f"Creating journal entry for user {user_id}")

        # Save to Supabase (RLS automatically enforces user_id)
        result = user_client.table("journal_entries").insert({
            "user_id": user_id,
            "date": entry.date.isoformat(),
            "content": entry.content
        }).execute()

        if not result.data or len(result.data) == 0:
            raise HTTPException(
                status_code=500,
                detail="Failed to create journal entry in database"
            )

        created_entry = result.data[0]
        entry_id = created_entry["id"]

        # Add to Pinecone for RAG
        try:
            add_journal_entry(
                entry_id=entry_id,
                user_id=user_id,
                content=entry.content,
                date=entry.date.isoformat()
            )
        except Exception as e:
            logger.error(f"Failed to add entry to Pinecone: {e}")
            # Don't fail the request - entry is in Supabase
            # TODO: Add to retry queue

        return {
            "success": True,
            "entry": created_entry
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating journal entry: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create journal entry: {str(e)}"
        )


@app.get("/api/journal")
async def get_journal_entries(token: TokenDep):
    """
    Get all journal entries for the authenticated user.
    RLS ensures users can only see their own entries.

    Args:
        token: JWT token from Authorization header (injected)

    Returns:
        List of journal entries
    """
    try:
        user_client = get_user_scoped_client(token)
        user_response = user_client.auth.get_user(token)
        user_id = str(user_response.user.id)

        logger.info(f"Fetching journal entries for user {user_id}")

        # RLS automatically filters by user_id
        result = user_client.table("journal_entries").select("*").order(
            "date", desc=True
        ).execute()

        return {
            "success": True,
            "entries": result.data,
            "count": len(result.data)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching journal entries: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch journal entries: {str(e)}"
        )


@app.get("/api/journal/{entry_id}")
async def get_journal_entry(token: TokenDep, entry_id: str):
    """
    Get a specific journal entry.
    RLS ensures users can only access their own entries.

    Args:
        token: JWT token from Authorization header (injected)
        entry_id: ID of the journal entry

    Returns:
        Journal entry
    """
    try:
        user_client = get_user_scoped_client(token)

        result = user_client.table("journal_entries").select("*").eq(
            "id", entry_id
        ).execute()

        if not result.data or len(result.data) == 0:
            raise HTTPException(
                status_code=404,
                detail="Journal entry not found"
            )

        return {
            "success": True,
            "entry": result.data[0]
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching journal entry: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch journal entry: {str(e)}"
        )


@app.delete("/api/journal/{entry_id}")
async def delete_journal_entry_endpoint(token: TokenDep, entry_id: str):
    """
    Delete a journal entry from both Supabase and Pinecone.
    RLS ensures users can only delete their own entries.

    Args:
        token: JWT token from Authorization header (injected)
        entry_id: ID of the journal entry to delete

    Returns:
        Success message
    """
    try:
        user_client = get_user_scoped_client(token)
        user_response = user_client.auth.get_user(token)
        user_id = str(user_response.user.id)

        # Delete from Supabase (RLS prevents deleting other users' entries)
        result = user_client.table("journal_entries").delete().eq(
            "id", entry_id
        ).execute()

        if not result.data or len(result.data) == 0:
            raise HTTPException(
                status_code=404,
                detail="Journal entry not found or already deleted"
            )

        # Delete from Pinecone
        try:
            delete_journal_entry(entry_id, user_id)
        except Exception as e:
            logger.warning(f"Failed to delete from Pinecone: {e}")
            # Don't fail - entry is deleted from Supabase

        return {
            "success": True,
            "message": "Journal entry deleted successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting journal entry: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete journal entry: {str(e)}"
        )


@app.post("/api/journal/search")
async def search_journal(
    token: TokenDep,
    query: str = Body(..., embed=True),
    n_results: int = Body(default=5, embed=True)
):
    """
    Semantic search across user's journal entries using Pinecone RAG.

    Args:
        token: JWT token from Authorization header (injected)
        query: Search query
        n_results: Number of results to return

    Returns:
        Search results with similarity scores
    """
    try:
        user_client = get_user_scoped_client(token)
        user_response = user_client.auth.get_user(token)
        user_id = str(user_response.user.id)

        logger.info(f"Searching journal for user {user_id}: {query}")

        # Search in Pinecone
        results = search_journal_entries(
            user_id=user_id,
            query=query,
            n_results=n_results
        )

        return {
            "success": True,
            **results
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching journal: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to search journal: {str(e)}"
        )


# AI Agent Endpoints
@app.post("/api/agent/insights")
async def get_ai_insights(token: TokenDep):
    """
    Generate proactive AI insights for the dashboard feed.

    This endpoint uses the Gemini orchestrator to automatically analyze
    the user's health data and surface interesting patterns, anomalies,
    and correlations without requiring a specific query.

    The agent automatically calls tools like:
    - detect_anomalies() for unusual patterns
    - find_correlations() for metric relationships
    - And synthesizes findings into actionable insights

    Args:
        token: JWT token from Authorization header (injected)

    Returns:
        List of AI-generated insights
    """
    try:
        user_client = get_user_scoped_client(token)
        user_response = user_client.auth.get_user(token)
        user_id = str(user_response.user.id)

        logger.info(f"Generating AI insights for user {user_id}")

        # Call Gemini orchestrator
        insights = generate_insights(user_id=user_id)

        return {
            "success": True,
            "insights": insights,
            "count": len(insights)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating insights: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate insights: {str(e)}"
        )


@app.post("/api/agent/query")
async def query_ai_agent(token: TokenDep, query_data: AgentQuery = Body(...)):
    """
    Process an interactive user query using the AI agent (Deep Dive feature).

    This is the main agentic RAG endpoint. The Gemini orchestrator:
    1. Analyzes the user's natural language query
    2. Decides which tools to call (can be multiple)
    3. Executes tools like:
       - detect_anomalies() for pattern detection
       - find_correlations() for relationships
       - run_forecasting() for predictions
       - search_private_journal() for personal context
       - external_research() for medical/health information
    4. Synthesizes a comprehensive answer with citations

    Example queries:
    - "My heart rate is high. Is there a connection with my sleep?"
    - "Predict my step count for next week"
    - "Find journal entries about feeling tired"
    - "What are the side effects of antihistamines on heart rate?"

    Args:
        token: JWT token from Authorization header (injected)
        query_data: User's natural language query

    Returns:
        Comprehensive response with answer, tool results, and sources
    """
    try:
        user_client = get_user_scoped_client(token)
        user_response = user_client.auth.get_user(token)
        user_id = str(user_response.user.id)

        logger.info(f"Processing query for user {user_id}: '{query_data.query}'")

        # Call Gemini orchestrator with function calling
        result = process_query(user_id=user_id, query=query_data.query)

        return {
            "success": True,
            **result
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing query: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process query: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "index:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=True
    )
