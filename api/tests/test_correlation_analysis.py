"""
Tests for correlation analysis tool
"""
import pytest
import pandas as pd
from unittest.mock import patch, MagicMock
from tools.correlation_analysis import find_correlations, _interpret_correlation


class TestCorrelationAnalysis:
    """Test suite for correlation analysis functionality"""

    def test_interpret_correlation_strong(self):
        """Test correlation strength interpretation - strong"""
        assert _interpret_correlation(0.85) == "strong"
        assert _interpret_correlation(-0.85) == "strong"

    def test_interpret_correlation_moderate(self):
        """Test correlation strength interpretation - moderate"""
        assert _interpret_correlation(0.55) == "moderate"
        assert _interpret_correlation(0.4) == "moderate"

    def test_interpret_correlation_weak(self):
        """Test correlation strength interpretation - weak"""
        assert _interpret_correlation(0.35) == "weak"
        assert _interpret_correlation(0.1) == "weak"

    @patch("tools.correlation_analysis.get_supabase_client")
    def test_find_correlations_with_valid_data(self, mock_supabase, mock_multivariate_health_data, mock_user_id):
        """Test correlation analysis with valid multi-metric data"""
        # Setup mock
        mock_client = MagicMock()
        mock_supabase.return_value = mock_client
        mock_client.table.return_value.select.return_value.eq.return_value.gte.return_value.lte.return_value.execute.return_value.data = mock_multivariate_health_data

        # Execute
        result = find_correlations(
            user_id=mock_user_id,
            lookback_days=30,
            min_correlation=0.3
        )

        # Assert
        assert "correlations" in result
        assert "metrics_analyzed" in result
        assert isinstance(result["correlations"], list)
        assert isinstance(result["metrics_analyzed"], list)

    @patch("tools.correlation_analysis.get_supabase_client")
    def test_find_correlations_insufficient_data(self, mock_supabase, mock_insufficient_data, mock_user_id):
        """Test correlation analysis with insufficient data"""
        # Setup mock
        mock_client = MagicMock()
        mock_supabase.return_value = mock_client
        mock_client.table.return_value.select.return_value.eq.return_value.gte.return_value.lte.return_value.execute.return_value.data = mock_insufficient_data

        # Execute
        result = find_correlations(user_id=mock_user_id)

        # Assert
        assert result["correlations"] == []
        assert "error" in result

    @patch("tools.correlation_analysis.get_supabase_client")
    def test_find_correlations_single_metric(self, mock_supabase, mock_health_data, mock_user_id):
        """Test correlation analysis with single metric type (needs at least 2)"""
        # Setup mock
        mock_client = MagicMock()
        mock_supabase.return_value = mock_client
        mock_client.table.return_value.select.return_value.eq.return_value.gte.return_value.lte.return_value.execute.return_value.data = mock_health_data[:30]  # Only heart_rate

        # Execute
        result = find_correlations(user_id=mock_user_id)

        # Assert
        assert result["correlations"] == []
        assert "error" in result
        assert "2 different metric types" in result["error"]

    @patch("tools.correlation_analysis.get_supabase_client")
    def test_find_correlations_filters_by_threshold(self, mock_supabase, mock_multivariate_health_data, mock_user_id):
        """Test that correlation filtering respects minimum threshold"""
        # Setup mock
        mock_client = MagicMock()
        mock_supabase.return_value = mock_client
        mock_client.table.return_value.select.return_value.eq.return_value.gte.return_value.lte.return_value.execute.return_value.data = mock_multivariate_health_data

        # Execute with high threshold (should filter out weak correlations)
        result = find_correlations(
            user_id=mock_user_id,
            min_correlation=0.7
        )

        # Assert - correlations should be strong
        for corr in result.get("correlations", []):
            assert abs(corr["correlation"]) >= 0.7
