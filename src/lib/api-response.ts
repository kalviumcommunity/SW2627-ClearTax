import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import {
  completeApiRequest,
  logApiRequestFailure,
  type ApiRequestLogContext,
  type LogMetadata,
} from "@/lib/request-logging";

type ApiSuccess<T> = {
  success: true;
  data: T;
};

export const API_ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_REQUEST: "INVALID_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  INVALID_FILE: "INVALID_FILE",
  INVALID_FILE_TYPE: "INVALID_FILE_TYPE",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  INVALID_FILE_HEADERS: "INVALID_FILE_HEADERS",
  FILE_PARSE_ERROR: "FILE_PARSE_ERROR",
  REFERENCE_IMPORT_NOT_FOUND: "REFERENCE_IMPORT_NOT_FOUND",
  BATCH_NOT_FOUND: "BATCH_NOT_FOUND",
  INVALID_BATCH_STATE: "INVALID_BATCH_STATE",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ApiErrorCode =
  (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

type ApiErrorDetailValue =
  | string
  | number
  | boolean
  | null
  | readonly ApiErrorDetailValue[]
  | {
      readonly [key: string]: ApiErrorDetailValue;
    };

export type ApiErrorDetails =
  | {
      readonly [key: string]: ApiErrorDetailValue;
    }
  | readonly {
      readonly [key: string]: ApiErrorDetailValue;
    }[];

export type ApiErrorResponse = {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: ApiErrorDetails;
  };
};

export type JsonObject = Record<string, unknown>;

export type ValidationErrorDetails = Record<string, string[]>;

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ApiErrorCode,
    message: string,
    public readonly details?: ApiErrorDetails,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function successResponse<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiSuccess<T>>(
    {
      success: true,
      data,
    },
    init,
  );
}

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: ApiErrorDetails,
) {
  const body: ApiErrorResponse = {
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };

  return NextResponse.json<ApiErrorResponse>(body, { status });
}

export function apiErrorResponse(error: unknown) {
  if (isApiError(error)) {
    return apiError(
      error.statusCode,
      error.code,
      error.message,
      error.details,
    );
  }

  return apiError(
    500,
    API_ERROR_CODES.INTERNAL_ERROR,
    "An unexpected error occurred.",
  );
}

export function handleApiError(
  context: ApiRequestLogContext,
  error: unknown,
  metadata: LogMetadata = {},
) {
  if (!isApiError(error)) {
    logApiRequestFailure(context, error, metadata);
  }

  return completeApiRequest(context, apiErrorResponse(error), metadata);
}

export function validationErrorResponse(error: ZodError) {
  return apiError(
    400,
    API_ERROR_CODES.VALIDATION_ERROR,
    "The request contains invalid fields.",
    formatZodIssues(error),
  );
}

export function formatZodIssues(error: ZodError): ValidationErrorDetails {
  return error.issues.reduce<ValidationErrorDetails>((details, issue) => {
    const field = formatZodIssuePath(issue.path);
    details[field] = [...(details[field] ?? []), issue.message];

    return details;
  }, {});
}

export async function parseJsonObject(request: Request) {
  try {
    const body: unknown = await request.json();

    if (!isJsonObject(body)) {
      return {
        success: false,
        response: apiError(
          400,
          API_ERROR_CODES.INVALID_REQUEST,
          "Request body must be a JSON object.",
        ),
      } as const;
    }

    return {
      success: true,
      body,
    } as const;
  } catch {
    return {
      success: false,
      response: apiError(
        400,
        API_ERROR_CODES.INVALID_REQUEST,
        "Request body must contain valid JSON.",
      ),
    } as const;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

function formatZodIssuePath(path: PropertyKey[]) {
  return path.length > 0 ? path.map(String).join(".") : "request";
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
