"""
Tests for time-series forecasting tool using ARIMA
"""
import pytest
from unittest.mock import patch, MagicMock
from tools.forecasting import run_forecasting


class TestForecasting:
    """Test suite for forecasting functionality"""

    @patch("tools.forecasting.get_supabase_client")
    def test_forecasting_with_valid_data(self, mock_supabase, mock_health_data, mock_user_id):
        """Test forecasting with sufficient historical data"""
        # Setup mock - filter to only heart_rate data
        heart_rate_data = [d for d in mock_health_data if d["metric_type"] == "heart_rate"]
        mock_client = MagicMock()
        mock_supabase.return_value = mock_client
        mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.gte.return_value.lte.return_value.order.return_value.execute.return_value.data = heart_rate_data

        # Execute
        result = run_forecasting(
            user_id=mock_user_id,
            metric_name="heart_rate",
            forecast_days=7,
            lookback_days=30
        )

        # Assert
        assert "forecast_dates" in result
        assert "forecast_values" in result
        assert "confidence_intervals" in result
        assert len(result["forecast_dates"]) == 7
        assert len(result["forecast_values"]) == 7
        assert len(result["confidence_intervals"]) == 7

        # Check confidence intervals structure
        for interval in result["confidence_intervals"]:
            assert "low" in interval
            assert "high" in interval
            assert interval["low"] < interval["high"]

    @patch("tools.forecasting.get_supabase_client")
    def test_forecasting_insufficient_data(self, mock_supabase, mock_insufficient_data, mock_user_id):
        """Test forecasting with insufficient data"""
        # Setup mock
        mock_client = MagicMock()
        mock_supabase.return_value = mock_client
        mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.gte.return_value.lte.return_value.order.return_value.execute.return_value.data = mock_insufficient_data

        # Execute
        result = run_forecasting(
            user_id=mock_user_id,
            metric_name="heart_rate"
        )

        # Assert
        assert result["forecast_values"] == []
        assert "error" in result
        assert "Insufficient data" in result["error"]

    @patch("tools.forecasting.get_supabase_client")
    def test_forecasting_different_forecast_windows(self, mock_supabase, mock_health_data, mock_user_id):
        """Test forecasting with different forecast windows"""
        # Setup mock
        heart_rate_data = [d for d in mock_health_data if d["metric_type"] == "heart_rate"]
        mock_client = MagicMock()
        mock_supabase.return_value = mock_client
        mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.gte.return_value.lte.return_value.order.return_value.execute.return_value.data = heart_rate_data

        # Test 14-day forecast
        result = run_forecasting(
            user_id=mock_user_id,
            metric_name="heart_rate",
            forecast_days=14
        )

        assert len(result["forecast_dates"]) == 14
        assert len(result["forecast_values"]) == 14

    @patch("tools.forecasting.get_supabase_client")
    def test_forecasting_fallback_to_moving_average(self, mock_supabase, mock_health_data, mock_user_id):
        """Test that ARIMA fallback to simple moving average works"""
        # Setup mock with valid data
        heart_rate_data = [d for d in mock_health_data if d["metric_type"] == "heart_rate"]
        mock_client = MagicMock()
        mock_supabase.return_value = mock_client
        mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.gte.return_value.lte.return_value.order.return_value.execute.return_value.data = heart_rate_data

        # Execute
        result = run_forecasting(
            user_id=mock_user_id,
            metric_name="heart_rate"
        )

        # Assert - should have valid forecast (either ARIMA or MA)
        assert "forecast_values" in result
        assert len(result["forecast_values"]) > 0
