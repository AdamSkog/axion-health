from supabase import create_client, Client
from config import settings


def get_supabase_client() -> Client:
    """
    Create a Supabase client using anon key.
    This client will use anonymous access by default.
    When an Authorization header is provided via postgrest.auth(),
    Supabase automatically switches to the user's role.
    """
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
