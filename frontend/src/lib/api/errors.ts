import axios, { AxiosError } from "axios";
import { ErrorResponse } from "@/types/api";

export interface NormalizedError {
  code: string;
  message: string;
  status: number;
  fieldErrors?: Record<string, string>;
  raw?: unknown;
}

export function normalizeApiError(error: unknown): NormalizedError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ErrorResponse | Record<string, unknown>>;
    const status = axiosError.response?.status || 0;
    const data = axiosError.response?.data;

    // Backend formatted error response: { success: false, message: "...", error: { code, message, details } }
    if (data && typeof data === "object" && "error" in data) {
      const errObj = (data as ErrorResponse).error;
      const fieldErrors: Record<string, string> = {};

      if (errObj.details && typeof errObj.details === "object") {
        for (const [key, val] of Object.entries(errObj.details as Record<string, unknown>)) {
          fieldErrors[key] = String(val);
        }
      }

      return {
        code: String(errObj.code || `HTTP_${status}`),
        message: String(errObj.message || (data as any)?.message || "An error occurred with the request."),
        status,
        fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
        raw: data,
      };
    }

    // FastAPI default validation error format: { detail: [ { loc, msg, type } ] }
    if (data && typeof data === "object" && "detail" in data) {
      const detail = (data as { detail: unknown }).detail;
      if (Array.isArray(detail)) {
        const fieldErrors: Record<string, string> = {};
        const messages: string[] = [];

        detail.forEach((item: any) => {
          if (item && typeof item === "object") {
            const field = Array.isArray(item.loc) ? String(item.loc[item.loc.length - 1]) : "field";
            const msg = String(item.msg || "Invalid value");
            fieldErrors[field] = msg;
            messages.push(`${field}: ${msg}`);
          }
        });

        return {
          code: "VALIDATION_ERROR",
          message: messages.join(", ") || "Validation failed.",
          status,
          fieldErrors,
          raw: data,
        };
      } else if (typeof detail === "string") {
        return {
          code: `HTTP_${status}`,
          message: detail,
          status,
          raw: data,
        };
      }
    }

    if (data && typeof data === "object" && "message" in data) {
      return {
        code: `HTTP_${status}`,
        message: String((data as { message: unknown }).message),
        status,
        raw: data,
      };
    }

    if (axiosError.code === "ECONNABORTED") {
      return {
        code: "TIMEOUT",
        message: "Request timed out. Please try again.",
        status: 408,
        raw: axiosError,
      };
    }

    if (!axiosError.response) {
      return {
        code: "NETWORK_ERROR",
        message: "Unable to reach the server. Please check your network connection.",
        status: 0,
        raw: axiosError,
      };
    }

    return {
      code: `HTTP_${status}`,
      message: axiosError.message || `Request failed with status ${status}`,
      status,
      raw: data,
    };
  }

  if (error instanceof Error) {
    return {
      code: "CLIENT_ERROR",
      message: error.message,
      status: 0,
      raw: error,
    };
  }

  return {
    code: "UNKNOWN_ERROR",
    message: "An unexpected error occurred.",
    status: 0,
    raw: error,
  };
}
