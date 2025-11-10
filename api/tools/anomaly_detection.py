"""
Anomaly Detection Tool using IsolationForest
Detects unusual patterns in health metrics
"""
from sklearn.ensemble import IsolationForest
import numpy as np
from services.supabase_client import get_supabase_client
from datetime import datetime, timedelta
import logging
from tools.forecasting import normalize_metric_name

logger = logging.getLogger(__name__)


def detect_anomalies(
    user_id: str,
    metric_name: str,
    lookback_days: int = 30,
    contamination: float = 0.1
) -> dict:
    """
    Detect anomalies in a user's health metrics using IsolationForest algorithm.

    This tool uses unsupervised machine learning to identify unusual patterns
    in health data that may indicate health issues or changes.

    Args:
        user_id: User's ID to fetch data for
        metric_name: Name of the health metric (e.g., 'heart_rate', 'steps', 'sleep_duration')
        lookback_days: Number of days to analyze (default: 30)
        contamination: Expected proportion of outliers 0.0-0.5 (default: 0.1)

    Returns:
        Dictionary with anomaly detection results including:
        - anomalies_found: bool
        - anomaly_count: int
        - anomaly_dates: list of dates with anomalies
        - anomaly_values: list of anomalous values
        - mean_value: float
        - std_value: float
    """
    try:
        logger.info(f"Detecting anomalies for user {user_id}, metric {metric_name}")

        # Normalize metric name to match database schema
        normalized_metric = normalize_metric_name(metric_name)
        
        # Get Supabase client (admin for tool execution)
        supabase = get_supabase_client()

        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=lookback_days)

        # Fetch health metrics using normalized metric name
        result = supabase.table("health_metrics").select(
            "timestamp, value, metric_type"
        ).eq("user_id", user_id).eq("metric_type", normalized_metric).gte(
            "timestamp", start_date.isoformat()
        ).lte("timestamp", end_date.isoformat()).order("timestamp").execute()

        if not result.data or len(result.data) < 5:
            return {
                "anomalies_found": False,
                "error": f"Insufficient data for {metric_name}. Need at least 5 data points.",
                "data_points": len(result.data) if result.data else 0
            }

        # Extract values and timestamps
        data_points = result.data
        # Convert values to float (they're stored as TEXT in database)
        values = []
        timestamps = []
        for point in data_points:
            try:
                values.append(float(point['value']))
                timestamps.append(point['timestamp'])
            except (ValueError, TypeError):
                # Skip non-numeric values (e.g., blood pressure "120/80")
                continue
        
        if len(values) < 5:
            return {
                "anomalies_found": False,
                "error": f"Insufficient numeric data for {metric_name}. Need at least 5 data points.",
                "data_points": len(values)
            }
        
        values = np.array(values).reshape(-1, 1)

        # Apply IsolationForest
        iso_forest = IsolationForest(
            contamination=contamination,
            random_state=42,
            n_estimators=100
        )
        predictions = iso_forest.fit_predict(values)

        # Find anomalies (predictions == -1)
        anomaly_indices = np.where(predictions == -1)[0]
        anomalies_found = len(anomaly_indices) > 0

        # Gather anomaly details
        anomaly_dates = [timestamps[i] for i in anomaly_indices]
        anomaly_values = [float(values[i][0]) for i in anomaly_indices]

        # Calculate statistics
        mean_value = float(np.mean(values))
        std_value = float(np.std(values))

        result_dict = {
            "anomalies_found": anomalies_found,
            "anomaly_count": len(anomaly_indices),
            "anomaly_dates": anomaly_dates,
            "anomaly_values": anomaly_values,
            "mean_value": mean_value,
            "std_value": std_value,
            "total_data_points": len(values),
            "metric_name": normalized_metric,
            "original_query": metric_name,
            "date_range": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            }
        }

        logger.info(f"Anomaly detection complete: {len(anomaly_indices)} anomalies found")
        return result_dict

    except Exception as e:
        logger.error(f"Error in anomaly detection: {e}")
        return {
            "anomalies_found": False,
            "error": str(e)
        }
