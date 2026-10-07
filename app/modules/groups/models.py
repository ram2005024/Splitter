import enum
from typing import TYPE_CHECKING, Optional
from sqlalchemy import Enum as SQLEnum, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.modules.common.base_model import TimeStampedModel

if TYPE_CHECKING:
    from app.modules.users.models import User
    from app.modules.expenses.models import Expense
    from app.modules.settlements.models import Settlement
    from app.modules.activities.models import ActivityLog


class MemberRole(str, enum.Enum):
    ADMIN = "ADMIN"
    MEMBER = "MEMBER"


class GroupType(str, enum.Enum):
    TRIP = "TRIP"
    HOME = "HOME"
    COUPLE = "COUPLE"
    PROJECT = "PROJECT"
    OTHER = "OTHER"


class Group(TimeStampedModel):
    __tablename__ = "groups"

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    invite_code: Mapped[str] = mapped_column(String(16), unique=True, index=True, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="NPR", nullable=False)
    group_type: Mapped[GroupType] = mapped_column(
        SQLEnum(GroupType),
        default=GroupType.OTHER,
        nullable=False,
    )
    creator_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    members: Mapped[list["GroupMember"]] = relationship(
        "GroupMember",
        back_populates="group",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    expenses: Mapped[list["Expense"]] = relationship(
        "Expense",
        back_populates="group",
        cascade="all, delete-orphan",
    )
    settlements: Mapped[list["Settlement"]] = relationship(
        "Settlement",
        back_populates="group",
        cascade="all, delete-orphan",
    )
    activities: Mapped[list["ActivityLog"]] = relationship(
        "ActivityLog",
        back_populates="group",
        cascade="all, delete-orphan",
    )


class GroupMember(TimeStampedModel):
    __tablename__ = "group_members"

    group_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("groups.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role: Mapped[MemberRole] = mapped_column(
        SQLEnum(MemberRole),
        default=MemberRole.MEMBER,
        nullable=False,
    )

    # Relationships
    group: Mapped["Group"] = relationship("Group", back_populates="members")
    user: Mapped["User"] = relationship("User", back_populates="memberships", lazy="selectin")

    __table_args__ = (
        UniqueConstraint("group_id", "user_id", name="uq_group_member"),
    )
