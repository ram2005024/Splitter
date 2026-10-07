from app.core.exceptions import ConflictException, ForbiddenException, NotFoundException


class GroupNotFoundException(NotFoundException):
    def __init__(self, identifier: str = ""):
        message = f"Expense group '{identifier}' not found." if identifier else "Expense group not found."
        super().__init__(message=message, details={"identifier": identifier})


class NotGroupMemberException(ForbiddenException):
    def __init__(self, message: str = "You are not a member of this expense group."):
        super().__init__(message=message)


class AlreadyGroupMemberException(ConflictException):
    def __init__(self, message: str = "User is already a member of this group."):
        super().__init__(message=message)


class NotGroupAdminException(ForbiddenException):
    def __init__(self, message: str = "Only group admins can perform this action."):
        super().__init__(message=message)
