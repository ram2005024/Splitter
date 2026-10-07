from typing import Any, Generic, Optional, TypeVar
from pydantic import BaseModel, Field
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    success: bool = Field(default=True, description="Indicates if operation succeeded", examples=[True])
    message: str = Field(default="Operation completed successfully", description="Human-readable status message", examples=["Operation completed successfully"])
    data: Optional[T] = Field(default=None, description="Payload data returned by the endpoint")
    meta: Optional[dict[str, Any]] = Field(default=None, description="Optional pagination or contextual metadata", examples=[None])


class ErrorDetail(BaseModel):
    code: str = Field(description="Machine-readable error code", examples=["NOT_FOUND"])
    message: str = Field(description="Human-readable error explanation", examples=["The requested resource was not found."])
    details: Optional[Any] = Field(default=None, description="Additional context or validation failure breakdown")


class ErrorResponse(BaseModel):
    success: bool = Field(default=False, description="Always false for error responses", examples=[False])
    message: str = Field(description="Top-level error message", examples=["The requested resource was not found."])
    error: ErrorDetail = Field(description="Detailed error breakdown")


def success_response(
    data: Any = None,
    message: str = "Success",
    meta: Optional[dict[str, Any]] = None,
    status_code: int = 200,
) -> JSONResponse:
    content = {
        "success": True,
        "message": message,
        "data": data,
    }
    if meta is not None:
        content["meta"] = meta
    return JSONResponse(status_code=status_code, content=jsonable_encoder(content))


def error_response(
    message: str,
    error_code: str = "BAD_REQUEST",
    details: Optional[Any] = None,
    status_code: int = 400,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content=jsonable_encoder({
            "success": False,
            "message": message,
            "error": {
                "code": error_code,
                "message": message,
                "details": details,
            },
        }),
    )
