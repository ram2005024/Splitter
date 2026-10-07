from typing import TYPE_CHECKING, Optional
from sqlalchemy import Boolean, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.modules.common.base_model import TimeStampedModel

if TYPE_CHECKING:
    from app.modules.groups.models import GroupMember
    from app.modules.expenses.models import Expense, ExpenseSplit


class User(TimeStampedModel):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    profile: Mapped["UserProfile"] = relationship(
        "UserProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    memberships: Mapped[list["GroupMember"]] = relationship(
        "GroupMember",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    expenses_paid: Mapped[list["Expense"]] = relationship(
        "Expense",
        back_populates="payer",
    )
    splits: Mapped[list["ExpenseSplit"]] = relationship(
        "ExpenseSplit",
        back_populates="user",
    )

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()


class UserProfile(TimeStampedModel):
    __tablename__ = "user_profiles"

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    phone_number: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    default_currency: Mapped[str] = mapped_column(String(10), default="NPR", nullable=False)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    payment_handle: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    notification_settings: Mapped[Optional[dict]] = mapped_column(
        JSON,
        default=lambda: {"email_on_expense": True, "email_on_settlement": True},
        nullable=True,
    )

    # Relationship
    user: Mapped["User"] = relationship("User", back_populates="profile")
