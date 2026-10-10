from typing import Any

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.responses import error_response


class AppException(Exception):
    def __init__(
        self,
        message: str,
        error_code: str = "INTERNAL_SERVER_ERROR",
        status_code: int = 500,
        details: Any | None = None,
    ):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details


class NotFoundException(AppException):
    def __init__(self, message: str = "Resource not found", details: Any | None = None):
        super().__init__(
            message=message, error_code="NOT_FOUND", status_code=404, details=details
        )


class ConflictException(AppException):
    def __init__(
        self, message: str = "Resource already exists", details: Any | None = None
    ):
        super().__init__(
            message=message, error_code="CONFLICT", status_code=409, details=details
        )


class AuthenticationException(AppException):
    def __init__(
        self, message: str = "Authentication failed", details: Any | None = None
    ):
        super().__init__(
            message=message,
            error_code="AUTHENTICATION_FAILED",
            status_code=401,
            details=details,
        )


class ForbiddenException(AppException):
    def __init__(self, message: str = "Permission denied", details: Any | None = None):
        super().__init__(
            message=message, error_code="FORBIDDEN", status_code=403, details=details
        )


class ValidationException(AppException):
    def __init__(self, message: str = "Validation failed", details: Any | None = None):
        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            status_code=422,
            details=details,
        )


class RateLimitException(AppException):
    def __init__(
        self,
        message: str = "Too many requests. Please try again later.",
        details: Any | None = None,
    ):
        super().__init__(
            message=message,
            error_code="RATE_LIMIT_EXCEEDED",
            status_code=429,
            details=details,
        )


class BadRequestException(AppException):
    def __init__(self, message: str = "Bad request", details: Any | None = None):
        super().__init__(
            message=message, error_code="BAD_REQUEST", status_code=400, details=details
        )


async def app_exception_handler(request: Request, exc: AppException):
    return error_response(
        message=exc.message,
        error_code=exc.error_code,
        details=exc.details,
        status_code=exc.status_code,
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    code_map = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        405: "METHOD_NOT_ALLOWED",
        409: "CONFLICT",
        422: "UNPROCESSABLE_ENTITY",
        429: "TOO_MANY_REQUESTS",
        500: "INTERNAL_SERVER_ERROR",
    }
    error_code = code_map.get(exc.status_code, "HTTP_ERROR")
    return error_response(
        message=str(exc.detail),
        error_code=error_code,
        status_code=exc.status_code,
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        field = ".".join(str(loc) for loc in err["loc"] if loc != "body")
        errors.append(
            {
                "field": field or "root",
                "message": err["msg"],
                "type": err["type"],
            }
        )
    return error_response(
        message="Request validation error",
        error_code="VALIDATION_ERROR",
        details=errors,
        status_code=422,
    )


async def generic_exception_handler(request: Request, exc: Exception):
    return error_response(
        message="An unexpected server error occurred.",
        error_code="INTERNAL_SERVER_ERROR",
        details=str(exc) if getattr(request.app.state, "debug", False) else None,
        status_code=500,
    )
