import {
  apiError,
  successResponse,
  validationErrorResponse,
} from "@/lib/api-response";
import { getPrismaClient } from "@/lib/prisma";
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
  _request: Request,
  { params }: BatchStatusRouteContext,
) {
  const validationResult = batchRouteParamsSchema.safeParse(await params);

  if (!validationResult.success) {
    return validationErrorResponse(validationResult.error);
  }

  const { batchId } = validationResult.data;

  try {
    const prisma = getPrismaClient();

    const batchStatus = await prisma.uploadBatch.findUnique({
      where: {
        id: batchId,
      },
      select: batchStatusSelect,
    });

    if (!batchStatus) {
      return apiError(
        404,
        "BATCH_NOT_FOUND",
        "The requested reconciliation batch was not found.",
      );
    }

    return successResponse(batchStatus);
  } catch (error) {
    console.error("Failed to retrieve reconciliation batch status", error);

    return apiError(
      500,
      "INTERNAL_SERVER_ERROR",
      "An unexpected server error occurred.",
    );
  }
}
