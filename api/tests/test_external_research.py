"""
Tests for external research tool using Perplexity API
"""
import pytest
from unittest.mock import patch, MagicMock
from tools.external_research import external_research


class TestExternalResearch:
    """Test suite for external research functionality"""

    @patch("tools.external_research.OpenAI")
    def test_external_research_valid_query(self, mock_openai_class):
        """Test external research with a valid health query"""
        # Setup mock
        mock_client = MagicMock()
        mock_openai_class.return_value = mock_client

        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Cetirizine can increase heart rate in some patients."
        mock_response.citations = ["https://example.com/study1", "https://example.com/study2"]

        mock_client.chat.completions.create.return_value = mock_response

        # Execute
        result = external_research(query="side effects of cetirizine on heart rate")

        # Assert
        assert "query" in result
        assert result["query"] == "side effects of cetirizine on heart rate"
        assert "answer" in result
        assert "citations" in result
        assert "sources" in result

    @patch("tools.external_research.OpenAI")
    def test_external_research_no_citations(self, mock_openai_class):
        """Test external research when API doesn't return citations"""
        # Setup mock
        mock_client = MagicMock()
        mock_openai_class.return_value = mock_client

        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Some health information"
        # Don't set citations attribute

        mock_client.chat.completions.create.return_value = mock_response

        # Execute
        result = external_research(query="health query")

        # Assert
        assert "answer" in result
        assert "citations" in result
        assert result["citations"] == []

    @patch("tools.external_research.OpenAI")
    def test_external_research_api_error(self, mock_openai_class):
        """Test external research with API error"""
        # Setup mock to raise exception
        mock_openai_class.side_effect = Exception("API Error: Rate limit exceeded")

        # Execute
        result = external_research(query="test query")

        # Assert
        assert "error" in result
        assert "answer" in result

    @patch("tools.external_research.OpenAI")
    def test_external_research_empty_query(self, mock_openai_class):
        """Test external research with empty query"""
        # Setup mock
        mock_client = MagicMock()
        mock_openai_class.return_value = mock_client

        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Please provide a specific health question."

        mock_client.chat.completions.create.return_value = mock_response

        # Execute
        result = external_research(query="")

        # Assert
        assert "query" in result
        assert "answer" in result
