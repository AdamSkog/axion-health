"""
Gemini AI Orchestrator with Function Calling
Coordinates multiple specialized tools to answer health queries
"""
import google.generativeai as genai
from google.generativeai import protos
from config import settings
from tools.anomaly_detection import detect_anomalies
from tools.correlation_analysis import find_correlations
from tools.forecasting import run_forecasting
from tools.journal_search import search_private_journal
from tools.external_research import external_research
import logging
import json
from datetime import datetime

logger = logging.getLogger(__name__)

# Configure Gemini
genai.configure(api_key=settings.GOOGLE_API_KEY)


# Define function schemas for Gemini function calling using native SDK format
TOOL_SCHEMAS = [
    protos.FunctionDeclaration(
        name="detect_anomalies",
        description="Detect unusual patterns or outliers in a specific health metric using machine learning. Use this when the user asks about abnormal readings, sudden changes, or wants to identify concerning patterns.",
        parameters=protos.Schema(
            type=protos.Type.OBJECT,
            properties={
                "metric_name": protos.Schema(
                    type=protos.Type.STRING,
                    description="Name of the health metric to analyze (e.g., 'heart_rate', 'steps', 'sleep_duration', 'blood_pressure')"
                ),
                "lookback_days": protos.Schema(
                    type=protos.Type.INTEGER,
                    description="Number of days to analyze (default: 30)"
                ),
                "contamination": protos.Schema(
                    type=protos.Type.NUMBER,
                    description="Expected proportion of outliers 0.0-0.5 (default: 0.1)"
                )
            },
            required=["metric_name"]
        )
    ),
    protos.FunctionDeclaration(
        name="find_correlations",
        description="Find statistical relationships between different health metrics. Use this when the user asks about connections between metrics, what affects what, or wants to understand how different health factors relate to each other.",
        parameters=protos.Schema(
            type=protos.Type.OBJECT,
            properties={
                "lookback_days": protos.Schema(
                    type=protos.Type.INTEGER,
                    description="Number of days to analyze (default: 30)"
                ),
                "min_correlation": protos.Schema(
                    type=protos.Type.NUMBER,
                    description="Minimum correlation coefficient to report (default: 0.3)"
                )
            }
        )
    ),
    protos.FunctionDeclaration(
        name="run_forecasting",
        description="Predict future values of a health metric based on historical patterns using time-series analysis. Use this when the user asks about future trends, predictions, or what to expect.",
        parameters=protos.Schema(
            type=protos.Type.OBJECT,
            properties={
                "metric_name": protos.Schema(
                    type=protos.Type.STRING,
                    description="Name of the health metric to forecast (e.g., 'heart_rate', 'steps', 'sleep_duration')"
                ),
                "forecast_days": protos.Schema(
                    type=protos.Type.INTEGER,
                    description="Number of days to forecast (default: 7)"
                ),
                "lookback_days": protos.Schema(
                    type=protos.Type.INTEGER,
                    description="Number of historical days to use (default: 30)"
                )
            },
            required=["metric_name"]
        )
    ),
    protos.FunctionDeclaration(
        name="search_private_journal",
        description="Search the user's private journal entries using semantic similarity. Use this when the user asks about past experiences, journal entries, or wants to recall information they wrote about.",
        parameters=protos.Schema(
            type=protos.Type.OBJECT,
            properties={
                "query": protos.Schema(
                    type=protos.Type.STRING,
                    description="Search query describing what to look for in journal entries"
                ),
                "n_results": protos.Schema(
                    type=protos.Type.INTEGER,
                    description="Number of results to return (default: 5)"
                )
            },
            required=["query"]
        )
    ),
    protos.FunctionDeclaration(
        name="external_research",
        description="Search the internet for health-related information with citations to credible sources. Use this when the user asks about medical conditions, medication effects, health advice, or any information not available in their personal data.",
        parameters=protos.Schema(
            type=protos.Type.OBJECT,
            properties={
                "query": protos.Schema(
                    type=protos.Type.STRING,
                    description="Research query (e.g., 'side effects of antihistamines on heart rate')"
                )
            },
            required=["query"]
        )
    )
]


def _execute_function(function_name: str, user_id: str, arguments: dict) -> dict:
    """
    Execute a tool function with the given arguments.

    Args:
        function_name: Name of the function to execute
        user_id: User ID for data scoping
        arguments: Function arguments from Gemini

    Returns:
        Dictionary with function execution results
    """
    try:
        logger.info(f"Executing function: {function_name} with args: {arguments}")

        if function_name == "detect_anomalies":
            return detect_anomalies(user_id=user_id, **arguments)

        elif function_name == "find_correlations":
            return find_correlations(user_id=user_id, **arguments)

        elif function_name == "run_forecasting":
            return run_forecasting(user_id=user_id, **arguments)

        elif function_name == "search_private_journal":
            return search_private_journal(user_id=user_id, **arguments)

        elif function_name == "external_research":
            # External research doesn't need user_id
            return external_research(**arguments)

        else:
            logger.error(f"Unknown function: {function_name}")
            return {"error": f"Unknown function: {function_name}"}

    except Exception as e:
        logger.exception(f"Error executing {function_name}")
        error_msg = f"{type(e).__name__}: {str(e)}"
        return {"error": error_msg}


