from typing import List
from fastapi import APIRouter, Depends, Query, status
from app.api.dependencies import get_current_user, get_services
from app.core.responses import APIResponse, success_response
from app.factories.service_factory import ServiceFactory
from app.modules.expenses.schemas import (
    ExpenseCreate,
    ExpenseResponse,
    ExpenseSplitResponse,
    GroupBalanceSummary,
)
from app.modules.users.models import User

router = APIRouter(prefix="/groups", tags=["Expenses & Splits"])


@router.post(
    "/{group_id}/expenses",
    response_model=APIResponse[ExpenseResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Record a new group expense with split calculation",
)
async def create_expense(
    group_id: str,
    req: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    services: ServiceFactory = Depends(get_services),
):
    """Calculates and records an expense across participants using EQUAL, EXACT, PERCENTAGE, or SHARES splitting strategies."""
    expense = await services.expense_service.create_expense(
        current_user_id=current_user.id,
        group_id=group_id,
        req=req,
    )

    splits_resp = [
        ExpenseSplitResponse(
            id=s.id,
            user_id=s.user_id,
            user_name=s.user.full_name if s.user else "Unknown",
            user_email=s.user.email if s.user else None,
            amount_owed=s.amount_owed,
            percentage=s.percentage,
            shares=s.shares,
        )
        for s in expense.splits
    ]
    resp = ExpenseResponse(
        id=expense.id,
        group_id=expense.group_id,
        payer_id=expense.payer_id,
        payer_name=expense.payer.full_name if expense.payer else "Unknown",
        title=expense.title,
        amount=expense.amount,
        currency=expense.currency,
        split_type=expense.split_type,
        category=expense.category,
        notes=expense.notes,
        date=expense.date,
        created_at=expense.created_at,
        splits=splits_resp,
    )

    return success_response(
        data=resp.model_dump(mode="json"),
        message="Expense added and split successfully",
        status_code=status.HTTP_201_CREATED,
    )


@router.get(
    "/{group_id}/expenses",
    response_model=APIResponse[List[ExpenseResponse]],
    summary="List expenses for a group",
)
async def get_expenses(
    group_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    services: ServiceFactory = Depends(get_services),
):
    """Retrieves paginated list of recorded expenses and participant split amounts for the group."""
    skip = (page - 1) * page_size
    expenses = await services.expense_service.get_group_expenses(
        group_id=group_id,
        user_id=current_user.id,
        skip=skip,
        limit=page_size,
    )
    return success_response(
        data=[e.model_dump(mode="json") for e in expenses],
        message="Expenses retrieved successfully",
        meta={"page": page, "page_size": page_size, "count": len(expenses)},
    )


@router.get(
    "/{group_id}/expenses/{expense_id}",
    response_model=APIResponse[ExpenseResponse],
    summary="Get single expense details by ID",
)
async def get_expense_detail(
    group_id: str,
    expense_id: str,
    current_user: User = Depends(get_current_user),
    services: ServiceFactory = Depends(get_services),
):
    """Retrieves full breakdown and participants' splits for a specific expense."""
    expense = await services.expense_service.get_expense_by_id(
        group_id=group_id,
        expense_id=expense_id,
        user_id=current_user.id,
    )
    return success_response(
        data=expense.model_dump(mode="json"),
        message="Expense details retrieved successfully",
    )


@router.delete(
    "/{group_id}/expenses/{expense_id}",
    response_model=APIResponse[None],
    summary="Delete an expense",
)
async def delete_expense(
    group_id: str,
    expense_id: str,
    current_user: User = Depends(get_current_user),
    services: ServiceFactory = Depends(get_services),
):
    """Deletes an expense if the user is the payer or a group admin."""
    await services.expense_service.delete_expense(
        group_id=group_id,
        expense_id=expense_id,
        user_id=current_user.id,
    )
    return success_response(
        message="Expense deleted successfully",
    )


@router.get(
    "/{group_id}/balances",
    response_model=APIResponse[GroupBalanceSummary],
    summary="Get net balances for all members in a group",
)
async def get_group_balances(
    group_id: str,
    current_user: User = Depends(get_current_user),
    services: ServiceFactory = Depends(get_services),
):
    """Computes total paid, total owed, and net balance (+/-) for each group member."""
    summary = await services.expense_service.get_group_balances(
        group_id=group_id,
        user_id=current_user.id,
    )
    return success_response(
        data=summary.model_dump(mode="json"),
        message="Group balances calculated successfully",
    )

