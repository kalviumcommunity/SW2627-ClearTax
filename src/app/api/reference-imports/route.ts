import {
  apiError,
  parseJsonObject,
  successResponse,
  validationErrorResponse,
} from "@/lib/api-response";
import { requireApiUser } from "@/lib/api-auth";
import { getPrismaClient } from "@/lib/prisma";
import { createReferenceImportSchema } from "@/lib/validation/reconciliation";
import { revalidatePath } from "next/cache";

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
  const authResult = await requireApiUser();

  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const prisma = getPrismaClient();

    const referenceImports = await prisma.referenceImport.findMany({
      where: {
        business: {
          ownerId: authResult.user.id,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: referenceImportSelect,
      take: 25,
    });

    return successResponse(referenceImports);
  } catch (error) {
    console.error("Failed to list reference imports", error);

    return apiError(
      500,
      "INTERNAL_SERVER_ERROR",
      "An unexpected server error occurred.",
    );
  }
}

export async function POST(request: Request) {
  const authResult = await requireApiUser();

  if (!authResult.success) {
    return authResult.response;
  }

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

    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        ownerId: authResult.user.id,
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

    revalidatePath("/");
    revalidatePath("/reference-imports");

    return successResponse(referenceImport, {
      status: 201,
    });
  } catch (error) {
    console.error("Failed to create reference import", error);

    return apiError(
      500,
      "INTERNAL_SERVER_ERROR",
      "An unexpected server error occurred.",
    );
  }
}
