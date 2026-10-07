import enum
from datetime import datetime, timezone
from decimal import Decimal
from typing import TYPE_CHECKING, Optional
from sqlalchemy import DateTime, Enum as SQLEnum, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.modules.common.base_model import TimeStampedModel

if TYPE_CHECKING:
    from app.modules.users.models import User
    from app.modules.groups.models import Group


class SplitType(str, enum.Enum):
    EQUAL = "EQUAL"
    EXACT = "EXACT"
    PERCENTAGE = "PERCENTAGE"
    SHARES = "SHARES"


class ExpenseCategory(str, enum.Enum):
    FOOD_AND_DRINK = "FOOD_AND_DRINK"
    GROCERIES = "GROCERIES"
    TRANSPORTATION = "TRANSPORTATION"
    ENTERTAINMENT = "ENTERTAINMENT"
    ACCOMMODATION = "ACCOMMODATION"
    UTILITIES = "UTILITIES"
    SHOPPING = "SHOPPING"
    GENERAL = "GENERAL"


class Expense(TimeStampedModel):
    __tablename__ = "expenses"

    group_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("groups.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    payer_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="NPR", nullable=False)
    split_type: Mapped[SplitType] = mapped_column(
        SQLEnum(SplitType),
        default=SplitType.EQUAL,
        nullable=False,
    )
    category: Mapped[ExpenseCategory] = mapped_column(
        SQLEnum(ExpenseCategory),
        default=ExpenseCategory.GENERAL,
        nullable=False,
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    group: Mapped["Group"] = relationship("Group", back_populates="expenses")
    payer: Mapped["User"] = relationship("User", back_populates="expenses_paid", lazy="selectin")
    splits: Mapped[list["ExpenseSplit"]] = relationship(
        "ExpenseSplit",
        back_populates="expense",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class ExpenseSplit(TimeStampedModel):
    __tablename__ = "expense_splits"

    expense_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("expenses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    amount_owed: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    percentage: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2), nullable=True)
    shares: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Relationships
    expense: Mapped["Expense"] = relationship("Expense", back_populates="splits")
    user: Mapped["User"] = relationship("User", back_populates="splits", lazy="selectin")

    __table_args__ = (
        UniqueConstraint("expense_id", "user_id", name="uq_expense_user_split"),
    )
