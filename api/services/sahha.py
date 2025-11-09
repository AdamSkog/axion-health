import requests
from config import settings
from datetime import datetime, timedelta
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class SahhaClient:
    """
    Client for interacting with Sahha Sandbox API.
    Uses token-based authentication (not OAuth2).

    Authentication flow:
    1. Get account token using client_id + client_secret
    2. Create/manage user profiles with account token
    3. Get profile tokens for user-specific operations
    4. Fetch biomarker data with profile token
    """

    # Use sandbox API for development/testing
    # For production, change to: https://api.sahha.ai/api/v1
    BASE_URL = "https://sandbox-api.sahha.ai/api/v1"

    def __init__(self):
        self.client_id = settings.SAHHA_CLIENT_ID
        self.client_secret = settings.SAHHA_CLIENT_SECRET
        self.account_token: Optional[str] = None

    def get_account_token(self) -> str:
        """
        Get account-level access token.
        This token is used for admin operations like creating profiles.

        Returns:
            Account access token

        Raises:
            requests.HTTPError: If authentication fails
        """
        try:
            response = requests.post(
                f"{self.BASE_URL}/oauth/account/token",
                json={
                    "clientId": self.client_id,
                    "clientSecret": self.client_secret
                },
                timeout=10
            )
            response.raise_for_status()

            data = response.json()
            # Sahha API returns 'accountToken', not 'access_token'
            self.account_token = data.get("accountToken") or data.get("access_token")

            if not self.account_token:
                raise ValueError(f"No token in response: {data}")

            logger.info("Successfully obtained Sahha account token")
            return self.account_token

        except requests.RequestException as e:
            logger.error(f"Failed to get Sahha account token: {e}")
            raise

    def ensure_account_token(self):
        """Ensure we have a valid account token"""
        if not self.account_token:
            self.get_account_token()

    def create_profile(self, external_id: str) -> dict:
        """
        Create a user profile in Sahha.

        Args:
            external_id: External identifier (typically Supabase user_id)

        Returns:
            Profile creation response with profile details

        Raises:
            requests.HTTPError: If profile creation fails
        """
        self.ensure_account_token()

        try:
            response = requests.post(
                f"{self.BASE_URL}/oauth/profile/register",
                headers={"Authorization": f"Bearer {self.account_token}"},
                json={"externalId": external_id},
                timeout=10
            )
            response.raise_for_status()

            logger.info(f"Successfully created Sahha profile for user {external_id}")
            return response.json()

        except requests.HTTPError as e:
            if e.response.status_code == 409:
                # Profile already exists - this is fine
                logger.info(f"Sahha profile already exists for user {external_id}")
                return {"externalId": external_id, "status": "existing"}
            else:
                logger.error(f"Failed to create Sahha profile: {e}")
                raise

    def get_profile_token(self, external_id: str) -> str:
        """
        Get profile-specific access token for a user.

        Args:
            external_id: External identifier (Supabase user_id)

        Returns:
            Profile access token

        Raises:
            requests.HTTPError: If token retrieval fails
        """
        self.ensure_account_token()

        try:
            response = requests.post(
                f"{self.BASE_URL}/oauth/profile/token",
                headers={"Authorization": f"Bearer {self.account_token}"},
                json={"externalId": external_id},
                timeout=10
            )
            response.raise_for_status()

            data = response.json()
            logger.info(f"Successfully obtained profile token for user {external_id}")
            return data["profileToken"]

        except requests.RequestException as e:
            logger.error(f"Failed to get profile token: {e}")
            raise

    def get_biomarkers(
        self,
        external_id: str,
        start_date: str,
        end_date: str,
        categories: Optional[list[str]] = None,
        types: Optional[list[str]] = None
    ) -> list[dict]:
        """
        Fetch biomarker data for a user profile.

        Args:
            external_id: User's external ID (Supabase user_id)
            start_date: Start datetime in ISO format
            end_date: End datetime in ISO format
            categories: Optional list of biomarker categories to fetch
                       Valid categories: activity, body, characteristic, sleep, vitals
            types: Optional list of specific biomarker types to fetch

        Returns:
            List of biomarker data points

        Available categories:
        - Activity: steps, floors_climbed, active_hours, activity_low/medium/high, sedentary_time
        - Body: height, weight, bmi, body_fat_percentage, fat_mass, lean_mass
        - Characteristic: age, biological_sex, date_of_birth
        - Sleep: sleep_start/end, duration, debt, interruptions, time_in_bed, stages (light/REM/deep)
        - Vitals: heart_rate_resting/sleep, hrv, respiratory_rate, vo2_max, blood_glucose, blood_pressure

        Raises:
            requests.HTTPError: If fetch fails
        """
        self.ensure_account_token()

        try:
            # Build params with date range
            params = {
                "startDateTime": start_date,
                "endDateTime": end_date
            }

            # If no categories specified, fetch all major categories
            if not categories:
                categories = ["activity", "body", "characteristic", "sleep", "vitals"]

            # Add each category as a separate param (Sahha API expects this format)
            for category in categories:
                params[f"categories"] = category

            # Add each type as a separate param if specified
            if types:
                for biomarker_type in types:
                    params[f"types"] = biomarker_type

            # Single request using account-level auth with external ID in URL
            response = requests.get(
                f"{self.BASE_URL}/profile/biomarker/{external_id}",
                headers={"Authorization": f"Bearer {self.account_token}"},
                params=params,
                timeout=15
            )
            response.raise_for_status()

            data = response.json()
            logger.info(f"Successfully fetched {len(data)} biomarkers")
            return data

        except requests.RequestException as e:
            logger.error(f"Failed to fetch biomarkers: {e}")
            raise

    def get_health_scores(self, profile_token: str, start_date: str, end_date: str) -> dict:
        """
        Fetch health scores for a user (aggregated insights).

        Args:
            profile_token: User's profile token
            start_date: Start datetime in ISO format
            end_date: End datetime in ISO format

        Returns:
            Health scores data

        Raises:
            requests.HTTPError: If fetch fails
        """
        try:
            response = requests.get(
                f"{self.BASE_URL}/profile/score",
                headers={"Authorization": f"Bearer {profile_token}"},
                params={
                    "startDateTime": start_date,
                    "endDateTime": end_date
                },
                timeout=10
            )
            response.raise_for_status()

            logger.info("Successfully fetched health scores")
            return response.json()

        except requests.RequestException as e:
            logger.error(f"Failed to fetch health scores: {e}")
            raise


# Global instance
sahha_client = SahhaClient()
