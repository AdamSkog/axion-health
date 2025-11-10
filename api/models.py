from pydantic import BaseModel, Field
from datetime import date as DateType, datetime
from typing import Optional


class JournalEntryCreate(BaseModel):
    """Model for creating a new journal entry"""
    date: DateType = Field(..., description="Date of the journal entry")
    content: str = Field(..., min_length=1, description="Journal entry content")


class JournalEntryResponse(BaseModel):
    """Model for journal entry response"""
    id: str
    user_id: str
    date: DateType
    content: str
    created_at: datetime
    updated_at: datetime


class HealthMetricCreate(BaseModel):
    """Model for creating a health metric"""
    timestamp: datetime
    metric_type: str
    value: float
    unit: str
    source: str = "manual"


class HealthMetricResponse(BaseModel):
    """Model for health metric response"""
    id: str
    user_id: str
    timestamp: datetime
    metric_type: str
    value: float
    unit: str
    source: str
    created_at: datetime


class AgentQuery(BaseModel):
    """Model for AI agent query"""
    query: str = Field(..., min_length=1, description="User's question or query")
    history: Optional[list[dict]] = Field(default=None, description="Optional conversation history for context")


class AgentResponse(BaseModel):
    """Model for AI agent response"""
    answer: str
    tools_used: list[str] = []
    chart_data: Optional[dict] = None
    sources: Optional[list[dict]] = None


class HealthDataRequest(BaseModel):
    """Model for health data request parameters"""
    days: int = Field(default=7, ge=1, le=90, description="Number of days to fetch")