def generate_insights(user_id: str) -> list[dict]:
    """
    Generate proactive AI insights for the dashboard feed.

    This function automatically runs anomaly detection and correlation analysis
    to surface interesting patterns without requiring a user query.

    Args:
        user_id: User ID to generate insights for

    Returns:
        List of insight dictionaries with:
        - type: 'anomaly', 'correlation', 'trend'
        - title: Short headline
        - description: Detailed explanation
        - data: Supporting data (optional)
        - timestamp: When insight was generated
    """
    try:
        logger.info(f"Generating insights for user {user_id}")

        # Initialize Gemini model WITHOUT function calling (due to SDK compatibility issues)
        # We'll generate text-based insights instead
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash-exp",
            system_instruction="""You are a proactive health insights AI assistant. Analyze the user's health data and generate 3-5 actionable, specific health insights.

Focus on:
1. Unusual patterns or anomalies in their health metrics
2. Correlations and relationships between different health factors
3. Trends and patterns over time
4. Personalized, evidence-based recommendations

Be specific with numbers and dates from their data. Provide insights that are meaningful, backed by data, and relevant to their overall health and wellness."""
        )

        # Create a prompt for insight generation
        prompt = """Based on my health data, please analyze and provide 3-5 specific, actionable health insights. Include:
1. Any unusual patterns or anomalies you notice in my metrics like heart rate, steps, sleep duration, blood pressure, and respiratory rate
2. Any interesting correlations or relationships you see between different health factors
3. Trends you observe and personalized recommendations based on those trends

Format your response as a clear, numbered list with specific metrics and data points."""

        # Start chat and send message
        chat = model.start_chat()
        response = chat.send_message(prompt)

        # Extract the text response
        final_text = response.text if response.text else "Unable to generate insights at this time."

        logger.info(f"Generated insights: {final_text[:200]}...")

        # Return structured insights
        return [{
            "type": "summary",
            "title": "AI Health Insights",
            "description": final_text,
            "timestamp": datetime.utcnow().isoformat()
        }]

    except Exception as e:
        logger.exception(f"Error generating insights for user {user_id}")
        error_msg = f"{type(e).__name__}: {str(e)}"
        return [{
            "type": "error",
            "title": "Error Generating Insights",
            "description": f"Unable to generate insights: {error_msg}",
            "timestamp": "now"
        }]


def process_query(user_id: str, query: str) -> dict:
    """
    Process an interactive user query using Gemini with automatic function calling.

    This is the main entry point for the Deep Dive feature. Gemini analyzes the query,
    decides which tools to call (can be multiple), and synthesizes a comprehensive answer.

    Args:
        user_id: User ID for data scoping
        query: Natural language question from the user

    Returns:
        Dictionary with:
        - answer: Synthesized text response
        - tools_used: List of tools that were called
        - tool_results: Raw results from each tool
        - sources: Citations (if external research was used)
    """
    try:
        logger.info(f"Processing query for user {user_id}: '{query}'")

        # Initialize Gemini model with tools
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash-exp",
            tools=TOOL_SCHEMAS,
            system_instruction="""You are a personalized health AI assistant. You have access to the user's private health data and can:
1. Detect anomalies in health metrics
2. Find correlations between metrics
3. Forecast future trends
4. Search their private journal entries
5. Research health topics on the internet

When answering queries:
- Always prioritize the user's privacy and data security
- Provide specific, actionable insights based on their personal data
- Cite sources when using external research
- Be clear about the limitations of your analysis
- Use a supportive, non-alarmist tone
- If you detect concerning patterns, suggest consulting a healthcare professional"""
        )

        # Track tool usage
        tools_used = []
        tool_results = {}

        # Start chat session
        chat = model.start_chat()

        # Send the user's query
        response = chat.send_message(query)

        # Handle function calls manually to inject user_id
        while response.candidates[0].content.parts:
            part = response.candidates[0].content.parts[0]

            # Check if this is a function call
            if hasattr(part, 'function_call') and part.function_call:
                function_call = part.function_call
                function_name = function_call.name
                function_args = dict(function_call.args)

                logger.info(f"Gemini called tool: {function_name}")
                tools_used.append(function_name)

                # Execute the function
                function_result = _execute_function(function_name, user_id, function_args)
                tool_results[function_name] = function_result

                # Send result back to Gemini
                response = chat.send_message(
                    genai.protos.Content(
                        parts=[genai.protos.Part(
                            function_response=genai.protos.FunctionResponse(
                                name=function_name,
                                response={"result": function_result}
                            )
                        )]
                    )
                )
            else:
                # We got the final text response
                break

        # Extract final answer
        final_answer = response.text

        # Extract citations if external research was used
        sources = []
        if "external_research" in tools_used and "external_research" in tool_results:
            research_result = tool_results["external_research"]
            if "citations" in research_result:
                sources = research_result.get("citations", [])

        result = {
            "answer": final_answer,
            "tools_used": tools_used,
            "tool_results": tool_results,
            "sources": sources
        }

        logger.info(f"Query processed successfully. Tools used: {tools_used}")
        return result

    except Exception as e:
        logger.exception(f"Error processing query for user {user_id}: {query}")
        error_msg = f"{type(e).__name__}: {str(e)}"
        return {
            "answer": f"I apologize, but I encountered an error processing your query: {error_msg}",
            "tools_used": [],
            "tool_results": {},
            "sources": [],
            "error": error_msg
        }
