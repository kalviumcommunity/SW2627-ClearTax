import { NextResponse } from "next/server";

type ApiSuccess<T> = {
  success: true;
  data: T;
};

type ApiError = {
  success: false;
  error: {
    message: string;
  };
};

export type JsonObject = Record<string, unknown>;

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

export function getRequiredString(body: JsonObject, field: string) {
  const value = body[field];

  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
}

export function getOptionalString(body: JsonObject, field: string) {
  const value = body[field];

  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
