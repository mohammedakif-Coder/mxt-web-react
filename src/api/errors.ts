import type { AxiosError } from "axios";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "NETWORK_ERROR"
  | "SERVER_ERROR"
  | "UNKNOWN_ERROR";

export class ApiError extends Error {
  code: ApiErrorCode;
  status?: number;
  details?: unknown;

  constructor(message: string, code: ApiErrorCode = "UNKNOWN_ERROR", status?: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

type ErrorPayload = {
  message?: string;
  error?: string;
  code?: ApiErrorCode;
  details?: unknown;
};

function codeFromStatus(status?: number): ApiErrorCode {
  if (!status) return "NETWORK_ERROR";
  if (status === 400) return "BAD_REQUEST";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 422) return "VALIDATION_ERROR";
  if (status >= 500) return "SERVER_ERROR";
  return "UNKNOWN_ERROR";
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  const axiosError = error as AxiosError<ErrorPayload>;
  if (axiosError?.isAxiosError) {
    const status = axiosError.response?.status;
    const payload = axiosError.response?.data;
    const message = payload?.message ?? payload?.error ?? axiosError.message ?? "Request failed";
    return new ApiError(message, payload?.code ?? codeFromStatus(status), status, payload?.details);
  }

  if (error instanceof Error) {
    return new ApiError(error.message);
  }

  return new ApiError("Something went wrong");
}

