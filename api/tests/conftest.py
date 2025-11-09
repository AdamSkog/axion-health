"""
Shared test fixtures and configuration
"""
import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta


@pytest.fixture
def mock_user_id():
    """Fixture for a mock user ID"""
    return "test-user-123"


@pytest.fixture
def mock_health_data():
    """Fixture for mock health metrics data"""
    dates = pd.date_range(start="2024-10-01", periods=30, freq="D")
    return [
        {
            "timestamp": date.isoformat(),
            "value": float(np.random.normal(70, 5)),  # Normal distribution
            "metric_type": "heart_rate",
            "unit": "bpm",
        }
        for date in dates
    ] + [
        {
            "timestamp": date.isoformat(),
            "value": float(np.random.normal(7, 1)),  # Sleep hours
            "metric_type": "sleep_duration",
            "unit": "hours",
        }
        for date in dates
    ]


@pytest.fixture
def mock_insufficient_data():
    """Fixture for insufficient data (less than minimum required)"""
    return [
        {
            "timestamp": (datetime.utcnow() - timedelta(days=i)).isoformat(),
            "value": float(70 + i),
            "metric_type": "heart_rate",
            "unit": "bpm",
        }
        for i in range(3)  # Only 3 data points
    ]


@pytest.fixture
def mock_journal_entries():
    """Fixture for mock journal entries"""
    return [
        {
            "id": "entry-1",
            "user_id": "test-user-123",
            "date": "2024-10-07",
            "content": "Started my new running routine today. Felt great! Also noticed I slept better after avoiding caffeine past 2pm.",
            "created_at": "2024-10-07T10:00:00Z",
            "updated_at": "2024-10-07T10:00:00Z",
        },
        {
            "id": "entry-2",
            "user_id": "test-user-123",
            "date": "2024-10-06",
            "content": "Feeling a bit stressed with work deadlines. Heart rate seems higher than usual. Need to focus on breathing exercises.",
            "created_at": "2024-10-06T15:30:00Z",
            "updated_at": "2024-10-06T15:30:00Z",
        },
        {
            "id": "entry-3",
            "user_id": "test-user-123",
            "date": "2024-10-05",
            "content": "Great day! 8 hours of sleep, morning workout, and healthy meals. This is the baseline I want to maintain.",
            "created_at": "2024-10-05T22:00:00Z",
            "updated_at": "2024-10-05T22:00:00Z",
        },
    ]


@pytest.fixture
def mock_multivariate_health_data():
    """Fixture for multi-metric health data (for correlation analysis)"""
    dates = pd.date_range(start="2024-09-01", periods=30, freq="D")
    data = []

    for date in dates:
        # Create correlated data: more sleep → lower heart rate
        sleep = np.random.normal(7, 1)
        heart_rate = 75 - (sleep * 3) + np.random.normal(0, 2)

        data.extend([
            {
                "timestamp": date.isoformat(),
                "value": float(sleep),
                "metric_type": "sleep_duration",
                "unit": "hours",
            },
            {
                "timestamp": date.isoformat(),
                "value": float(max(50, heart_rate)),  # Ensure positive
                "metric_type": "heart_rate",
                "unit": "bpm",
            },
        ])

    return data
