"""
Time-Series Forecasting Tool using ARIMA
Predicts future values of health metrics
"""
from statsmodels.tsa.arima.model import ARIMA
import pandas as pd
import numpy as np
from services.supabase_client import get_supabase_client
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


def run_forecasting(
    user_id: str,
    metric_name: str,
    forecast_days: int = 7,
    lookback_days: int = 30
) -> dict:
    """
    Forecast future values of a health metric using ARIMA time-series model.

    This tool predicts future trends based on historical patterns.

    Args:
        user_id: User's ID to fetch data for
        metric_name: Name of the health metric to forecast
        forecast_days: Number of days to forecast (default: 7)
        lookback_days: Number of historical days to use (default: 30)

    Returns:
        Dictionary with forecast results including:
        - forecast_dates: list of future dates
        - forecast_values: list of predicted values
        - confidence_intervals: list of (low, high) tuples
        - model_accuracy: metrics about the model
    """
    try:
        logger.info(f"Forecasting {metric_name} for user {user_id}")

        # Get Supabase client
        supabase = get_supabase_client()

        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=lookback_days)

        # Fetch historical data
        result = supabase.table("health_metrics").select(
            "timestamp, value, metric_type"
        ).eq("user_id", user_id).eq("metric_type", metric_name).gte(
            "timestamp", start_date.isoformat()
        ).lte("timestamp", end_date.isoformat()).order("timestamp").execute()

        if not result.data or len(result.data) < 14:
            return {
                "forecast_values": [],
                "error": f"Insufficient data for forecasting. Need at least 14 data points, got {len(result.data) if result.data else 0}",
                "data_points": len(result.data) if result.data else 0
            }

        # Convert to pandas Series
        df = pd.DataFrame(result.data)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df['date'] = df['timestamp'].dt.date

        # Aggregate by date (mean for multiple readings)
        daily_values = df.groupby('date')['value'].mean()

        # Ensure we have enough data points
        if len(daily_values) < 14:
            return {
                "forecast_values": [],
                "error": f"Insufficient daily data points for ARIMA. Need at least 14 days.",
                "data_points": len(daily_values)
            }

        # Fit ARIMA model
        # Using simple ARIMA(1,1,1) - order can be optimized with auto_arima
        try:
            model = ARIMA(daily_values, order=(1, 1, 1))
            fitted_model = model.fit()

            # Generate forecast
            forecast_result = fitted_model.forecast(steps=forecast_days)

            # Get confidence intervals (if available)
            forecast_df = fitted_model.get_forecast(steps=forecast_days)
            conf_int = forecast_df.conf_int(alpha=0.05)  # 95% confidence

            # Generate future dates
            last_date = daily_values.index[-1]
            forecast_dates = [
                (last_date + timedelta(days=i+1)).isoformat()
                for i in range(forecast_days)
            ]

            # Format results
            forecast_values = [float(val) for val in forecast_result]
            confidence_intervals = [
                {
                    "low": float(conf_int.iloc[i, 0]),
                    "high": float(conf_int.iloc[i, 1])
                }
                for i in range(len(conf_int))
            ]

            # Calculate model accuracy metrics
            aic = float(fitted_model.aic)
            bic = float(fitted_model.bic)

            result_dict = {
                "forecast_dates": forecast_dates,
                "forecast_values": forecast_values,
                "confidence_intervals": confidence_intervals,
                "metric_name": metric_name,
                "model_info": {
                    "type": "ARIMA",
                    "order": [1, 1, 1],
                    "aic": aic,
                    "bic": bic
                },
                "historical_data": {
                    "dates": [d.isoformat() for d in daily_values.index[-7:]],
                    "values": [float(v) for v in daily_values.values[-7:]]
                }
            }

            logger.info(f"Forecast complete: {forecast_days} days predicted")
            return result_dict

        except Exception as model_error:
            logger.error(f"ARIMA model error: {model_error}")
            # Fallback to simple moving average if ARIMA fails
            return _simple_forecast_fallback(daily_values, forecast_days, metric_name)

    except Exception as e:
        logger.error(f"Error in forecasting: {e}")
        return {
            "forecast_values": [],
            "error": str(e)
        }


def _simple_forecast_fallback(
    daily_values: pd.Series,
    forecast_days: int,
    metric_name: str
) -> dict:
    """Simple moving average forecast as fallback"""
    # Use last 7 days average
    recent_avg = daily_values[-7:].mean()
    recent_std = daily_values[-7:].std()

    last_date = daily_values.index[-1]
    forecast_dates = [
        (last_date + timedelta(days=i+1)).isoformat()
        for i in range(forecast_days)
    ]

    # Simple forecast: repeat recent average with slight trend
    forecast_values = [float(recent_avg) for _ in range(forecast_days)]

    confidence_intervals = [
        {
            "low": float(recent_avg - 1.96 * recent_std),
            "high": float(recent_avg + 1.96 * recent_std)
        }
        for _ in range(forecast_days)
    ]

    return {
        "forecast_dates": forecast_dates,
        "forecast_values": forecast_values,
        "confidence_intervals": confidence_intervals,
        "metric_name": metric_name,
        "model_info": {
            "type": "Simple Moving Average (Fallback)",
            "window": 7
        },
        "note": "ARIMA model failed, using simple moving average"
    }
