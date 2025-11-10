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
from services.chat_history import (
    save_message,
    load_recent_history,
    convert_to_gemini_history
)
import logging
import json
from datetime import datetime
from typing import Optional

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
                    description="Name of the health metric to analyze. Common metrics: 'heart_rate_resting', 'heart_rate_sleep', 'steps', 'sleep_duration', 'blood_pressure_systolic', 'blood_pressure_diastolic', 'oxygen_saturation', 'body_fat'. You can also use user-friendly names like 'heart rate' which will be normalized automatically."
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
                    description="Name of the health metric to forecast. Common metrics: 'heart_rate_resting' (for resting heart rate), 'heart_rate_sleep', 'steps', 'sleep_duration', 'weight', 'body_mass_index'. You can also use user-friendly names like 'heart rate' or 'resting heart rate' which will be normalized automatically."
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
        logger.info(f"[TOOL_EXECUTE] Function: {function_name}, User: {user_id}, Args: {arguments}")

        if function_name == "detect_anomalies":
            result = detect_anomalies(user_id=user_id, **arguments)
            logger.info(f"[TOOL_RESULT] detect_anomalies: Found {result.get('anomaly_count', 0)} anomalies")
            return result

        elif function_name == "find_correlations":
            result = find_correlations(user_id=user_id, **arguments)
            logger.info(f"[TOOL_RESULT] find_correlations: Found {len(result.get('correlations', []))} correlations")
            return result

        elif function_name == "run_forecasting":
            result = run_forecasting(user_id=user_id, **arguments)
            if "error" in result:
                logger.warning(f"[TOOL_RESULT] run_forecasting: Error - {result.get('error')}")
            else:
                logger.info(f"[TOOL_RESULT] run_forecasting: Generated {len(result.get('forecast_values', []))} predictions")
            return result

        elif function_name == "search_private_journal":
            result = search_private_journal(user_id=user_id, **arguments)
            logger.info(f"[TOOL_RESULT] search_private_journal: Found {result.get('count', 0)} entries")
            if result.get('count', 0) == 0:
                logger.warning(f"[TOOL_RESULT] Journal search returned no results for query: '{arguments.get('query')}'")
            return result

        elif function_name == "external_research":
            result = external_research(**arguments)
            logger.info(f"[TOOL_RESULT] external_research: Retrieved research for '{arguments.get('query')}'")
            return result

        else:
            logger.error(f"[TOOL_EXECUTE] Unknown function: {function_name}")
            return {"error": f"Unknown function: {function_name}"}

    except Exception as e:
        logger.exception(f"[TOOL_EXECUTE] Error executing {function_name}: {type(e).__name__}: {str(e)}")
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
        logger.info(f"[INSIGHTS] Generating insights for user {user_id}")

        # Initialize Gemini model WITH tools to access real health data
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            tools=TOOL_SCHEMAS,
            system_instruction="""You are a proactive health insights AI assistant. You have access to the user's health data through tools.

To generate insights:
1. Use find_correlations to discover relationships between health metrics
2. Use detect_anomalies on key metrics (heart_rate_resting, steps, sleep_duration) to find unusual patterns
3. Based on the data from these tools, generate 3-5 specific, actionable insights

Be specific with actual numbers, dates, and metric values from the tool results. Provide insights that are meaningful, backed by real data, and relevant to their health."""
        )

        # Create a prompt that encourages tool use
        prompt = """Analyze my health data and provide 3-5 specific health insights. Use your tools to:
1. Find correlations between my health metrics
2. Detect any anomalies in my heart rate, steps, and sleep patterns
3. Based on the real data you find, give me personalized recommendations

Format your response as a clear, numbered list with specific metrics, dates, and values from my actual data."""

        # Start chat and send message
        chat = model.start_chat()
        response = chat.send_message(prompt)

        # Handle function calls (same pattern as process_query)
        max_iterations = 10
        iteration = 0
        tools_used = []
        
        while iteration < max_iterations and response.candidates[0].content.parts:
            iteration += 1
            parts = response.candidates[0].content.parts
            
            # Collect all function calls
            function_calls_to_execute = []
            has_function_calls = False
            
            for part in parts:
                if hasattr(part, 'function_call') and part.function_call:
                    has_function_calls = True
                    function_calls_to_execute.append(part.function_call)
            
            # If no function calls, we got the final response
            if not has_function_calls:
                break
            
            # Execute all function calls
            function_response_parts = []
            
            for function_call in function_calls_to_execute:
                function_name = function_call.name
                function_args = dict(function_call.args)
                
                logger.info(f"[INSIGHTS] Tool called: {function_name} with args: {function_args}")
                tools_used.append(function_name)
                
                # Execute the function
                function_result = _execute_function(function_name, user_id, function_args)
                
                # Create function response
                function_response_parts.append(
                    genai.protos.Part(
                        function_response=genai.protos.FunctionResponse(
                            name=function_name,
                            response={"result": function_result}
                        )
                    )
                )
            
            # Send function responses back to Gemini
            logger.info(f"[INSIGHTS] Sending {len(function_response_parts)} tool results back to Gemini")
            response = chat.send_message(
                genai.protos.Content(parts=function_response_parts)
            )

        # Extract the final text response
        final_text = response.text if response.text else "Unable to generate insights at this time."

        logger.info(f"[INSIGHTS] Generated insights using tools: {tools_used}")
        logger.info(f"[INSIGHTS] Response preview: {final_text[:200]}...")

        # Return structured insights
        return [{
            "type": "summary",
            "title": "AI Health Insights",
            "description": final_text,
            "timestamp": datetime.utcnow().isoformat(),
            "tools_used": tools_used
        }]

    except Exception as e:
        logger.exception(f"[INSIGHTS] Error generating insights for user {user_id}")
        error_msg = f"{type(e).__name__}: {str(e)}"
        return [{
            "type": "error",
            "title": "Error Generating Insights",
            "description": f"Unable to generate insights: {error_msg}",
            "timestamp": datetime.utcnow().isoformat()
        }]


