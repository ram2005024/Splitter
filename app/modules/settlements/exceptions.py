from app.core.exceptions import BadRequestException, NotFoundException


class SettlementNotFoundException(NotFoundException):
    def __init__(self, settlement_id: str):
        super().__init__(
            message=f"Settlement '{settlement_id}' not found.",
            details={"settlement_id": settlement_id},
        )


class SelfSettlementException(BadRequestException):
    def __init__(self, message: str = "You cannot record a settlement payment to yourself."):
        super().__init__(message=message)


class ReceiverNotMemberException(BadRequestException):
    def __init__(self, message: str = "Receiver is not a member of this group."):
        super().__init__(message=message)
