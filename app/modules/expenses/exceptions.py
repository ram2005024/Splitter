from app.core.exceptions import BadRequestException, NotFoundException, ValidationException


class ExpenseNotFoundException(NotFoundException):
    def __init__(self, expense_id: str):
        super().__init__(
            message=f"Expense '{expense_id}' not found.",
            details={"expense_id": expense_id},
        )


class InvalidSplitException(ValidationException):
    def __init__(self, message: str):
        super().__init__(message=message)


class PayerNotMemberException(BadRequestException):
    def __init__(self, message: str = "Payer must be an active member of this group."):
        super().__init__(message=message)


class ParticipantNotMemberException(BadRequestException):
    def __init__(self, user_id: str):
        super().__init__(
            message=f"Participant '{user_id}' is not a member of this group.",
            details={"user_id": user_id},
        )
