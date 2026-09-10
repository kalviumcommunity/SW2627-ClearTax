import {
  API_ERROR_CODES,
  apiError,
  handleApiError,
  successResponse,
  validationErrorResponse,
} from "@/lib/api-response";
import { requireApiUser } from "@/lib/api-auth";
import { getPrismaClient } from "@/lib/prisma";
import {
  completeApiRequest,
  createApiRequestLogContext,
  logUnauthorizedRequest,
} from "@/lib/request-logging";
import { batchRouteParamsSchema } from "@/lib/validation/reconciliation";

type BatchStatusRouteContext = {
  params: Promise<{
    batchId: string;
  }>;
};

export const dynamic = "force-dynamic";

const batchStatusSelect = {
  id: true,
  status: true,
  totalRows: true,
  processedRows: true,
  matchedRows: true,
  mismatchedRows: true,
  errorRows: true,
  fileErrorMessage: true,
  updatedAt: true,
  startedAt: true,
  completedAt: true,
} as const;

export async function GET(
  request: Request,
  { params }: BatchStatusRouteContext,
) {
  const requestContext = createApiRequestLogContext(
    request,
    "/api/reconciliation-batches/[batchId]/status",
  );
  const authResult = await requireApiUser();

  if (!authResult.success) {
    logUnauthorizedRequest(requestContext);
    return completeApiRequest(requestContext, authResult.response);
  }

  const validationResult = batchRouteParamsSchema.safeParse(await params);

  if (!validationResult.success) {
    return completeApiRequest(
      requestContext,
      validationErrorResponse(validationResult.error),
    );
  }

  const { batchId } = validationResult.data;

  try {
    const prisma = getPrismaClient();

    const batchStatus = await prisma.uploadBatch.findFirst({
      where: {
        id: batchId,
        businessId: authResult.auth.businessId,
      },
      select: batchStatusSelect,
    });

    if (!batchStatus) {
      return completeApiRequest(
        requestContext,
        apiError(
          404,
          API_ERROR_CODES.BATCH_NOT_FOUND,
          "The requested reconciliation batch was not found.",
        ),
        {
          batchId,
        },
      );
    }

    return completeApiRequest(requestContext, successResponse(batchStatus), {
      batchId,
      batchStatus: batchStatus.status,
    });
  } catch (error) {
    return handleApiError(requestContext, error, {
      batchId,
    });
  }
}
