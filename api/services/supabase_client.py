from supabase import create_client, Client
from config import settings
import logging

logger = logging.getLogger(__name__)


def get_supabase_client() -> Client:
    """
    Create a Supabase admin client for tool operations.
    
    Uses service role key if available (bypasses RLS for system operations).
    Falls back to anon key if service role key is not configured.
    
    Note: Tools need admin access to query health_metrics across RLS boundaries.
    The user_id parameter in tools provides the security boundary.
    """
    if settings.SUPABASE_SERVICE_ROLE_KEY:
        # Use service role key for admin operations (bypasses RLS)
        return create_client(
            settings.NEXT_PUBLIC_SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY
        )
    else:
        # Fallback to anon key (will be blocked by RLS)
        logger.warning("SUPABASE_SERVICE_ROLE_KEY not set - tool queries may fail due to RLS")
        return create_client(
            settings.NEXT_PUBLIC_SUPABASE_URL,
            settings.NEXT_PUBLIC_SUPABASE_ANON_KEY
        )


def get_user_scoped_client(access_token: str) -> Client:
    """
    Create a user-scoped Supabase client.
    Sets the Authorization header so RLS policies apply based on auth.uid().

    Args:
        access_token: JWT token from user's session

    Returns:
        Supabase client with user context
    """
    client = get_supabase_client()
    # Set user's JWT token - this makes RLS policies apply
    client.postgrest.auth(access_token)
    return client


# Global client for admin operations (use sparingly)
supabase_admin = get_supabase_client()
