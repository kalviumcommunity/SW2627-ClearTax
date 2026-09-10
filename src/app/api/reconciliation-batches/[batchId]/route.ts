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

type BatchRouteContext = {
  params: Promise<{
    batchId: string;
  }>;
};

export const dynamic = "force-dynamic";

const batchSelect = {
  id: true,
  originalFilename: true,
  status: true,
  totalRows: true,
  processedRows: true,
  matchedRows: true,
  mismatchedRows: true,
  errorRows: true,
  fileErrorMessage: true,
  createdAt: true,
  updatedAt: true,
  startedAt: true,
  completedAt: true,
  business: {
    select: {
      legalName: true,
      gstin: true,
    },
  },
  referenceImport: {
    select: {
      id: true,
      financialYear: true,
      returnPeriod: true,
      status: true,
    },
  },
  _count: {
    select: {
      rows: true,
    },
  },
} as const;

export async function GET(request: Request, { params }: BatchRouteContext) {
  const requestContext = createApiRequestLogContext(
    request,
    "/api/reconciliation-batches/[batchId]",
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

    const batch = await prisma.uploadBatch.findFirst({
      where: {
        id: batchId,
        businessId: authResult.auth.businessId,
      },
      select: batchSelect,
    });

    if (!batch) {
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

    return completeApiRequest(requestContext, successResponse(batch), {
      batchId,
    });
  } catch (error) {
    return handleApiError(requestContext, error, {
      batchId,
    });
  }
}
