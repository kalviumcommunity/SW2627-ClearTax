"use server";

import { revalidatePath } from "next/cache";

import { requireAuthContext } from "@/lib/auth";
import { getPrismaClient } from "@/lib/prisma";
import { createOwnedReferenceImportSchema } from "@/lib/validation/reconciliation";

type CreateReconciliationSetupInput = unknown;

export async function createReconciliationSetup(
  input: CreateReconciliationSetupInput,
) {
  const validation = createOwnedReferenceImportSchema.safeParse(input);

  if (!validation.success) {
    return {
      success: false as const,
      fieldErrors: validation.error.flatten().fieldErrors,
      formError: "Please fix the highlighted fields.",
    };
  }

  const {
    gstin,
    financialYear,
    returnPeriod,
    originalFilename,
    storageObjectKey,
  } = validation.data;

  const prisma = getPrismaClient();
  const auth = await requireAuthContext();

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
    return {
      success: false as const,
      fieldErrors: {
        request: ["Business context is unavailable."],
      },
      formError: "Please fix the highlighted fields.",
    };
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
  });

  revalidatePath("/reference-imports");

  return {
    success: true as const,
    referenceImport,
  };
}
