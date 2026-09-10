import {
  apiError,
  successResponse,
  validationErrorResponse,
} from "@/lib/api-response";
import { requireApiUser } from "@/lib/api-auth";
import { getPrismaClient } from "@/lib/prisma";
import {
  completeApiRequest,
  createApiRequestLogContext,
  logApiRequestFailure,
  logUnauthorizedRequest,
} from "@/lib/request-logging";
import { referenceImportRouteParamsSchema } from "@/lib/validation/reconciliation";

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
  request: Request,
  { params }: ReferenceImportRouteContext,
) {
  const requestContext = createApiRequestLogContext(
    request,
    "/api/reference-imports/[referenceImportId]",
  );
  const authResult = await requireApiUser();

  if (!authResult.success) {
    logUnauthorizedRequest(requestContext);
    return completeApiRequest(requestContext, authResult.response);
  }

  const validationResult = referenceImportRouteParamsSchema.safeParse(
    await params,
  );

  if (!validationResult.success) {
    return completeApiRequest(
      requestContext,
      validationErrorResponse(validationResult.error),
    );
  }

  const { referenceImportId } = validationResult.data;

  try {
    const prisma = getPrismaClient();

    const referenceImport = await prisma.referenceImport.findFirst({
      where: {
        id: referenceImportId,
        businessId: authResult.auth.businessId,
      },
      select: referenceImportSelect,
    });

    if (!referenceImport) {
      return completeApiRequest(
        requestContext,
        apiError(
          404,
          "REFERENCE_IMPORT_NOT_FOUND",
          "The requested reference import was not found.",
        ),
        {
          importId: referenceImportId,
        },
      );
    }

    return completeApiRequest(requestContext, successResponse(referenceImport), {
      importId: referenceImportId,
    });
  } catch (error) {
    logApiRequestFailure(requestContext, error, {
      importId: referenceImportId,
    });

    return completeApiRequest(
      requestContext,
      apiError(
        500,
        "INTERNAL_SERVER_ERROR",
        "An unexpected server error occurred.",
      ),
      {
        importId: referenceImportId,
      },
    );
  }
}
