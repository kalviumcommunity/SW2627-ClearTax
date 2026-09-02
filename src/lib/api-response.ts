import { NextResponse } from "next/server";
import type { ZodError } from "zod";

type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type JsonObject = Record<string, unknown>;

export type ValidationErrorDetails = Record<string, string[]>;

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
  code: string,
  message: string,
  details?: unknown,
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

export function validationErrorResponse(error: ZodError) {
  return apiError(
    400,
    "VALIDATION_ERROR",
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
          "INVALID_REQUEST",
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
        "INVALID_REQUEST",
        "Request body must contain valid JSON.",
      ),
    } as const;
  }
}

function formatZodIssuePath(path: PropertyKey[]) {
  return path.length > 0 ? path.map(String).join(".") : "request";
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
