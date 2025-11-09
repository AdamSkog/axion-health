"""
Tests for anomaly detection tool using IsolationForest
"""
import pytest
import pandas as pd
import numpy as np
from unittest.mock import patch, MagicMock
from tools.anomaly_detection import detect_anomalies


class TestAnomalyDetection:
    """Test suite for anomaly detection functionality"""

    @patch("tools.anomaly_detection.get_supabase_client")
    def test_anomaly_detection_with_valid_data(self, mock_supabase, mock_health_data, mock_user_id):
        """Test anomaly detection with valid health data"""
        # Setup mock
        mock_client = MagicMock()
        mock_supabase.return_value = mock_client
        mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.gte.return_value.lte.return_value.order.return_value.execute.return_value.data = mock_health_data

        # Execute
        result = detect_anomalies(
            user_id=mock_user_id,
            metric_name="heart_rate",
            lookback_days=30,
            contamination=0.1
        )

        # Assert
        assert "anomalies_found" in result
        assert "anomaly_count" in result
        assert "anomaly_dates" in result
        assert "anomaly_values" in result
        assert "mean_value" in result
        assert "std_value" in result
        assert isinstance(result["anomalies_found"], bool)
        assert isinstance(result["anomaly_count"], int)
        assert isinstance(result["anomaly_dates"], list)

    @patch("tools.anomaly_detection.get_supabase_client")
    def test_anomaly_detection_insufficient_data(self, mock_supabase, mock_insufficient_data, mock_user_id):
        """Test anomaly detection with insufficient data points"""
        # Setup mock
        mock_client = MagicMock()
        mock_supabase.return_value = mock_client
        mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.gte.return_value.lte.return_value.order.return_value.execute.return_value.data = mock_insufficient_data

        # Execute
        result = detect_anomalies(
            user_id=mock_user_id,
            metric_name="heart_rate",
            lookback_days=30
        )

        # Assert
        assert result["anomalies_found"] is False
        assert "error" in result
        assert "Insufficient data" in result["error"]

    @patch("tools.anomaly_detection.get_supabase_client")
    def test_anomaly_detection_no_data(self, mock_supabase, mock_user_id):
        """Test anomaly detection with no data"""
        # Setup mock
        mock_client = MagicMock()
        mock_supabase.return_value = mock_client
        mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.gte.return_value.lte.return_value.order.return_value.execute.return_value.data = None

        # Execute
        result = detect_anomalies(
            user_id=mock_user_id,
            metric_name="heart_rate"
        )

        # Assert
        assert result["anomalies_found"] is False
        assert "error" in result

    @patch("tools.anomaly_detection.get_supabase_client")
    def test_anomaly_detection_with_outliers(self, mock_supabase, mock_user_id):
        """Test anomaly detection correctly identifies outliers"""
        # Create data with obvious outliers
        normal_values = [70] * 25  # Normal heart rate
        outlier_values = [150, 160, 155]  # High heart rate (anomalies)
        normal_values.extend(outlier_values)

        health_data = [
            {
                "timestamp": f"2024-10-{i+1:02d}T00:00:00Z",
                "value": float(val),
                "metric_type": "heart_rate",
                "unit": "bpm",
            }
            for i, val in enumerate(normal_values)
        ]

        # Setup mock
        mock_client = MagicMock()
        mock_supabase.return_value = mock_client
        mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.gte.return_value.lte.return_value.order.return_value.execute.return_value.data = health_data

        # Execute
        result = detect_anomalies(
            user_id=mock_user_id,
            metric_name="heart_rate",
            contamination=0.15
        )

        # Assert
        assert result["anomalies_found"] is True
        assert result["anomaly_count"] > 0
        assert len(result["anomaly_values"]) > 0
