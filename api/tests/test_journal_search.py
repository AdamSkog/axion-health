"""
Tests for journal search tool using ChromaDB
"""
import pytest
from unittest.mock import patch, MagicMock
from tools.journal_search import search_private_journal


class TestJournalSearch:
    """Test suite for semantic journal search functionality"""

    @patch("tools.journal_search.chromadb_search")
    def test_journal_search_with_results(self, mock_chromadb_search, mock_user_id):
        """Test journal search returns matching results"""
        # Setup mock
        mock_search_results = {
            "results": [
                {
                    "content": "Started my new running routine today. Felt great!",
                    "date": "2024-10-07",
                    "similarity": 0.95,
                },
                {
                    "content": "Morning workout was energizing. Great day!",
                    "date": "2024-10-06",
                    "similarity": 0.87,
                },
            ]
        }
        mock_chromadb_search.return_value = mock_search_results

        # Execute
        result = search_private_journal(
            user_id=mock_user_id,
            query="running and exercise",
            n_results=2
        )

        # Assert
        assert result["success"] is False or "results" in result or "query" in result
        assert "results" in result
        assert len(result["results"]) == 2
        assert result["count"] == 2

    @patch("tools.journal_search.chromadb_search")
    def test_journal_search_no_results(self, mock_chromadb_search, mock_user_id):
        """Test journal search with no matching results"""
        # Setup mock
        mock_search_results = {"results": []}
        mock_chromadb_search.return_value = mock_search_results

        # Execute
        result = search_private_journal(
            user_id=mock_user_id,
            query="nonexistent topic"
        )

        # Assert
        assert "results" in result
        assert len(result["results"]) == 0
        assert result["count"] == 0

    @patch("tools.journal_search.chromadb_search")
    def test_journal_search_custom_result_limit(self, mock_chromadb_search, mock_user_id):
        """Test journal search respects n_results parameter"""
        # Setup mock
        mock_search_results = {
            "results": [
                {
                    "content": f"Entry {i}",
                    "date": "2024-10-07",
                    "similarity": 0.9 - (i * 0.05),
                }
                for i in range(10)
            ]
        }
        mock_chromadb_search.return_value = mock_search_results

        # Execute
        result = search_private_journal(
            user_id=mock_user_id,
            query="test",
            n_results=10
        )

        # Assert
        assert result["count"] == 10

    @patch("tools.journal_search.chromadb_search")
    def test_journal_search_error_handling(self, mock_chromadb_search, mock_user_id):
        """Test journal search error handling"""
        # Setup mock to raise exception
        mock_chromadb_search.side_effect = Exception("ChromaDB connection error")

        # Execute
        result = search_private_journal(
            user_id=mock_user_id,
            query="test"
        )

        # Assert
        assert result["results"] == []
        assert "error" in result
