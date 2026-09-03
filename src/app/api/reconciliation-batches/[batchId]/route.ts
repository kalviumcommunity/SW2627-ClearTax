import {
  apiError,
  successResponse,
  validationErrorResponse,
} from "@/lib/api-response";
import { requireApiUser } from "@/lib/api-auth";
import { getPrismaClient } from "@/lib/prisma";
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

export async function GET(_request: Request, { params }: BatchRouteContext) {
  const authResult = await requireApiUser();

  if (!authResult.success) {
    return authResult.response;
  }

  const validationResult = batchRouteParamsSchema.safeParse(await params);

  if (!validationResult.success) {
    return validationErrorResponse(validationResult.error);
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
      return apiError(
        404,
        "BATCH_NOT_FOUND",
        "The requested reconciliation batch was not found.",
      );
    }

    return successResponse(batch);
  } catch (error) {
    console.error("Failed to retrieve reconciliation batch", error);

    return apiError(
      500,
      "INTERNAL_SERVER_ERROR",
      "An unexpected server error occurred.",
    );
  }
}
