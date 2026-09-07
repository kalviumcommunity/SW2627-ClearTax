import bcrypt from "bcrypt";
import { Prisma } from "@/generated/prisma/client";
import {
  apiError,
  parseJsonObject,
  successResponse,
  validationErrorResponse,
} from "@/lib/api-response";
import { getPrismaClient } from "@/lib/prisma";
import { signupSchema } from "@/lib/validation/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BCRYPT_SALT_ROUNDS = 12;

export async function POST(request: Request) {
  const parsedBody = await parseJsonObject(request);

  if (!parsedBody.success) {
    return parsedBody.response;
  }

  const validationResult = signupSchema.safeParse(parsedBody.body);

  if (!validationResult.success) {
    return validationErrorResponse(validationResult.error);
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

    return successResponse(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        businessId: user.businesses[0]?.id,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return apiError(
        409,
        "SIGNUP_CONFLICT",
        "An account or business with these details already exists.",
        getSignupConflictDetails(error),
      );
    }

    console.error("Failed to create signup account", error);

    return apiError(
      500,
      "INTERNAL_SERVER_ERROR",
      "An unexpected server error occurred.",
    );
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
