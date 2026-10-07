from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.modules.expenses.models import ExpenseCategory, SplitType


class SplitParticipantInput(BaseModel):
    user_id: str = Field(..., description="ID of the participant group member", examples=["c1f7b889-cf77-4b71-b0e2-d5cb0bca8085"])
    amount_owed: Optional[Decimal] = Field(None, ge=0, description="Explicit amount owed when split_type is EXACT", examples=[Decimal("35.50")])
    percentage: Optional[Decimal] = Field(None, ge=0, le=100, description="Percentage share when split_type is PERCENTAGE", examples=[Decimal("50.00")])
    shares: Optional[int] = Field(None, ge=1, description="Relative share count when split_type is SHARES", examples=[2])


class ExpenseCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Title/Description of the expense", examples=["Dinner at Italian Bistro"])
    amount: Decimal = Field(..., gt=Decimal("0.00"), decimal_places=2, description="Total amount paid", examples=[Decimal("106.50")])
    currency: str = Field(default="NPR", max_length=10, description="ISO currency code", examples=["NPR"])
    category: ExpenseCategory = Field(default=ExpenseCategory.GENERAL, description="Category of the expense", examples=[ExpenseCategory.FOOD_AND_DRINK])
    split_type: SplitType = Field(default=SplitType.EQUAL, description="Split strategy (EQUAL, EXACT, PERCENTAGE, SHARES)", examples=[SplitType.EQUAL])
    payer_id: Optional[str] = Field(None, description="User ID of member who paid (defaults to current user)")
    notes: Optional[str] = Field(None, description="Optional extra notes or itemized receipt info", examples=["Split among Alice, Bob, and Charlie."])
    date: Optional[datetime] = Field(None, description="Date and time when expense was incurred")
    splits: Optional[List[SplitParticipantInput]] = Field(
        default=None,
        description="List of participants and their split parameters (required for EXACT, PERCENTAGE, SHARES, or custom subset)",
    )


class ExpenseSplitResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(description="Split record ID")
    user_id: str = Field(description="Participant user ID")
    user_name: Optional[str] = Field(None, description="Participant's full name", examples=["Bob Builder"])
    user_email: Optional[str] = Field(None, description="Participant's email address", examples=["bob@example.com"])
    amount_owed: Decimal = Field(description="Calculated exact amount owed", examples=[Decimal("35.50")])
    percentage: Optional[Decimal] = Field(None, description="Assigned percentage share if applicable", examples=[Decimal("33.33")])
    shares: Optional[int] = Field(None, description="Assigned share units if applicable", examples=[1])


class ExpenseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(description="Expense record ID")
    group_id: str = Field(description="Group ID")
    payer_id: str = Field(description="User ID of the payer")
    payer_name: Optional[str] = Field(None, description="Full name of payer", examples=["Alice Smith"])
    title: str = Field(description="Expense title", examples=["Dinner at Italian Bistro"])
    amount: Decimal = Field(description="Total expense amount", examples=[Decimal("106.50")])
    currency: str = Field(description="Currency code", examples=["USD"])
    split_type: SplitType = Field(description="Applied split strategy", examples=[SplitType.EQUAL])
    category: ExpenseCategory = Field(description="Expense category", examples=[ExpenseCategory.FOOD_AND_DRINK])
    notes: Optional[str] = Field(None, description="Notes")
    date: datetime = Field(description="Expense timestamp")
    created_at: datetime = Field(description="Creation timestamp")
    splits: List[ExpenseSplitResponse] = Field(default=[], description="List of participant split breakdowns")


class UserBalanceDetail(BaseModel):
    user_id: str = Field(description="Member user ID")
    user_name: str = Field(description="Member's full name", examples=["Alice Smith"])
    email: str = Field(description="Member's email", examples=["alice@example.com"])
    total_paid: Decimal = Field(description="Total amount paid for the group", examples=[Decimal("200.00")])
    total_owed: Decimal = Field(description="Total amount owed across all group expenses", examples=[Decimal("50.00")])
    net_balance: Decimal = Field(description="Net balance (+ means is owed money, - means owes money)", examples=[Decimal("150.00")])


class GroupBalanceSummary(BaseModel):
    group_id: str = Field(description="Group ID")
    currency: str = Field(description="Group currency", examples=["USD"])
    total_group_spending: Decimal = Field(description="Cumulative spending across all group expenses", examples=[Decimal("450.00")])
    total_settled: Decimal = Field(description="Total amount repaid through settlements", examples=[Decimal("150.00")])
    balances: List[UserBalanceDetail] = Field(description="Individual balance details for all members")
