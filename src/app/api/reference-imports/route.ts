import {
  apiError,
  parseJsonObject,
  successResponse,
  validationErrorResponse,
} from "@/lib/api-response";
import { requireApiUser } from "@/lib/api-auth";
import { getPrismaClient } from "@/lib/prisma";
import {
  createOwnedReferenceImportSchema,
  referenceImportUploadFormSchema,
} from "@/lib/validation/reconciliation";
import {
  deriveFinancialYearFromReturnPeriod,
  getOptionalFormString,
  getRequiredUploadFile,
  isMultipartRequest,
  JSON_UPLOAD_EXTENSIONS,
  JSON_UPLOAD_MIME_TYPES,
  parseMultipartFormData,
  readValidatedTextFile,
  type UploadValidationError,
  validateGstr2bJson,
} from "@/lib/upload-validation";
import { revalidatePath } from "next/cache";

type ApiAuthContext = {
  userId: string;
  businessId: string;
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
        businessId: authResult.auth.businessId,
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

  if (isMultipartRequest(request)) {
    return createReferenceImportFromUpload(request, authResult.auth);
  }

  const parsedBody = await parseJsonObject(request);

  if (!parsedBody.success) {
    return parsedBody.response;
  }

  const validationResult = createOwnedReferenceImportSchema.safeParse(
    parsedBody.body,
  );

  if (!validationResult.success) {
    return validationErrorResponse(validationResult.error);
  }

  const {
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
        id: authResult.auth.businessId,
        ownerId: authResult.auth.userId,
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
        businessId: business.id,
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

async function createReferenceImportFromUpload(
  request: Request,
  auth: ApiAuthContext,
) {
  const formDataResult = await parseMultipartFormData(request);

  if (!formDataResult.success) {
    return uploadErrorResponse(formDataResult.error);
  }

  const fileResult = getRequiredUploadFile(formDataResult.data);

  if (!fileResult.success) {
    return uploadErrorResponse(fileResult.error);
  }

  const fileResultData = await readValidatedTextFile(fileResult.data, {
    acceptedExtensions: JSON_UPLOAD_EXTENSIONS,
    acceptedMimeTypes: JSON_UPLOAD_MIME_TYPES,
    fileKind: "GSTR-2B JSON",
  });

  if (!fileResultData.success) {
    return uploadErrorResponse(fileResultData.error);
  }

  const gstr2bValidationResult = validateGstr2bJson(fileResultData.data.text);

  if (!gstr2bValidationResult.success) {
    return uploadErrorResponse(gstr2bValidationResult.error);
  }

  const formValidationResult = referenceImportUploadFormSchema.safeParse({
    financialYear: getOptionalFormString(formDataResult.data, "financialYear"),
    returnPeriod: getOptionalFormString(formDataResult.data, "returnPeriod"),
  });

  if (!formValidationResult.success) {
    return validationErrorResponse(formValidationResult.error);
  }

  const prisma = getPrismaClient();

  try {
    const business = await prisma.business.findFirst({
      where: {
        id: auth.businessId,
        ownerId: auth.userId,
      },
      select: {
        id: true,
        gstin: true,
      },
    });

    if (!business) {
      return apiError(
        404,
        "BUSINESS_NOT_FOUND",
        "The requested business was not found.",
      );
    }

    const uploadedGstin = gstr2bValidationResult.data.gstin.toUpperCase();

    if (uploadedGstin !== business.gstin.toUpperCase()) {
      return apiError(
        400,
        "GSTR2B_GSTIN_MISMATCH",
        "Uploaded GSTR-2B GSTIN does not match the authenticated business.",
      );
    }

    const formReturnPeriod = formValidationResult.data.returnPeriod;
    const uploadedReturnPeriod = gstr2bValidationResult.data.returnPeriod;

    if (
      formReturnPeriod &&
      uploadedReturnPeriod &&
      formReturnPeriod !== uploadedReturnPeriod
    ) {
      return apiError(
        400,
        "GSTR2B_RETURN_PERIOD_MISMATCH",
        "Uploaded GSTR-2B return period does not match the submitted return period.",
      );
    }

    const returnPeriod = uploadedReturnPeriod ?? formReturnPeriod;

    if (!returnPeriod) {
      return apiError(
        400,
        "INVALID_GSTR2B_STRUCTURE",
        "GSTR-2B return period is required.",
      );
    }

    const derivedFinancialYear =
      deriveFinancialYearFromReturnPeriod(returnPeriod);
    const financialYear =
      derivedFinancialYear ?? formValidationResult.data.financialYear;

    if (!financialYear) {
      return apiError(
        400,
        "VALIDATION_ERROR",
        "The request contains invalid fields.",
        {
          financialYear: [
            "financialYear is required when returnPeriod is not in MMYYYY format.",
          ],
        },
      );
    }

    const referenceImport = await prisma.referenceImport.create({
      data: {
        businessId: business.id,
        gstin: business.gstin,
        financialYear,
        returnPeriod,
        originalFilename: fileResultData.data.originalFilename,
        totalDocuments: gstr2bValidationResult.data.totalDocuments,
      },
      select: referenceImportSelect,
    });

    revalidatePath("/");
    revalidatePath("/reference-imports");

    return successResponse(referenceImport, {
      status: 201,
    });
  } catch (error) {
    console.error("Failed to create reference import from upload", error);

    return apiError(
      500,
      "INTERNAL_SERVER_ERROR",
      "An unexpected server error occurred.",
    );
  }
}

function uploadErrorResponse(error: UploadValidationError) {
  return apiError(error.status, error.code, error.message, error.details);
}
