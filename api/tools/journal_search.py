"""
Journal Search Tool
Performs semantic search across user's journal entries using Pinecone RAG
"""
from services.pinecone_client import search_journal_entries as pinecone_search
import logging

logger = logging.getLogger(__name__)


def search_private_journal(
    user_id: str,
    query: str,
    n_results: int = 5
) -> dict:
    """
    Search user's private journal entries using semantic similarity.

    This tool uses Pinecone and Gemini embeddings to find relevant
    journal entries based on the meaning of the query, not just keywords.

    Args:
        user_id: User's ID to search journals for
        query: Search query (e.g., "feeling tired", "medication side effects")
        n_results: Number of results to return (default: 5)

    Returns:
        Dictionary with search results including:
        - results: list of matching journal entries with similarity scores
        - query: the original search query
        - count: number of results found
    """
    try:
        logger.info(f"Searching journal for user {user_id}: '{query}'")

        # Use Pinecone search service
        search_results = pinecone_search(
            user_id=user_id,
            query=query,
            n_results=n_results
        )

        # Format results for tool output
        formatted_results = {
            "query": query,
            "results": search_results.get("results", []),
            "count": len(search_results.get("results", [])),
            "tool": "semantic_journal_search"
        }

        logger.info(f"Found {formatted_results['count']} journal entries")
        return formatted_results

    except Exception as e:
        logger.error(f"Error in journal search: {e}")
        return {
            "query": query,
            "results": [],
            "count": 0,
            "error": str(e)
        }