def process_query(user_id: str, query: str, session_history: Optional[list] = None, access_token: Optional[str] = None) -> dict:
    """
    Process an interactive user query using Gemini with automatic function calling.

    This is the main entry point for the Deep Dive feature. Gemini analyzes the query,
    decides which tools to call (can be multiple), and synthesizes a comprehensive answer.

    Args:
        user_id: User ID for data scoping
        query: Natural language question from the user
        session_history: Optional session-based conversation history (preferred)
        access_token: JWT token for accessing user's chat history (legacy, unused if session_history provided)

    Returns:
        Dictionary with:
        - answer: Synthesized text response
        - tools_used: List of tools that were called
        - tool_results: Raw results from each tool
        - sources: Citations (if external research was used)
    """
    try:
        logger.info(f"Processing query for user {user_id}: '{query}'")

        # Use session-based history if provided (preferred approach)
        history = []
        if session_history:
            # Convert session history to Gemini format
            history = []
            for msg in session_history:
                role = "user" if msg.get("role") == "user" else "model"
                content = msg.get("content", "")
                if content:
                    history.append({
                        "role": role,
                        "parts": [{"text": content}]
                    })
            logger.info(f"Using session-based history with {len(history)} messages")
        else:
            # Fallback to empty history (no database dependency)
            logger.info("No session history provided, starting fresh conversation")

        # Initialize Gemini model with tools
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            tools=TOOL_SCHEMAS,
            system_instruction="""You are a personalized health AI assistant. You have access to the user's private health data and can:
1. Detect anomalies in health metrics
2. Find correlations between metrics
3. Forecast future trends
4. Search their private journal entries
5. Research health topics on the internet

Available health metrics include:
- Heart: heart_rate_resting, heart_rate_sleep, heart_rate_variability_sdnn, heart_rate_variability_rmssd
- Activity: steps, active_duration, floors_climbed, active_energy_burned
- Sleep: sleep_duration, sleep_deep_duration, sleep_rem_duration, sleep_light_duration
- Body: weight, body_mass_index, body_fat, height
- Vitals: blood_pressure_systolic, blood_pressure_diastolic, oxygen_saturation, respiratory_rate, blood_glucose

You can use user-friendly names (e.g., "heart rate" for "heart_rate_resting") and they will be normalized automatically.

When answering queries:
- Always prioritize the user's privacy and data security
- Provide specific, actionable insights based on their personal data
- Cite sources when using external research
- Be clear about the limitations of your analysis
- Use a supportive, non-alarmist tone
- If you detect concerning patterns, suggest consulting a healthcare professional
- Remember context from previous messages in this conversation"""
        )

        # Track tool usage
        tools_used = []
        tool_results = {}

        # Start chat session with history
        chat = model.start_chat(history=history)

        # Send the user's query
        response = chat.send_message(query)

        # Handle function calls manually to inject user_id
        # Support multiple function calls in a single response
        max_iterations = 10  # Prevent infinite loops
        iteration = 0
        
        while iteration < max_iterations and response.candidates[0].content.parts:
            iteration += 1
            parts = response.candidates[0].content.parts
            
            # Collect all function calls from all parts
            function_calls_to_execute = []
            has_function_calls = False
            
            for part in parts:
                if hasattr(part, 'function_call') and part.function_call:
                    has_function_calls = True
                    function_calls_to_execute.append(part.function_call)
            
            # If no function calls, we got the final text response
            if not has_function_calls:
                break
            
            # Execute all function calls and collect responses
            function_response_parts = []
            
            for function_call in function_calls_to_execute:
                function_name = function_call.name
                function_args = dict(function_call.args)
                
                logger.info(f"Gemini called tool: {function_name} with args: {function_args}")
                tools_used.append(function_name)
                
                # Execute the function
                function_result = _execute_function(function_name, user_id, function_args)
                tool_results[function_name] = function_result
                
                # Create function response part
                function_response_parts.append(
                    genai.protos.Part(
                        function_response=genai.protos.FunctionResponse(
                            name=function_name,
                            response={"result": function_result}
                        )
                    )
                )
            
            # Send all function responses back to Gemini in one message
            logger.info(f"Sending {len(function_response_parts)} function responses back to Gemini")
            response = chat.send_message(
                genai.protos.Content(parts=function_response_parts)
            )

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
        
        # Session-based memory: No database persistence needed
        # History is managed by frontend and passed with each request
        
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

