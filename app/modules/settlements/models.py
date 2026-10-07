from typing import TYPE_CHECKING, Optional
from decimal import Decimal
from sqlalchemy import ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.modules.common.base_model import TimeStampedModel

if TYPE_CHECKING:
    from app.modules.users.models import User
    from app.modules.groups.models import Group


class Settlement(TimeStampedModel):
    __tablename__ = "settlements"

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
    receiver_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    payment_method: Mapped[Optional[str]] = mapped_column(String(50), default="CASH", nullable=True)
    reference_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    group: Mapped["Group"] = relationship("Group", back_populates="settlements")
    payer: Mapped["User"] = relationship("User", foreign_keys=[payer_id], lazy="selectin")
    receiver: Mapped["User"] = relationship("User", foreign_keys=[receiver_id], lazy="selectin")
