from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class SettlementCreate(BaseModel):
    receiver_id: str = Field(..., description="ID of member receiving the repayment", examples=["c1f7b889-cf77-4b71-b0e2-d5cb0bca8085"])
    amount: Decimal = Field(..., gt=Decimal("0.00"), decimal_places=2, description="Settlement amount repaid", examples=[Decimal("50.00")])
    payment_method: Optional[str] = Field(default="CASH", max_length=50, description="Payment method used (e.g. CASH, UPI, VENMO, PAYPAL)", examples=["UPI"])
    reference_note: Optional[str] = Field(None, description="Optional payment reference or transaction note", examples=["UPI ref: 9876543210"])


class SettlementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(description="Settlement transaction ID")
    group_id: str = Field(description="Group ID")
    payer_id: str = Field(description="User ID of member who repaid")
    payer_name: Optional[str] = Field(None, description="Full name of payer", examples=["Bob Builder"])
    receiver_id: str = Field(description="User ID of member who received money")
    receiver_name: Optional[str] = Field(None, description="Full name of receiver", examples=["Alice Smith"])
    amount: Decimal = Field(description="Settled amount", examples=[Decimal("50.00")])
    payment_method: Optional[str] = Field(None, description="Payment method used", examples=["UPI"])
    reference_note: Optional[str] = Field(None, description="Payment reference note")
    created_at: datetime = Field(description="Timestamp when settlement was recorded")


class SuggestedSettlement(BaseModel):
    from_user_id: str = Field(description="Debtor user ID (who should pay)")
    from_user_name: str = Field(description="Debtor member name", examples=["Charlie Brown"])
    to_user_id: str = Field(description="Creditor user ID (who should receive payment)")
    to_user_name: str = Field(description="Creditor member name", examples=["Alice Smith"])
    to_payment_handle: Optional[str] = Field(None, description="Receiver's payment handle (UPI / PayPal) if configured", examples=["alice@upi"])
    amount: Decimal = Field(description="Optimized minimal settlement amount", examples=[Decimal("50.00")])


class DebtSimplificationResponse(BaseModel):
    group_id: str = Field(description="Group ID")
    currency: str = Field(description="Group currency", examples=["USD"])
    transaction_count: int = Field(description="Total number of simplified transactions needed to settle all debts", examples=[1])
    suggested_settlements: List[SuggestedSettlement] = Field(description="List of minimal suggested repayments computed via Greedy Min-Cash-Flow graph algorithm")
