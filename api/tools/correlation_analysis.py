"""
Correlation Analysis Tool
Finds relationships between different health metrics
"""
import pandas as pd
import numpy as np
from services.supabase_client import get_supabase_client
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


def find_correlations(
    user_id: str,
    lookback_days: int = 30,
    min_correlation: float = 0.3
) -> dict:
    """
    Find correlations between different health metrics using Pearson correlation.

    This tool identifies relationships between metrics like sleep and heart rate,
    steps and calories, etc.

    Args:
        user_id: User's ID to fetch data for
        lookback_days: Number of days to analyze (default: 30)
        min_correlation: Minimum correlation coefficient to report (default: 0.3)

    Returns:
        Dictionary with correlation results including:
        - correlations: list of significant correlations
        - correlation_matrix: full correlation matrix
        - metrics_analyzed: list of metrics included
    """
    try:
        logger.info(f"Finding correlations for user {user_id}")

        # Get Supabase client
        supabase = get_supabase_client()

        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=lookback_days)

        # Fetch all health metrics for the user
        result = supabase.table("health_metrics").select(
            "timestamp, value, metric_type"
        ).eq("user_id", user_id).gte(
            "timestamp", start_date.isoformat()
        ).lte("timestamp", end_date.isoformat()).execute()

        if not result.data or len(result.data) < 10:
            return {
                "correlations": [],
                "error": "Insufficient data for correlation analysis. Need at least 10 data points.",
                "data_points": len(result.data) if result.data else 0
            }

        # Convert to DataFrame
        df = pd.DataFrame(result.data)

        # Pivot to get metrics as columns
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df['date'] = df['timestamp'].dt.date

        # Aggregate by date (take mean for multiple readings per day)
        pivot_df = df.pivot_table(
            index='date',
            columns='metric_type',
            values='value',
            aggfunc='mean'
        )

        if pivot_df.shape[1] < 2:
            return {
                "correlations": [],
                "error": "Need at least 2 different metric types for correlation analysis",
                "metrics_found": list(pivot_df.columns)
            }

        # Calculate correlation matrix
        corr_matrix = pivot_df.corr()

        # Extract significant correlations
        correlations = []
        metrics = list(corr_matrix.columns)

        for i, metric1 in enumerate(metrics):
            for j, metric2 in enumerate(metrics):
                if i < j:  # Only upper triangle (avoid duplicates)
                    corr_value = corr_matrix.loc[metric1, metric2]

                    # Skip NaN correlations
                    if pd.isna(corr_value):
                        continue

                    # Check if meets minimum threshold
                    if abs(corr_value) >= min_correlation:
                        correlations.append({
                            "metric1": metric1,
                            "metric2": metric2,
                            "correlation": float(corr_value),
                            "strength": _interpret_correlation(corr_value),
                            "direction": "positive" if corr_value > 0 else "negative"
                        })

        # Sort by absolute correlation value
        correlations.sort(key=lambda x: abs(x['correlation']), reverse=True)

        result_dict = {
            "correlations": correlations,
            "metrics_analyzed": metrics,
            "total_days": len(pivot_df),
            "date_range": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            }
        }

        logger.info(f"Found {len(correlations)} significant correlations")
        return result_dict

    except Exception as e:
        logger.error(f"Error in correlation analysis: {e}")
        return {
            "correlations": [],
            "error": str(e)
        }


def _interpret_correlation(corr_value: float) -> str:
    """Interpret correlation coefficient strength"""
    abs_corr = abs(corr_value)
    if abs_corr >= 0.7:
        return "strong"
    elif abs_corr >= 0.4:
        return "moderate"
    else:
        return "weak"
