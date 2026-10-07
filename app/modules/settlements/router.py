from typing import List
from fastapi import APIRouter, Depends, Query, status
from app.api.dependencies import get_current_user, get_services
from app.core.responses import APIResponse, success_response
from app.factories.service_factory import ServiceFactory
from app.modules.settlements.schemas import (
    DebtSimplificationResponse,
    SettlementCreate,
    SettlementResponse,
)
from app.modules.users.models import User

router = APIRouter(prefix="/groups", tags=["Settlements & Debt Simplification"])


@router.post(
    "/{group_id}/settlements",
    response_model=APIResponse[SettlementResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Record a direct payment/settlement between group members",
)
async def record_settlement(
    group_id: str,
    req: SettlementCreate,
    current_user: User = Depends(get_current_user),
    services: ServiceFactory = Depends(get_services),
):
    """Records a repayment transaction from the authenticated user to another group member."""
    settlement = await services.settlement_service.record_settlement(
        current_user_id=current_user.id,
        group_id=group_id,
        req=req,
    )
    resp = SettlementResponse(
        id=settlement.id,
        group_id=settlement.group_id,
        payer_id=settlement.payer_id,
        payer_name=current_user.full_name,
        receiver_id=settlement.receiver_id,
        amount=settlement.amount,
        payment_method=settlement.payment_method,
        reference_note=settlement.reference_note,
        created_at=settlement.created_at,
    )
    return success_response(
        data=resp.model_dump(mode="json"),
        message="Settlement payment recorded successfully",
        status_code=status.HTTP_201_CREATED,
    )


@router.get(
    "/{group_id}/settlements",
    response_model=APIResponse[List[SettlementResponse]],
    summary="List settlements recorded for a group",
)
async def get_settlements(
    group_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    services: ServiceFactory = Depends(get_services),
):
    """Retrieves paginated settlement history recorded within the specified group."""
    skip = (page - 1) * page_size
    settlements = await services.settlement_service.get_group_settlements(
        group_id=group_id,
        user_id=current_user.id,
        skip=skip,
        limit=page_size,
    )
    return success_response(
        data=[s.model_dump(mode="json") for s in settlements],
        message="Settlements retrieved successfully",
        meta={"page": page, "page_size": page_size, "count": len(settlements)},
    )


@router.get(
    "/{group_id}/simplify-debts",
    response_model=APIResponse[DebtSimplificationResponse],
    summary="Compute optimal minimal transactions to settle all group debts",
)
async def simplify_debts(
    group_id: str,
    current_user: User = Depends(get_current_user),
    services: ServiceFactory = Depends(get_services),
):
    """Applies the Greedy Min-Cash-Flow graph simplification algorithm to minimize total repayment transactions."""
    simplification = await services.settlement_service.simplify_debts(
        group_id=group_id,
        user_id=current_user.id,
    )
    return success_response(
        data=simplification.model_dump(mode="json"),
        message="Debts simplified successfully",
    )
