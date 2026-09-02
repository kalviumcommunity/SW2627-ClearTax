import {
  apiError,
  parseJsonObject,
  successResponse,
  validationErrorResponse,
} from "@/lib/api-response";
import { getPrismaClient } from "@/lib/prisma";
import { createReconciliationBatchSchema } from "@/lib/validation/reconciliation";

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

export async function GET() {
  try {
    const prisma = getPrismaClient();

    const batches = await prisma.uploadBatch.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: batchSelect,
      take: 25,
    });

    return successResponse(batches);
  } catch (error) {
    console.error("Failed to list reconciliation batches", error);

    return apiError(
      500,
      "INTERNAL_SERVER_ERROR",
      "An unexpected server error occurred.",
    );
  }
}

export async function POST(request: Request) {
  const parsedBody = await parseJsonObject(request);

  if (!parsedBody.success) {
    return parsedBody.response;
  }

  const validationResult = createReconciliationBatchSchema.safeParse(
    parsedBody.body,
  );

  if (!validationResult.success) {
    return validationErrorResponse(validationResult.error);
  }

  const { businessId, referenceImportId, originalFilename, storageObjectKey } =
    validationResult.data;

  try {
    const prisma = getPrismaClient();
    // Resolve business context first because the reference import
    // must belong to the resolved business before creating a batch.

    const business = await prisma.business.findUnique({
      where: {
        id: businessId,
      },
      select: {
        id: true,
      },
    });

    if (!business) {
      return apiError(
        404,
        "BUSINESS_NOT_FOUND",
        "The requested business was not found.",
      );
    }

    const referenceImport = await prisma.referenceImport.findFirst({
      where: {
        id: referenceImportId,
        businessId: business.id,
      },
      select: {
        id: true,
      },
    });

    if (!referenceImport) {
      return apiError(
        404,
        "REFERENCE_IMPORT_NOT_FOUND",
        "The requested reference import was not found.",
      );
    }

    const batch = await prisma.uploadBatch.create({
      data: {
        businessId,
        referenceImportId,
        originalFilename,
        ...(storageObjectKey ? { storageObjectKey } : {}),
      },
      select: batchSelect,
    });

    return successResponse(batch, {
      status: 201,
    });
  } catch (error) {
    console.error("Failed to create reconciliation batch", error);

    return apiError(
      500,
      "INTERNAL_SERVER_ERROR",
      "An unexpected server error occurred.",
    );
  }
}
