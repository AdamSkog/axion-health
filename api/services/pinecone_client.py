"""
Pinecone vector store client for Axion Health
Stores and searches journal entry embeddings with user isolation
"""
import logging
from pinecone import Pinecone
import google.generativeai as genai
from config import settings as app_settings

logger = logging.getLogger(__name__)

# Initialize Pinecone
pc = Pinecone(api_key=app_settings.PINECONE_API_KEY)
INDEX_NAME = "axion-health-journal"
index = pc.Index(INDEX_NAME)

# Initialize Google Generative AI for embeddings
genai.configure(api_key=app_settings.GOOGLE_API_KEY)


def get_embedding_for_document(text: str) -> list[float]:
    """
    Generate embedding for a journal entry using Gemini Embedding API.
    Uses RETRIEVAL_DOCUMENT task type for optimal storage.
    """
    try:
        result = genai.models.embed_content(
            model="gemini-embedding-001",
            content=text,
            task_type="RETRIEVAL_DOCUMENT",
        )
        return result["embedding"]
    except Exception as e:
        logger.error(f"Error generating document embedding: {e}")
        raise


def get_embedding_for_query(text: str) -> list[float]:
    """
    Generate embedding for a search query using Gemini Embedding API.
    Uses RETRIEVAL_QUERY task type for optimal search.
    """
    try:
        result = genai.models.embed_content(
            model="gemini-embedding-001",
            content=text,
            task_type="RETRIEVAL_QUERY",
        )
        return result["embedding"]
    except Exception as e:
        logger.error(f"Error generating query embedding: {e}")
        raise


def add_journal_entry(
    entry_id: str,
    user_id: str,
    content: str,
    date: str,
) -> None:
    """
    Add a journal entry to Pinecone with user isolation.

    Args:
        entry_id: Unique entry ID (UUID from Supabase)
        user_id: User ID for data isolation
        content: Journal entry text
        date: Entry date (ISO format)
    """
    try:
        logger.info(f"Adding journal entry {entry_id} for user {user_id}")

        # Generate embedding
        embedding = get_embedding_for_document(content)

        # Create unique ID combining user_id and entry_id for isolation
        vector_id = f"{user_id}#{entry_id}"

        # Upsert to Pinecone with metadata
        index.upsert(
            vectors=[
                {
                    "id": vector_id,
                    "values": embedding,
                    "metadata": {
                        "user_id": user_id,
                        "entry_id": entry_id,
                        "date": date,
                        "content": content,
                    },
                }
            ]
        )

        logger.info(f"Successfully added entry {entry_id} to Pinecone")

    except Exception as e:
        logger.error(f"Error adding journal entry to Pinecone: {e}")
        raise


def search_journal_entries(
    user_id: str,
    query: str,
    n_results: int = 5,
) -> dict:
    """
    Search journal entries using semantic similarity.
    Results are filtered to the requesting user only.

    Args:
        user_id: User ID for data isolation
        query: Search query
        n_results: Number of results to return

    Returns:
        Dictionary with query, results count, and result list
    """
    try:
        logger.info(f"Searching journal for user {user_id}: {query}")

        # Generate query embedding
        query_embedding = get_embedding_for_query(query)

        # Search with user_id filter
        search_results = index.query(
            vector=query_embedding,
            top_k=n_results,
            filter={"user_id": {"$eq": user_id}},
            include_metadata=True,
        )

        # Format results
        results = []
        for match in search_results.get("matches", []):
            metadata = match.get("metadata", {})
            results.append(
                {
                    "entry_id": metadata.get("entry_id"),
                    "date": metadata.get("date"),
                    "content": metadata.get("content"),
                    "similarity": float(match.get("score", 0)),
                }
            )

        logger.info(f"Found {len(results)} results for query")

        return {
            "query": query,
            "results": results,
            "count": len(results),
        }

    except Exception as e:
        logger.error(f"Error searching journal: {e}")
        return {
            "query": query,
            "results": [],
            "count": 0,
            "error": str(e),
        }


def delete_journal_entry(entry_id: str, user_id: str) -> None:
    """
    Delete a journal entry from Pinecone.

    Args:
        entry_id: Entry ID to delete
        user_id: User ID (for safety/logging)
    """
    try:
        logger.info(f"Deleting journal entry {entry_id} for user {user_id}")

        # Construct the vector ID (same as used in add_journal_entry)
        vector_id = f"{user_id}#{entry_id}"

        # Delete from Pinecone
        index.delete(ids=[vector_id])

        logger.info(f"Successfully deleted entry {entry_id} from Pinecone")

    except Exception as e:
        logger.error(f"Error deleting journal entry from Pinecone: {e}")
        raise


def delete_all_user_entries(user_id: str) -> None:
    """
    Delete all journal entries for a user (useful for GDPR/data deletion).

    Args:
        user_id: User ID whose entries to delete
    """
    try:
        logger.info(f"Deleting all journal entries for user {user_id}")

        # Query all user's entries
        results = index.query(
            vector=[0.0] * 768,  # Dummy vector to get metadata
            top_k=10000,  # High limit
            filter={"user_id": {"$eq": user_id}},
            include_metadata=True,
        )

        # Extract IDs
        ids_to_delete = [match["id"] for match in results.get("matches", [])]

        if ids_to_delete:
            index.delete(ids=ids_to_delete)
            logger.info(f"Deleted {len(ids_to_delete)} entries for user {user_id}")
        else:
            logger.info(f"No entries found for user {user_id}")

    except Exception as e:
        logger.error(f"Error deleting user entries: {e}")
        raise
