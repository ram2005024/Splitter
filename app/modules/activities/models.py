from typing import TYPE_CHECKING, Optional
from sqlalchemy import JSON, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.modules.common.base_model import TimeStampedModel

if TYPE_CHECKING:
    from app.modules.groups.models import Group
    from app.modules.users.models import User


class ActivityLog(TimeStampedModel):
    __tablename__ = "activity_logs"

    group_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("groups.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Relationships
    group: Mapped["Group"] = relationship("Group", back_populates="activities")
    user: Mapped[Optional["User"]] = relationship("User", lazy="selectin")
