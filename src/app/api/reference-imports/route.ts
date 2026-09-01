import {
  errorResponse,
  parseJsonObject,
  successResponse,
  validationErrorResponse,
} from "@/lib/api-response";
import { getPrismaClient } from "@/lib/prisma";
import { createReferenceImportSchema } from "@/lib/validation/reconciliation";

export const dynamic = "force-dynamic";

const referenceImportSelect = {
  id: true,
  originalFilename: true,
  status: true,
  gstin: true,
  financialYear: true,
  returnPeriod: true,
  totalDocuments: true,
  importedDocuments: true,
  skippedDocuments: true,
  failedDocuments: true,
  isActive: true,
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
  _count: {
    select: {
      invoices: true,
      uploadBatches: true,
    },
  },
} as const;

export async function GET() {
  try {
    const prisma = getPrismaClient();

    const referenceImports = await prisma.referenceImport.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: referenceImportSelect,
      take: 25,
    });

    return successResponse(referenceImports);
  } catch (error) {
    console.error("Failed to list reference imports", error);

    return errorResponse("Reference imports are temporarily unavailable.", 500);
  }
}

export async function POST(request: Request) {
  const parsedBody = await parseJsonObject(request);

  if (!parsedBody.success) {
    return parsedBody.response;
  }

  const validationResult = createReferenceImportSchema.safeParse(
    parsedBody.body,
  );

  if (!validationResult.success) {
    return validationErrorResponse(validationResult.error);
  }

  const {
    businessId,
    gstin,
    financialYear,
    returnPeriod,
    originalFilename,
    storageObjectKey,
  } = validationResult.data;

  try {
    const prisma = getPrismaClient();

    const business = await prisma.business.findUnique({
      where: {
        id: businessId,
      },
      select: {
        id: true,
      },
    });

    if (!business) {
      return errorResponse("Business was not found.", 404);
    }

    const referenceImport = await prisma.referenceImport.create({
      data: {
        businessId,
        gstin,
        financialYear,
        returnPeriod,
        originalFilename,
        ...(storageObjectKey ? { storageObjectKey } : {}),
      },
      select: referenceImportSelect,
    });

    return successResponse(referenceImport, {
      status: 201,
    });
  } catch (error) {
    console.error("Failed to create reference import", error);

    return errorResponse("Reference import could not be created.", 500);
  }
}
