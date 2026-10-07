from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field


class ActivityLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(description="Activity log entry ID")
    group_id: str = Field(description="Associated group ID")
    user_id: Optional[str] = Field(None, description="User ID who performed the action")
    user_name: Optional[str] = Field(None, description="Full name of the user", examples=["Alice Smith"])
    action: str = Field(description="Action description", examples=["added expense 'Dinner' ($106.50)"])
    details: Optional[dict[str, Any]] = Field(None, description="Structured metadata payload of the event")
    created_at: datetime = Field(description="Event timestamp")
