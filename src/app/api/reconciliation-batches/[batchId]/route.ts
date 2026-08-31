import { errorResponse, successResponse } from "@/lib/api-response";
import { isUuid } from "@/lib/ids";
import { getPrismaClient } from "@/lib/prisma";

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
  const { batchId } = await params;

  if (!isUuid(batchId)) {
    return errorResponse("Reconciliation batch was not found.", 404);
  }

  try {
    const prisma = getPrismaClient();

    const batch = await prisma.uploadBatch.findUnique({
      where: {
        id: batchId,
      },
      select: batchSelect,
    });

    if (!batch) {
      return errorResponse("Reconciliation batch was not found.", 404);
    }

    return successResponse(batch);
  } catch (error) {
    console.error("Failed to retrieve reconciliation batch", error);

    return errorResponse(
      "Reconciliation batch is temporarily unavailable.",
      500,
    );
  }
}
