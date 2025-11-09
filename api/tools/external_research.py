"""
External Research Tool using Perplexity API
Performs cited web research for health questions
"""
from openai import OpenAI
from config import settings
import logging

logger = logging.getLogger(__name__)


def external_research(query: str) -> dict:
    """
    Query Perplexity AI for cited, real-time web research.

    This tool searches the internet for health-related information
    with citations to credible sources.

    Args:
        query: Research query (e.g., "side effects of antihistamines on heart rate")

    Returns:
        Dictionary with research results including:
        - answer: synthesized answer from multiple sources
        - citations: list of source URLs
        - sources: detailed source information
    """
    try:
        logger.info(f"Performing external research: '{query}'")

        # Initialize Perplexity client (uses OpenAI-compatible API)
        perplexity_client = OpenAI(
            api_key=settings.PERPLEXITY_API_KEY,
            base_url="https://api.perplexity.ai"
        )

        # Make request to Perplexity
        response = perplexity_client.chat.completions.create(
            model="sonar-pro",
            messages=[
                {
                    "role": "system",
                    "content": "You are a health research assistant. Provide factual, cited information from credible medical sources. Include specific citations and be clear about the level of evidence."
                },
                {
                    "role": "user",
                    "content": query
                }
            ]
        )

        # Extract answer
        answer = response.choices[0].message.content

        # Extract citations if available
        citations = []
        sources = []

        # Perplexity includes citations in the response
        # The exact format may vary, so we handle it gracefully
        if hasattr(response, 'citations'):
            citations = response.citations
            sources = [
                {
                    "url": citation,
                    "title": _extract_domain(citation)
                }
                for citation in citations
            ]

        result_dict = {
            "query": query,
            "answer": answer,
            "citations": citations,
            "sources": sources,
            "tool": "perplexity_research",
            "model": "sonar-pro"
        }

        logger.info(f"External research complete with {len(citations)} citations")
        return result_dict

    except Exception as e:
        logger.error(f"Error in external research: {e}")
        return {
            "query": query,
            "answer": f"Unable to complete research query. Error: {str(e)}",
            "citations": [],
            "sources": [],
            "error": str(e)
        }


def _extract_domain(url: str) -> str:
    """Extract domain name from URL for display"""
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        return parsed.netloc or url
    except:
        return url
