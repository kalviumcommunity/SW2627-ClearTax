import { errorResponse, successResponse } from "@/lib/api-response";
import { isUuid } from "@/lib/ids";
import { getPrismaClient } from "@/lib/prisma";

type ReferenceImportRouteContext = {
  params: Promise<{
    referenceImportId: string;
  }>;
};

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
  uploadBatches: {
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      originalFilename: true,
      status: true,
      createdAt: true,
    },
    take: 5,
  },
  _count: {
    select: {
      invoices: true,
      uploadBatches: true,
    },
  },
} as const;

export async function GET(
  _request: Request,
  { params }: ReferenceImportRouteContext,
) {
  const { referenceImportId } = await params;

  if (!isUuid(referenceImportId)) {
    return errorResponse("Reference import was not found.", 404);
  }

  try {
    const prisma = getPrismaClient();

    const referenceImport = await prisma.referenceImport.findUnique({
      where: {
        id: referenceImportId,
      },
      select: referenceImportSelect,
    });

    if (!referenceImport) {
      return errorResponse("Reference import was not found.", 404);
    }

    return successResponse(referenceImport);
  } catch (error) {
    console.error("Failed to retrieve reference import", error);

    return errorResponse("Reference import is temporarily unavailable.", 500);
  }
}
