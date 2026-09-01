import {
  errorResponse,
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
      return errorResponse("Reconciliation batch was not found.", 404);
    }

    return successResponse(batchStatus);
  } catch (error) {
    console.error("Failed to retrieve reconciliation batch status", error);

    return errorResponse(
      "Reconciliation batch status is temporarily unavailable.",
      500,
    );
  }
}
