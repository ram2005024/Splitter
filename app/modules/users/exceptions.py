from app.core.exceptions import NotFoundException


class UserNotFoundException(NotFoundException):
    def __init__(self, identifier: str = ""):
        message = f"User '{identifier}' not found." if identifier else "User not found."
        super().__init__(message=message, details={"identifier": identifier})


class UserProfileNotFoundException(NotFoundException):
    def __init__(self, user_id: str):
        super().__init__(
            message=f"User profile for user '{user_id}' not found.",
            details={"user_id": user_id},
        )
