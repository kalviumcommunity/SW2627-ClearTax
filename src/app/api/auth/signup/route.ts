import bcrypt from "bcrypt";
import { Prisma } from "@/generated/prisma/client";
import {
  API_ERROR_CODES,
  apiError,
  handleApiError,
  parseJsonObject,
  successResponse,
  validationErrorResponse,
} from "@/lib/api-response";
import { getPrismaClient } from "@/lib/prisma";
import {
  completeApiRequest,
  createApiRequestLogContext,
} from "@/lib/request-logging";
import { signupSchema } from "@/lib/validation/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BCRYPT_SALT_ROUNDS = 12;

export async function POST(request: Request) {
  const requestContext = createApiRequestLogContext(request, "/api/auth/signup");
  const parsedBody = await parseJsonObject(request);

  if (!parsedBody.success) {
    return completeApiRequest(requestContext, parsedBody.response);
  }

  const validationResult = signupSchema.safeParse(parsedBody.body);

  if (!validationResult.success) {
    return completeApiRequest(
      requestContext,
      validationErrorResponse(validationResult.error),
    );
  }

  const { email, name, password, businessLegalName, businessGstin } =
    validationResult.data;

  try {
    const prisma = getPrismaClient();
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        businesses: {
          create: {
            legalName: businessLegalName,
            gstin: businessGstin,
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        businesses: {
          select: {
            id: true,
          },
          take: 1,
        },
      },
    });

    requestContext.logger.info(
      {
        event: "auth.signup.created",
      },
      "Signup account created",
    );

    return completeApiRequest(
      requestContext,
      successResponse(
        {
          userId: user.id,
          email: user.email,
          name: user.name,
          businessId: user.businesses[0]?.id,
        },
        {
          status: 201,
        },
      ),
    );
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      requestContext.logger.warn(
        {
          event: "auth.signup_conflict",
          statusCode: 409,
        },
        "Signup conflict",
      );

      return completeApiRequest(
        requestContext,
        apiError(
          409,
          API_ERROR_CODES.CONFLICT,
          "An account or business with these details already exists.",
          getSignupConflictDetails(error),
        ),
      );
    }

    return handleApiError(requestContext, error);
  }
}

function isUniqueConstraintError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function getSignupConflictDetails(
  error: Prisma.PrismaClientKnownRequestError,
) {
  const target = Array.isArray(error.meta?.target)
    ? error.meta.target.filter(
        (field): field is string => typeof field === "string",
      )
    : [];

  return {
    ...(target.includes("email")
      ? { email: ["An account with this email already exists."] }
      : {}),
    ...(target.includes("gstin")
      ? { businessGstin: ["A business with this GSTIN already exists."] }
      : {}),
  };
}
