from typing import List
from fastapi import APIRouter, Depends, Query
from app.api.dependencies import get_current_user, get_services
from app.core.responses import APIResponse, success_response
from app.factories.service_factory import ServiceFactory
from app.modules.activities.schemas import ActivityLogResponse
from app.modules.users.models import User

router = APIRouter(prefix="/groups", tags=["Activity Logs & Audit Trail"])


@router.get(
    "/{group_id}/activities",
    response_model=APIResponse[List[ActivityLogResponse]],
    summary="Get activity log for a group",
)
async def get_group_activities(
    group_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    services: ServiceFactory = Depends(get_services),
):
    """Retrieves chronological activity timeline audit log of all events occurred within the group."""
    skip = (page - 1) * page_size
    activities = await services.activity_service.get_group_activities(
        group_id=group_id,
        user_id=current_user.id,
        skip=skip,
        limit=page_size,
    )
    return success_response(
        data=[a.model_dump(mode="json") for a in activities],
        message="Activities retrieved successfully",
        meta={"page": page, "page_size": page_size, "count": len(activities)},
    )
