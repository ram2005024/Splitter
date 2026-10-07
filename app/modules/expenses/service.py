from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.expenses.exceptions import (
    ExpenseNotFoundException,
    InvalidSplitException,
    ParticipantNotMemberException,
    PayerNotMemberException,
)
from app.modules.expenses.models import Expense, ExpenseSplit, SplitType
from app.modules.expenses.repo import ExpenseRepository, ExpenseSplitRepository
from app.modules.expenses.schemas import (
    ExpenseCreate,
    ExpenseResponse,
    ExpenseSplitResponse,
    GroupBalanceSummary,
    SplitParticipantInput,
    UserBalanceDetail,
)
from app.modules.groups.exceptions import GroupNotFoundException, NotGroupMemberException
from app.modules.groups.repo import GroupMemberRepository, GroupRepository
from app.workers.tasks import send_expense_notification


class ExpenseService:
    def __init__(
        self,
        session: AsyncSession,
        expense_repo: ExpenseRepository,
        split_repo: ExpenseSplitRepository,
        group_repo: GroupRepository,
        member_repo: GroupMemberRepository,
        settlement_repo=None,
        activity_repo=None,
    ):
        self.session = session
        self.expense_repo = expense_repo
        self.split_repo = split_repo
        self.group_repo = group_repo
        self.member_repo = member_repo
        self.settlement_repo = settlement_repo
        self.activity_repo = activity_repo

    def _calculate_splits(
        self,
        split_type: SplitType,
        total_amount: Decimal,
        participants: List[str],
        splits_input: Optional[List[SplitParticipantInput]],
    ) -> List[Dict]:
        num_participants = len(participants)
        if num_participants == 0:
            raise InvalidSplitException("At least one participant must be included in the split.")

        calculated_splits: List[Dict] = []
        cent = Decimal("0.01")

        if split_type == SplitType.EQUAL:
            base_amount = (total_amount / Decimal(num_participants)).quantize(cent, rounding=ROUND_HALF_UP)
            current_sum = base_amount * Decimal(num_participants)
            difference = total_amount - current_sum

            for i, user_id in enumerate(participants):
                amount = base_amount
                if difference > 0:
                    amount += cent
                    difference -= cent
                elif difference < 0:
                    amount -= cent
                    difference += cent

                calculated_splits.append({
                    "user_id": user_id,
                    "amount_owed": amount,
                    "percentage": (Decimal(100) / Decimal(num_participants)).quantize(cent),
                    "shares": 1,
                })

        elif split_type == SplitType.EXACT:
            if not splits_input:
                raise InvalidSplitException("Splits with exact amounts must be provided.")
            
            sum_exact = Decimal("0.00")
            for item in splits_input:
                if item.amount_owed is None or item.amount_owed < Decimal("0.00"):
                    raise InvalidSplitException(f"Amount owed missing or negative for user {item.user_id}")
                sum_exact += item.amount_owed
                calculated_splits.append({
                    "user_id": item.user_id,
                    "amount_owed": item.amount_owed,
                    "percentage": (item.amount_owed / total_amount * Decimal(100)).quantize(cent),
                    "shares": None,
                })

            if sum_exact != total_amount:
                raise InvalidSplitException(
                    f"Sum of exact splits (${sum_exact:.2f}) does not match expense amount (${total_amount:.2f})."
                )

        elif split_type == SplitType.PERCENTAGE:
            if not splits_input:
                raise InvalidSplitException("Splits with percentages must be provided.")

            sum_percentage = Decimal("0.00")
            for item in splits_input:
                if item.percentage is None or item.percentage < Decimal("0.00"):
                    raise InvalidSplitException(f"Percentage missing or negative for user {item.user_id}")
                sum_percentage += item.percentage

            if sum_percentage != Decimal("100.00"):
                raise InvalidSplitException(
                    f"Sum of percentages ({sum_percentage}%) must equal 100.00%."
                )

            current_sum = Decimal("0.00")
            for item in splits_input:
                pct_amount = ((item.percentage / Decimal(100)) * total_amount).quantize(cent, rounding=ROUND_HALF_UP)
                current_sum += pct_amount
                calculated_splits.append({
                    "user_id": item.user_id,
                    "amount_owed": pct_amount,
                    "percentage": item.percentage,
                    "shares": None,
                })

            diff = total_amount - current_sum
            if diff != Decimal("0.00") and calculated_splits:
                calculated_splits[0]["amount_owed"] += diff

        elif split_type == SplitType.SHARES:
            if not splits_input:
                raise InvalidSplitException("Splits with shares must be provided.")

            total_shares = sum(item.shares or 0 for item in splits_input)
            if total_shares <= 0:
                raise InvalidSplitException("Total shares must be greater than 0.")

            current_sum = Decimal("0.00")
            for item in splits_input:
                shares = item.shares or 1
                share_amount = ((Decimal(shares) / Decimal(total_shares)) * total_amount).quantize(
                    cent, rounding=ROUND_HALF_UP
                )
                current_sum += share_amount
                calculated_splits.append({
                    "user_id": item.user_id,
                    "amount_owed": share_amount,
                    "percentage": ((Decimal(shares) / Decimal(total_shares)) * Decimal(100)).quantize(cent),
                    "shares": shares,
                })

            diff = total_amount - current_sum
            if diff != Decimal("0.00") and calculated_splits:
                calculated_splits[0]["amount_owed"] += diff

        return calculated_splits

    async def create_expense(
        self,
        current_user_id: str,
        group_id: str,
        req: ExpenseCreate,
    ) -> Expense:
        is_member = await self.member_repo.is_member(group_id, current_user_id)
        if not is_member:
            raise NotGroupMemberException()

        group = await self.group_repo.get_by_id(group_id)
        if not group:
            raise GroupNotFoundException(group_id)

        payer_id = req.payer_id if req.payer_id else current_user_id
        is_payer_member = await self.member_repo.is_member(group_id, payer_id)
        if not is_payer_member:
            raise PayerNotMemberException()

        group_members = await self.member_repo.get_group_members(group_id)
        group_member_ids = {m.user_id for m in group_members}

        if req.splits and len(req.splits) > 0:
            participant_ids = [item.user_id for item in req.splits]
        else:
            participant_ids = list(group_member_ids)

        for pid in participant_ids:
            if pid not in group_member_ids:
                raise ParticipantNotMemberException(pid)

        split_data_list = self._calculate_splits(
            split_type=req.split_type,
            total_amount=req.amount,
            participants=participant_ids,
            splits_input=req.splits,
        )

        expense = Expense(
            group_id=group_id,
            payer_id=payer_id,
            title=req.title.strip(),
            amount=req.amount,
            currency=req.currency.upper(),
            split_type=req.split_type,
            category=req.category,
            notes=req.notes,
            date=req.date or datetime.now(timezone.utc),
        )
        self.session.add(expense)
        await self.session.flush()

        for split_info in split_data_list:
            split_record = ExpenseSplit(
                expense_id=expense.id,
                user_id=split_info["user_id"],
                amount_owed=split_info["amount_owed"],
                percentage=split_info.get("percentage"),
                shares=split_info.get("shares"),
            )
            self.session.add(split_record)

        if self.activity_repo:
            await self.activity_repo.log_activity(
                group_id=group_id,
                user_id=current_user_id,
                action="EXPENSE_ADDED",
                details={
                    "expense_id": expense.id,
                    "title": expense.title,
                    "amount": str(expense.amount),
                    "split_type": expense.split_type.value,
                },
            )

        await self.session.commit()

        try:
            payer_member = next((m for m in group_members if m.user_id == payer_id), None)
            payer_name = (
                payer_member.user.full_name
                if (payer_member and payer_member.user and payer_member.user.full_name)
                else "A member"
            )
            recipient_emails = [
                m.user.email for m in group_members if m.user and m.user.email and m.user.id != current_user_id
            ]
            if recipient_emails:
                send_expense_notification.delay(
                    group_name=group.name,
                    expense_title=expense.title,
                    amount=float(expense.amount),
                    payer_name=payer_name,
                    recipient_emails=recipient_emails,
                )
        except Exception:
            pass

        full_expense = await self.expense_repo.get_by_id_with_details(expense.id)
        return full_expense or expense

    async def get_group_expenses(
        self,
        group_id: str,
        user_id: str,
        skip: int = 0,
        limit: int = 50,
    ) -> List[ExpenseResponse]:
        is_member = await self.member_repo.is_member(group_id, user_id)
        if not is_member:
            raise NotGroupMemberException()

        expenses = await self.expense_repo.get_by_group(group_id, skip=skip, limit=limit)
        response_list: List[ExpenseResponse] = []

        for e in expenses:
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
                for s in e.splits
            ]
            response_list.append(
                ExpenseResponse(
                    id=e.id,
                    group_id=e.group_id,
                    payer_id=e.payer_id,
                    payer_name=e.payer.full_name if e.payer else "Unknown",
                    title=e.title,
                    amount=e.amount,
                    currency=e.currency,
                    split_type=e.split_type,
                    category=e.category,
                    notes=e.notes,
                    date=e.date,
                    created_at=e.created_at,
                    splits=splits_resp,
                )
            )
        return response_list

    async def get_expense_by_id(self, group_id: str, expense_id: str, user_id: str) -> ExpenseResponse:
        is_member = await self.member_repo.is_member(group_id, user_id)
        if not is_member:
            raise NotGroupMemberException()

        expense = await self.expense_repo.get_by_id_with_details(expense_id)
        if not expense or expense.group_id != group_id:
            raise ExpenseNotFoundException(expense_id)

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
        return ExpenseResponse(
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

    async def delete_expense(self, group_id: str, expense_id: str, user_id: str) -> None:
        is_member = await self.member_repo.is_member(group_id, user_id)
        if not is_member:
            raise NotGroupMemberException()

        expense = await self.expense_repo.get_by_id(expense_id)
        if not expense or expense.group_id != group_id:
            raise ExpenseNotFoundException(expense_id)

        is_admin = await self.member_repo.is_admin(group_id, user_id)
        if expense.payer_id != user_id and not is_admin:
            from app.core.exceptions import ForbiddenException
            raise ForbiddenException("Only the expense payer or a group admin can delete this expense.")

        await self.expense_repo.delete(expense)
        if self.activity_repo:
            await self.activity_repo.log_activity(
                group_id=group_id,
                user_id=user_id,
                action="EXPENSE_DELETED",
                details={"expense_id": expense_id, "title": expense.title, "amount": str(expense.amount)},
            )
        await self.session.commit()

    async def get_group_balances(self, group_id: str, user_id: str) -> GroupBalanceSummary:
        is_member = await self.member_repo.is_member(group_id, user_id)
        if not is_member:
            raise NotGroupMemberException()

        group = await self.group_repo.get_by_id(group_id)
        if not group:
            raise GroupNotFoundException(group_id)

        members = await self.member_repo.get_group_members(group_id)
        expenses = await self.expense_repo.get_all_group_expenses(group_id)
        settlements = await self.settlement_repo.get_all_group_settlements(group_id) if self.settlement_repo else []

        paid_map: Dict[str, Decimal] = {m.user_id: Decimal("0.00") for m in members}
        owed_map: Dict[str, Decimal] = {m.user_id: Decimal("0.00") for m in members}
        user_info_map: Dict[str, tuple[str, str]] = {
            m.user_id: (m.user.full_name if m.user else "Unknown", m.user.email if m.user else "")
            for m in members
        }

        total_expenses = Decimal("0.00")
        for e in expenses:
            total_expenses += e.amount
            paid_map[e.payer_id] = paid_map.get(e.payer_id, Decimal("0.00")) + e.amount

            for s in e.splits:
                owed_map[s.user_id] = owed_map.get(s.user_id, Decimal("0.00")) + s.amount_owed

        total_settled = Decimal("0.00")
        for st in settlements:
            total_settled += st.amount
            paid_map[st.payer_id] = paid_map.get(st.payer_id, Decimal("0.00")) + st.amount
            owed_map[st.receiver_id] = owed_map.get(st.receiver_id, Decimal("0.00")) + st.amount

        balances: List[UserBalanceDetail] = []
        for uid in paid_map.keys():
            t_paid = paid_map.get(uid, Decimal("0.00"))
            t_owed = owed_map.get(uid, Decimal("0.00"))
            net = t_paid - t_owed
            name, email = user_info_map.get(uid, ("Unknown", ""))
            balances.append(
                UserBalanceDetail(
                    user_id=uid,
                    user_name=name,
                    email=email,
                    total_paid=t_paid,
                    total_owed=t_owed,
                    net_balance=net,
                )
            )

        return GroupBalanceSummary(
            group_id=group_id,
            currency=group.currency,
            total_group_spending=total_expenses,
            total_settled=total_settled,
            balances=balances,
        )
