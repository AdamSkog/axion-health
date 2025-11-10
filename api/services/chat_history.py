"""
Chat History Service for Conversation Memory
Manages persistent conversation history in Supabase
"""
import logging
from typing import List, Dict, Any, Optional
from services.supabase_client import get_user_scoped_client
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


def save_message(
    user_id: str,
    role: str,
    content: Optional[str] = None,
    function_calls: Optional[List[Dict]] = None,
    tool_results: Optional[Dict] = None,
    access_token: str = None
) -> bool:
    """
    Save a message to chat history.
    
    Args:
        user_id: User's ID
        role: 'user', 'assistant', or 'function'
        content: Text content (for user/assistant messages)
        function_calls: List of function calls (for assistant messages with tool use)
        tool_results: Tool execution results (for function messages)
        access_token: User's JWT token for RLS
    
    Returns:
        True if successful, False otherwise
    """
    try:
        # Use user-scoped client for RLS
        if access_token:
            client = get_user_scoped_client(access_token)
        else:
            logger.warning("No access token provided for save_message, skipping")
            return False
        
        message_data = {
            "user_id": user_id,
            "role": role,
            "content": content,
            "function_calls": function_calls,
            "tool_results": tool_results,
            "created_at": datetime.utcnow().isoformat()
        }
        
        client.table("chat_history").insert(message_data).execute()
        logger.debug(f"Saved {role} message for user {user_id}")
        return True
        
    except Exception as e:
        error_msg = str(e).lower()
        # Silently ignore if table doesn't exist (user hasn't set it up yet)
        if "relation" in error_msg and "does not exist" in error_msg:
            return False
        if "table" in error_msg and "not found" in error_msg:
            return False
        # Log other errors as warnings (not errors to avoid noise)
        logger.warning(f"Failed to save chat history (table may not exist): {e}")
        return False


def load_recent_history(
    user_id: str,
    access_token: str,
    max_messages: int = 20,
    max_age_hours: int = 24
) -> List[Dict[str, Any]]:
    """
    Load recent chat history for a user.
    
    Args:
        user_id: User's ID
        access_token: User's JWT token for RLS
        max_messages: Maximum number of messages to retrieve
        max_age_hours: Only retrieve messages from the last N hours
    
    Returns:
        List of message dictionaries in chronological order
    """
    try:
        client = get_user_scoped_client(access_token)
        
        # Calculate cutoff time
        cutoff_time = datetime.utcnow() - timedelta(hours=max_age_hours)
        
        # Fetch recent messages
        result = client.table("chat_history").select("*").eq(
            "user_id", user_id
        ).gte(
            "created_at", cutoff_time.isoformat()
        ).order(
            "created_at", desc=False
        ).limit(max_messages).execute()
        
        messages = result.data if result.data else []
        logger.info(f"Loaded {len(messages)} history messages for user {user_id}")
        return messages
        
    except Exception as e:
        logger.warning(f"Failed to load chat history (table may not exist yet): {e}")
        return []


def convert_to_gemini_history(messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Convert stored messages to Gemini chat history format.
    
    Args:
        messages: List of messages from database
    
    Returns:
        List of messages in Gemini format (role + parts)
    """
    try:
        history = []
        
        for msg in messages:
            role = msg.get("role")
            content = msg.get("content")
            
            # Skip function/tool messages for now (Gemini handles these internally)
            if role == "function":
                continue
            
            # Convert role to Gemini format
            gemini_role = "user" if role == "user" else "model"
            
            if content:
                history.append({
                    "role": gemini_role,
                    "parts": [{"text": content}]
                })
        
        logger.debug(f"Converted {len(messages)} messages to {len(history)} Gemini history items")
        return history
        
    except Exception as e:
        logger.error(f"Failed to convert chat history: {e}")
        return []


def clear_user_history(user_id: str, access_token: str) -> bool:
    """
    Clear all chat history for a user.
    
    Args:
        user_id: User's ID
        access_token: User's JWT token for RLS
    
    Returns:
        True if successful, False otherwise
    """
    try:
        client = get_user_scoped_client(access_token)
        client.table("chat_history").delete().eq("user_id", user_id).execute()
        logger.info(f"Cleared chat history for user {user_id}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to clear chat history: {e}")
        return False

