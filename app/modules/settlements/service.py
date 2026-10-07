from decimal import Decimal
from typing import Dict, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.groups.exceptions import GroupNotFoundException, NotGroupMemberException
from app.modules.groups.repo import GroupMemberRepository, GroupRepository
from app.modules.settlements.exceptions import (
    ReceiverNotMemberException,
    SelfSettlementException,
)
from app.modules.settlements.models import Settlement
from app.modules.settlements.repo import SettlementRepository
from app.modules.settlements.schemas import (
    DebtSimplificationResponse,
    SettlementCreate,
    SettlementResponse,
    SuggestedSettlement,
)
from app.workers.tasks import send_settlement_notification


class SettlementService:
    def __init__(
        self,
        session: AsyncSession,
        settlement_repo: SettlementRepository,
        expense_repo,
        group_repo: GroupRepository,
        member_repo: GroupMemberRepository,
        activity_repo=None,
    ):
        self.session = session
        self.settlement_repo = settlement_repo
        self.expense_repo = expense_repo
        self.group_repo = group_repo
        self.member_repo = member_repo
        self.activity_repo = activity_repo

    async def record_settlement(
        self,
        current_user_id: str,
        group_id: str,
        req: SettlementCreate,
    ) -> Settlement:
        is_member = await self.member_repo.is_member(group_id, current_user_id)
        if not is_member:
            raise NotGroupMemberException()

        group = await self.group_repo.get_by_id(group_id)
        if not group:
            raise GroupNotFoundException(group_id)

        is_receiver_member = await self.member_repo.is_member(group_id, req.receiver_id)
        if not is_receiver_member:
            raise ReceiverNotMemberException()

        if req.receiver_id == current_user_id:
            raise SelfSettlementException()

        settlement = Settlement(
            group_id=group_id,
            payer_id=current_user_id,
            receiver_id=req.receiver_id,
            amount=req.amount,
            payment_method=req.payment_method or "CASH",
            reference_note=req.reference_note,
        )
        self.session.add(settlement)
        await self.session.flush()

        if self.activity_repo:
            await self.activity_repo.log_activity(
                group_id=group_id,
                user_id=current_user_id,
                action="SETTLEMENT_RECORDED",
                details={
                    "payer_id": current_user_id,
                    "receiver_id": req.receiver_id,
                    "amount": str(settlement.amount),
                    "payment_method": settlement.payment_method,
                },
            )

        await self.session.commit()

        try:
            members = await self.member_repo.get_group_members(group_id)
            payer_member = next((m for m in members if m.user_id == current_user_id), None)
            receiver_member = next((m for m in members if m.user_id == req.receiver_id), None)

            payer_name = (
                payer_member.user.full_name
                if (payer_member and payer_member.user and payer_member.user.full_name)
                else "A member"
            )
            receiver_name = (
                receiver_member.user.full_name
                if (receiver_member and receiver_member.user and receiver_member.user.full_name)
                else "A member"
            )
            recipient_email = (
                receiver_member.user.email
                if (receiver_member and receiver_member.user and receiver_member.user.email)
                else ""
            )

            if recipient_email:
                send_settlement_notification.delay(
                    group_name=group.name,
                    payer_name=payer_name,
                    receiver_name=receiver_name,
                    amount=float(settlement.amount),
                    recipient_email=recipient_email,
                )
        except Exception:
            pass

        return settlement

    async def get_group_settlements(
        self,
        group_id: str,
        user_id: str,
        skip: int = 0,
        limit: int = 50,
    ) -> List[SettlementResponse]:
        is_member = await self.member_repo.is_member(group_id, user_id)
        if not is_member:
            raise NotGroupMemberException()

        settlements = await self.settlement_repo.get_by_group(group_id, skip=skip, limit=limit)
        response_list: List[SettlementResponse] = []
        for s in settlements:
            response_list.append(
                SettlementResponse(
                    id=s.id,
                    group_id=s.group_id,
                    payer_id=s.payer_id,
                    payer_name=s.payer.full_name if s.payer else "Unknown",
                    receiver_id=s.receiver_id,
                    receiver_name=s.receiver.full_name if s.receiver else "Unknown",
                    amount=s.amount,
                    payment_method=s.payment_method,
                    reference_note=s.reference_note,
                    created_at=s.created_at,
                )
            )
        return response_list

    async def simplify_debts(self, group_id: str, user_id: str) -> DebtSimplificationResponse:
        is_member = await self.member_repo.is_member(group_id, user_id)
        if not is_member:
            raise NotGroupMemberException()

        group = await self.group_repo.get_by_id(group_id)
        if not group:
            raise GroupNotFoundException(group_id)

        members = await self.member_repo.get_group_members(group_id)
        expenses = await self.expense_repo.get_all_group_expenses(group_id) if self.expense_repo else []
        settlements = await self.settlement_repo.get_all_group_settlements(group_id)

        net_balance: Dict[str, Decimal] = {m.user_id: Decimal("0.00") for m in members}
        user_info: Dict[str, Tuple[str, str | None]] = {
            m.user_id: (
                m.user.full_name if m.user else "Unknown",
                m.user.profile.payment_handle if (m.user and m.user.profile) else None,
            )
            for m in members
        }

        for e in expenses:
            net_balance[e.payer_id] = net_balance.get(e.payer_id, Decimal("0.00")) + e.amount
            for s in e.splits:
                net_balance[s.user_id] = net_balance.get(s.user_id, Decimal("0.00")) - s.amount_owed

        for st in settlements:
            net_balance[st.payer_id] = net_balance.get(st.payer_id, Decimal("0.00")) + st.amount
            net_balance[st.receiver_id] = net_balance.get(st.receiver_id, Decimal("0.00")) - st.amount

        debtors: List[List[object]] = []
        creditors: List[List[object]] = []
        threshold = Decimal("0.01")

        for uid, balance in net_balance.items():
            if balance < -threshold:
                debtors.append([uid, -balance])
            elif balance > threshold:
                creditors.append([uid, balance])

        suggested: List[SuggestedSettlement] = []

        while debtors and creditors:
            debtors.sort(key=lambda x: x[1], reverse=True)
            creditors.sort(key=lambda x: x[1], reverse=True)

            debtor = debtors[0]
            creditor = creditors[0]

            debtor_id = debtor[0]
            creditor_id = creditor[0]
            debtor_amt = debtor[1]
            creditor_amt = creditor[1]

            settle_amount = min(debtor_amt, creditor_amt)
            payer_name, _ = user_info.get(debtor_id, ("Unknown", None))
            receiver_name, payment_handle = user_info.get(creditor_id, ("Unknown", None))

            suggested.append(
                SuggestedSettlement(
                    from_user_id=debtor_id,
                    from_user_name=payer_name,
                    to_user_id=creditor_id,
                    to_user_name=receiver_name,
                    to_payment_handle=payment_handle,
                    amount=settle_amount.quantize(Decimal("0.01")),
                )
            )

            debtor[1] -= settle_amount
            creditor[1] -= settle_amount

            if debtor[1] <= threshold:
                debtors.pop(0)
            if creditor[1] <= threshold:
                creditors.pop(0)

        return DebtSimplificationResponse(
            group_id=group_id,
            currency=group.currency,
            transaction_count=len(suggested),
            suggested_settlements=suggested,
        )
