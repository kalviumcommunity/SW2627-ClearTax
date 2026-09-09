import {
  apiError,
  successResponse,
  validationErrorResponse,
} from "@/lib/api-response";
import { requireApiUser } from "@/lib/api-auth";
import { getPrismaClient } from "@/lib/prisma";
import {
  batchRouteParamsSchema,
  reconciliationResultsQuerySchema,
} from "@/lib/validation/reconciliation";

type BatchResultsRouteContext = {
  params: Promise<{
    batchId: string;
  }>;
};

export const dynamic = "force-dynamic";

const resultSelect = {
  id: true,
  batchId: true,
  rowNumber: true,
  rawData: true,
  invoiceNumber: true,
  normalizedInvoiceNumber: true,
  supplierGstin: true,
  invoiceDate: true,
  taxableValue: true,
  igstAmount: true,
  cgstAmount: true,
  sgstAmount: true,
  cessAmount: true,
  totalInvoiceValue: true,
  processingStatus: true,
  reconciliationResult: true,
  errorCode: true,
  errorMessage: true,
  matchedReferenceId: true,
  mismatchCodes: true,
  mismatchDetails: true,
  createdAt: true,
  updatedAt: true,
  processedAt: true,
  matchedReference: {
    select: {
      id: true,
      supplierGstin: true,
      invoiceNumber: true,
      normalizedInvoiceNumber: true,
      invoiceDate: true,
      taxableValue: true,
      igstAmount: true,
      cgstAmount: true,
      sgstAmount: true,
      cessAmount: true,
      totalInvoiceValue: true,
    },
  },
} as const;

export async function GET(
  request: Request,
  { params }: BatchResultsRouteContext,
) {
  const authResult = await requireApiUser();

  if (!authResult.success) {
    return authResult.response;
  }

  const paramsValidationResult = batchRouteParamsSchema.safeParse(await params);

  if (!paramsValidationResult.success) {
    return validationErrorResponse(paramsValidationResult.error);
  }

  const searchParams = new URL(request.url).searchParams;
  const queryValidationResult = reconciliationResultsQuerySchema.safeParse({
    limit: searchParams.get("limit") ?? undefined,
    cursor: searchParams.get("cursor") ?? undefined,
  });

  if (!queryValidationResult.success) {
    return validationErrorResponse(queryValidationResult.error);
  }

  const { batchId } = paramsValidationResult.data;
  const { cursor, limit } = queryValidationResult.data;

  try {
    const prisma = getPrismaClient();

    const batch = await prisma.uploadBatch.findFirst({
      where: {
        id: batchId,
        businessId: authResult.auth.businessId,
      },
      select: {
        id: true,
      },
    });

    if (!batch) {
      return apiError(
        404,
        "BATCH_NOT_FOUND",
        "The requested reconciliation batch was not found.",
      );
    }

    if (cursor) {
      const cursorRow = await prisma.reconciliationRow.findFirst({
        where: {
          id: cursor,
          batchId,
        },
        select: {
          id: true,
        },
      });

      if (!cursorRow) {
        return apiError(
          400,
          "INVALID_CURSOR",
          "The requested cursor was not found for this reconciliation batch.",
        );
      }
    }

    const rows = await prisma.reconciliationRow.findMany({
      where: {
        batchId,
      },
      orderBy: {
        id: "asc",
      },
      take: limit + 1,
      ...(cursor
        ? {
            cursor: {
              id: cursor,
            },
            skip: 1,
          }
        : {}),
      select: resultSelect,
    });

    const hasMore = rows.length > limit;
    const results = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? results[results.length - 1]?.id : null;

    return successResponse({
      results,
      pagination: {
        nextCursor,
        hasMore,
      },
    });
  } catch (error) {
    console.error("Failed to retrieve reconciliation batch results", error);

    return apiError(
      500,
      "INTERNAL_SERVER_ERROR",
      "An unexpected server error occurred.",
    );
  }
}
