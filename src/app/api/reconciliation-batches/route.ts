import {
  apiError,
  parseJsonObject,
  successResponse,
  validationErrorResponse,
} from "@/lib/api-response";
import { requireApiUser } from "@/lib/api-auth";
import { getPrismaClient } from "@/lib/prisma";
import {
  createOwnedReconciliationBatchSchema,
  reconciliationBatchUploadFormSchema,
} from "@/lib/validation/reconciliation";
import {
  CSV_UPLOAD_EXTENSIONS,
  CSV_UPLOAD_MIME_TYPES,
  getRequiredFormString,
  getRequiredUploadFile,
  isMultipartRequest,
  parseMultipartFormData,
  readValidatedTextFile,
  type UploadValidationError,
  validatePurchaseRegisterCsv,
} from "@/lib/upload-validation";
import { revalidatePath } from "next/cache";

type ApiAuthContext = {
  userId: string;
  businessId: string;
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

export async function GET() {
  const authResult = await requireApiUser();

  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const prisma = getPrismaClient();

    const batches = await prisma.uploadBatch.findMany({
      where: {
        businessId: authResult.auth.businessId,
      },
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
  const authResult = await requireApiUser();

  if (!authResult.success) {
    return authResult.response;
  }

  if (isMultipartRequest(request)) {
    return createReconciliationBatchFromUpload(request, authResult.auth);
  }

  const parsedBody = await parseJsonObject(request);

  if (!parsedBody.success) {
    return parsedBody.response;
  }

  const validationResult = createOwnedReconciliationBatchSchema.safeParse(
    parsedBody.body,
  );

  if (!validationResult.success) {
    return validationErrorResponse(validationResult.error);
  }

  const { referenceImportId, originalFilename, storageObjectKey } =
    validationResult.data;

  try {
    const prisma = getPrismaClient();
    // Resolve business context first because the reference import
    // must belong to the resolved business before creating a batch.

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
        businessId: business.id,
        referenceImportId,
        originalFilename,
        ...(storageObjectKey ? { storageObjectKey } : {}),
      },
      select: batchSelect,
    });

    revalidatePath("/");
    revalidatePath("/reconciliations");
    revalidatePath("/reference-imports");
    revalidatePath(`/reference-imports/${referenceImportId}`);

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

async function createReconciliationBatchFromUpload(
  request: Request,
  auth: ApiAuthContext,
) {
  const formDataResult = await parseMultipartFormData(request);

  if (!formDataResult.success) {
    return uploadErrorResponse(formDataResult.error);
  }

  const formValidationResult = reconciliationBatchUploadFormSchema.safeParse({
    referenceImportId: getRequiredFormString(
      formDataResult.data,
      "referenceImportId",
    ),
  });

  if (!formValidationResult.success) {
    return validationErrorResponse(formValidationResult.error);
  }

  const fileResult = getRequiredUploadFile(formDataResult.data);

  if (!fileResult.success) {
    return uploadErrorResponse(fileResult.error);
  }

  const fileResultData = await readValidatedTextFile(fileResult.data, {
    acceptedExtensions: CSV_UPLOAD_EXTENSIONS,
    acceptedMimeTypes: CSV_UPLOAD_MIME_TYPES,
    fileKind: "Purchase Register CSV",
  });

  if (!fileResultData.success) {
    return uploadErrorResponse(fileResultData.error);
  }

  const csvValidationResult = validatePurchaseRegisterCsv(
    fileResultData.data.text,
  );

  if (!csvValidationResult.success) {
    return uploadErrorResponse(csvValidationResult.error);
  }

  const { referenceImportId } = formValidationResult.data;

  try {
    const prisma = getPrismaClient();

    const business = await prisma.business.findFirst({
      where: {
        id: auth.businessId,
        ownerId: auth.userId,
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

    const batch = await prisma.$transaction(async (transaction) => {
      const referenceImport = await transaction.referenceImport.findFirst({
        where: {
          id: referenceImportId,
          businessId: business.id,
        },
        select: {
          id: true,
        },
      });

      if (!referenceImport) {
        return null;
      }

      return transaction.uploadBatch.create({
        data: {
          businessId: business.id,
          referenceImportId,
          originalFilename: fileResultData.data.originalFilename,
          totalRows: csvValidationResult.data.totalRows,
        },
        select: batchSelect,
      });
    });

    if (!batch) {
      return apiError(
        404,
        "REFERENCE_IMPORT_NOT_FOUND",
        "The requested reference import was not found.",
      );
    }

    revalidatePath("/");
    revalidatePath("/reconciliations");
    revalidatePath("/reference-imports");
    revalidatePath(`/reference-imports/${referenceImportId}`);

    return successResponse(batch, {
      status: 201,
    });
  } catch (error) {
    console.error("Failed to create reconciliation batch from upload", error);

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
