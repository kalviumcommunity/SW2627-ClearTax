import { NextResponse } from "next/server";
import type { ZodError } from "zod";

type ApiSuccess<T> = {
  success: true;
  data: T;
};

type ApiError = {
  success: false;
  error: {
    code?: string;
    message: string;
    details?: ValidationErrorDetail[];
  };
};

export type JsonObject = Record<string, unknown>;

export type ValidationErrorDetail = {
  field: string;
  message: string;
};

export function successResponse<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiSuccess<T>>(
    {
      success: true,
      data,
    },
    init,
  );
}

export function errorResponse(message: string, status: number) {
  return NextResponse.json<ApiError>(
    {
      success: false,
      error: {
        message,
      },
    },
    {
      status,
    },
  );
}

export function validationErrorResponse(error: ZodError) {
  return NextResponse.json<ApiError>(
    {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: formatZodIssues(error),
      },
    },
    {
      status: 400,
    },
  );
}

export function formatZodIssues(error: ZodError): ValidationErrorDetail[] {
  return error.issues.map((issue) => ({
    field: formatZodIssuePath(issue.path),
    message: issue.message,
  }));
}

export async function parseJsonObject(request: Request) {
  try {
    const body: unknown = await request.json();

    if (!isJsonObject(body)) {
      return {
        success: false,
        response: errorResponse("Request body must be a JSON object.", 400),
      } as const;
    }

    return {
      success: true,
      body,
    } as const;
  } catch {
    return {
      success: false,
      response: errorResponse("Request body must contain valid JSON.", 400),
    } as const;
  }
}

function formatZodIssuePath(path: PropertyKey[]) {
  return path.length > 0 ? path.map(String).join(".") : "request";
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
