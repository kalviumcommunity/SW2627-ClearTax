import {
  errorResponse,
  getOptionalString,
  getRequiredString,
  parseJsonObject,
  successResponse,
} from "@/lib/api-response";
import { isUuid } from "@/lib/ids";
import { getPrismaClient } from "@/lib/prisma";

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

  const businessId = getRequiredString(parsedBody.body, "businessId");
  const gstin = getRequiredString(parsedBody.body, "gstin");
  const financialYear = getRequiredString(parsedBody.body, "financialYear");
  const returnPeriod = getRequiredString(parsedBody.body, "returnPeriod");
  const originalFilename = getRequiredString(
    parsedBody.body,
    "originalFilename",
  );
  const storageObjectKey = getOptionalString(
    parsedBody.body,
    "storageObjectKey",
  );

  if (
    !businessId ||
    !gstin ||
    !financialYear ||
    !returnPeriod ||
    !originalFilename
  ) {
    return errorResponse(
      "businessId, gstin, financialYear, returnPeriod, and originalFilename are required.",
      400,
    );
  }

  if (!isUuid(businessId)) {
    return errorResponse("businessId must be a valid UUID.", 400);
  }

  if (storageObjectKey === null) {
    return errorResponse("storageObjectKey must be a non-empty string.", 400);
  }

  if (
    gstin.length > 15 ||
    financialYear.length > 16 ||
    returnPeriod.length > 16
  ) {
    return errorResponse(
      "gstin, financialYear, or returnPeriod exceeds the supported length.",
      400,
    );
  }

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
