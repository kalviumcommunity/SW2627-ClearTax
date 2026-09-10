import {
  API_ERROR_CODES,
  apiError,
  handleApiError,
  parseJsonObject,
  successResponse,
  validationErrorResponse,
} from "@/lib/api-response";
import { requireApiUser } from "@/lib/api-auth";
import { getPrismaClient } from "@/lib/prisma";
import {
  completeApiRequest,
  createApiRequestLogContext,
  logUnauthorizedRequest,
  logUploadValidationFailed,
  type ApiRequestLogContext,
} from "@/lib/request-logging";
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

export async function GET(request: Request) {
  const requestContext = createApiRequestLogContext(
    request,
    "/api/reconciliation-batches",
  );
  const authResult = await requireApiUser();

  if (!authResult.success) {
    logUnauthorizedRequest(requestContext);
    return completeApiRequest(requestContext, authResult.response);
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

    return completeApiRequest(
      requestContext,
      successResponse(batches),
      {
        resultCount: batches.length,
      },
    );
  } catch (error) {
    return handleApiError(requestContext, error);
  }
}

export async function POST(request: Request) {
  const requestContext = createApiRequestLogContext(
    request,
    "/api/reconciliation-batches",
  );
  const authResult = await requireApiUser();

  if (!authResult.success) {
    logUnauthorizedRequest(requestContext);
    return completeApiRequest(requestContext, authResult.response);
  }

  if (isMultipartRequest(request)) {
    return createReconciliationBatchFromUpload(
      request,
      authResult.auth,
      requestContext,
    );
  }

  const parsedBody = await parseJsonObject(request);

  if (!parsedBody.success) {
    return completeApiRequest(requestContext, parsedBody.response);
  }

  const validationResult = createOwnedReconciliationBatchSchema.safeParse(
    parsedBody.body,
  );

  if (!validationResult.success) {
    return completeApiRequest(
      requestContext,
      validationErrorResponse(validationResult.error),
    );
  }

  const { referenceImportId, originalFilename, storageObjectKey } =
    validationResult.data;

  try {
    const prisma = getPrismaClient();
    requestContext.logger.info(
      {
        event: "batch.creation_started",
        referenceImportId,
      },
      "Reconciliation batch creation started",
    );
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
      return completeApiRequest(
        requestContext,
        apiError(
          404,
          API_ERROR_CODES.NOT_FOUND,
          "The requested business was not found.",
        ),
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
      return completeApiRequest(
        requestContext,
        apiError(
          404,
          API_ERROR_CODES.REFERENCE_IMPORT_NOT_FOUND,
          "The requested reference import was not found.",
        ),
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

    requestContext.logger.info(
      {
        event: "batch.created",
        batchId: batch.id,
        referenceImportId,
      },
      "Reconciliation batch created",
    );

    return completeApiRequest(
      requestContext,
      successResponse(batch, {
        status: 201,
      }),
      {
        batchId: batch.id,
        referenceImportId,
      },
    );
  } catch (error) {
    return handleApiError(requestContext, error, {
      referenceImportId,
    });
  }
}

async function createReconciliationBatchFromUpload(
  request: Request,
  auth: ApiAuthContext,
  requestContext: ApiRequestLogContext,
) {
  requestContext.logger.info(
    {
      event: "purchase_register_import.started",
      uploadType: "multipart",
    },
    "Purchase register upload started",
  );

  const formDataResult = await parseMultipartFormData(request);

  if (!formDataResult.success) {
    return completeApiRequest(
      requestContext,
      uploadErrorResponse(requestContext, formDataResult.error),
    );
  }

  const formValidationResult = reconciliationBatchUploadFormSchema.safeParse({
    referenceImportId: getRequiredFormString(
      formDataResult.data,
      "referenceImportId",
    ),
  });

  if (!formValidationResult.success) {
    logUploadValidationFailed(requestContext.logger, {
      importType: "purchase_register",
      reason: "invalid_form_fields",
    });
    return completeApiRequest(
      requestContext,
      validationErrorResponse(formValidationResult.error),
    );
  }

  const fileResult = getRequiredUploadFile(formDataResult.data);

  if (!fileResult.success) {
    return completeApiRequest(
      requestContext,
      uploadErrorResponse(requestContext, fileResult.error),
    );
  }

  requestContext.logger.info(
    {
      event: "upload.received",
      importType: "purchase_register",
      fileType: fileResult.data.type || null,
      fileSize: fileResult.data.size,
    },
    "Upload received",
  );

  const fileResultData = await readValidatedTextFile(fileResult.data, {
    acceptedExtensions: CSV_UPLOAD_EXTENSIONS,
    acceptedMimeTypes: CSV_UPLOAD_MIME_TYPES,
    fileKind: "Purchase Register CSV",
  });

  if (!fileResultData.success) {
    return completeApiRequest(
      requestContext,
      uploadErrorResponse(requestContext, fileResultData.error),
    );
  }

  const csvValidationResult = validatePurchaseRegisterCsv(
    fileResultData.data.text,
  );

  if (!csvValidationResult.success) {
    return completeApiRequest(
      requestContext,
      uploadErrorResponse(requestContext, csvValidationResult.error),
    );
  }

  const { referenceImportId } = formValidationResult.data;
  requestContext.logger.info(
    {
      event: "upload.validation_succeeded",
      importType: "purchase_register",
      referenceImportId,
      fileType: fileResultData.data.contentType,
      fileSize: fileResult.data.size,
      rowCount: csvValidationResult.data.totalRows,
    },
    "Upload validation succeeded",
  );

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
      return completeApiRequest(
        requestContext,
        apiError(
          404,
          API_ERROR_CODES.NOT_FOUND,
          "The requested business was not found.",
        ),
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
      return completeApiRequest(
        requestContext,
        apiError(
          404,
          API_ERROR_CODES.REFERENCE_IMPORT_NOT_FOUND,
          "The requested reference import was not found.",
        ),
      );
    }

    revalidatePath("/");
    revalidatePath("/reconciliations");
    revalidatePath("/reference-imports");
    revalidatePath(`/reference-imports/${referenceImportId}`);

    requestContext.logger.info(
      {
        event: "batch.created",
        batchId: batch.id,
        referenceImportId,
        rowCount: csvValidationResult.data.totalRows,
      },
      "Reconciliation batch created from upload",
    );

    requestContext.logger.info(
      {
        event: "purchase_register_import.completed",
        batchId: batch.id,
        referenceImportId,
        rowCount: csvValidationResult.data.totalRows,
      },
      "Purchase register upload completed",
    );

    return completeApiRequest(
      requestContext,
      successResponse(batch, {
        status: 201,
      }),
      {
        batchId: batch.id,
        referenceImportId,
      },
    );
  } catch (error) {
    requestContext.logger.error(
      {
        event: "purchase_register_import.failed",
        referenceImportId,
        err: error,
      },
      "Purchase register upload failed",
    );
    return handleApiError(requestContext, error, {
      referenceImportId,
    });
  }
}

function uploadErrorResponse(
  requestContext: ApiRequestLogContext,
  error: UploadValidationError,
) {
  logUploadValidationFailed(requestContext.logger, {
    importType: "purchase_register",
    reason: error.code,
    statusCode: error.status,
  });

  return apiError(error.status, error.code, error.message, error.details);
}
