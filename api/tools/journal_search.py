"""
Journal Search Tool
Performs semantic search across user's journal entries using Pinecone RAG
"""
from services.pinecone_client import search_journal_entries as pinecone_search
from services.supabase_client import get_supabase_client
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
        logger.info(f"[JOURNAL_SEARCH] Searching journal for user {user_id}: '{query}' (max_results={n_results})")

        # Step 1: Verify journal entries exist in Supabase
        supabase = get_supabase_client()
        try:
            supabase_check = supabase.table("journal_entries").select(
                "id, date, content"
            ).eq("user_id", user_id).execute()
            
            supabase_entries = supabase_check.data or []
            logger.info(f"[JOURNAL_SEARCH] Found {len(supabase_entries)} journal entries in Supabase for user {user_id}")
            
            if len(supabase_entries) == 0:
                logger.warning(f"[JOURNAL_SEARCH] User {user_id} has NO journal entries in Supabase. Cannot search.")
                return {
                    "query": query,
                    "results": [],
                    "count": 0,
                    "message": "You haven't created any journal entries yet. Start journaling to enable searches!",
                    "supabase_entries": 0
                }
            
            # Log sample of entries for debugging
            for i, entry in enumerate(supabase_entries[:3], 1):
                preview = entry.get('content', '')[:60]
                logger.debug(f"[JOURNAL_SEARCH] Supabase entry {i}: date={entry.get('date')}, preview='{preview}...'")
                
        except Exception as db_error:
            logger.error(f"[JOURNAL_SEARCH] Error checking Supabase journal entries: {db_error}")
            # Continue with Pinecone search even if Supabase check fails
            supabase_entries = []

        # Step 2: Search Pinecone for semantic matches
        search_results = pinecone_search(
            user_id=user_id,
            query=query,
            n_results=n_results
        )

        results = search_results.get("results", [])
        
        # Format results for tool output
        formatted_results = {
            "query": query,
            "results": results,
            "count": len(results),
            "tool": "semantic_journal_search"
        }

        if len(results) == 0:
            # Step 3: Fallback to keyword search if Pinecone found nothing but entries exist
            if len(supabase_entries) > 0:
                logger.warning(f"[JOURNAL_SEARCH] Pinecone found 0 matches. Attempting keyword fallback search in Supabase...")
                
                try:
                    # Perform case-insensitive keyword search
                    keyword_results = supabase.table("journal_entries").select(
                        "id, date, content"
                    ).eq("user_id", user_id).ilike("content", f"%{query}%").limit(n_results).execute()
                    
                    fallback_entries = keyword_results.data or []
                    logger.info(f"[JOURNAL_SEARCH] Keyword fallback found {len(fallback_entries)} matches")
                    
                    if len(fallback_entries) > 0:
                        # Format fallback results (without similarity scores)
                        results = [
                            {
                                "entry_id": entry.get("id"),
                                "date": entry.get("date"),
                                "content": entry.get("content"),
                                "similarity": 0.0,  # No similarity score for keyword search
                                "search_method": "keyword_fallback"
                            }
                            for entry in fallback_entries
                        ]
                        formatted_results["results"] = results
                        formatted_results["count"] = len(results)
                        formatted_results["search_method"] = "keyword_fallback"
                        formatted_results["message"] = f"Found {len(results)} entries using keyword search (semantic search returned no results)"
                        logger.info(f"[JOURNAL_SEARCH] Keyword fallback successful: {len(results)} entries found")
                    else:
                        # No results from keyword search either
                        logger.warning(f"[JOURNAL_SEARCH] SYNC ISSUE: User has {len(supabase_entries)} entries but neither semantic nor keyword search found matches for '{query}'")
                        formatted_results["message"] = f"No matching journal entries found for '{query}'. You have {len(supabase_entries)} journal entries, but none matched this search. Try different search terms or check if entries are synced to vector database."
                        formatted_results["supabase_entries"] = len(supabase_entries)
                        formatted_results["sync_warning"] = True
                        
                except Exception as fallback_error:
                    logger.error(f"[JOURNAL_SEARCH] Keyword fallback failed: {fallback_error}")
                    formatted_results["message"] = f"No matching journal entries found for '{query}'. You have {len(supabase_entries)} journal entries, but search failed."
                    formatted_results["supabase_entries"] = len(supabase_entries)
            else:
                logger.warning(f"[JOURNAL_SEARCH] No journal entries found for query '{query}'. User {user_id} may not have created any journal entries yet.")
                formatted_results["message"] = "No matching journal entries found. The user may not have written about this topic yet."
        else:
            logger.info(f"[JOURNAL_SEARCH] Found {len(results)} journal entries. Top match has similarity score: {results[0].get('similarity', 0):.3f}")
            # Log preview of top results for debugging
            for i, result in enumerate(results[:3], 1):
                preview = result.get('content', '')[:80]
                logger.debug(f"  Result {i}: date={result.get('date')}, similarity={result.get('similarity', 0):.3f}, preview='{preview}...'")
        
        return formatted_results

    except Exception as e:
        logger.error(f"[JOURNAL_SEARCH] Error in journal search for user {user_id}: {type(e).__name__}: {e}", exc_info=True)
        return {
            "query": query,
            "results": [],
            "count": 0,
            "error": str(e),
            "message": f"Journal search encountered an error: {str(e)}"
        }
