import "server-only";

import type { AppLogger } from "@/lib/logger";
import { logger } from "@/lib/logger";

export const REQUEST_ID_HEADER = "x-request-id";

const MAX_REQUEST_ID_LENGTH = 128;

export type ApiRequestLogContext = {
  requestId: string;
  route: string;
  method: string;
  startedAt: number;
  logger: AppLogger;
};

type LogMetadata = Record<string, string | number | boolean | null | undefined>;

export function createApiRequestLogContext(
  request: Request,
  route: string,
): ApiRequestLogContext {
  const requestId = getRequestId(request);
  const method = request.method;
  const requestLogger = logger.child({
    requestId,
    route,
    method,
  });

  requestLogger.info(
    {
      event: "api.request.started",
    },
    "API request started",
  );

  return {
    requestId,
    route,
    method,
    startedAt: performance.now(),
    logger: requestLogger,
  };
}

export function completeApiRequest(
  context: ApiRequestLogContext,
  response: Response,
  metadata: LogMetadata = {},
) {
  response.headers.set(REQUEST_ID_HEADER, context.requestId);
  context.logger.info(
    {
      event: "api.request.completed",
      statusCode: response.status,
      durationMs: getDurationMs(context),
      ...metadata,
    },
    "API request completed",
  );

  return response;
}

export function logApiRequestFailure(
  context: ApiRequestLogContext,
  error: unknown,
  metadata: LogMetadata = {},
) {
  context.logger.error(
    {
      event: "api.request.failed",
      statusCode: 500,
      durationMs: getDurationMs(context),
      err: error,
      ...metadata,
    },
    "API request failed",
  );
}

export function logUnauthorizedRequest(context: ApiRequestLogContext) {
  context.logger.warn(
    {
      event: "auth.unauthorized_request",
      statusCode: 401,
    },
    "Unauthorized API request",
  );
}

export function logUploadValidationFailed(
  requestLogger: AppLogger,
  metadata: LogMetadata,
) {
  requestLogger.warn(
    {
      event: "upload.validation_failed",
      ...metadata,
    },
    "Upload validation failed",
  );
}

function getRequestId(request: Request) {
  const incomingRequestId = request.headers.get(REQUEST_ID_HEADER)?.trim();

  if (
    incomingRequestId &&
    incomingRequestId.length <= MAX_REQUEST_ID_LENGTH &&
    isSafeRequestId(incomingRequestId)
  ) {
    return incomingRequestId;
  }

  return crypto.randomUUID();
}

function isSafeRequestId(value: string) {
  return /^[A-Za-z0-9._:/=-]+$/.test(value);
}

function getDurationMs(context: ApiRequestLogContext) {
  return Math.round(performance.now() - context.startedAt);
}
