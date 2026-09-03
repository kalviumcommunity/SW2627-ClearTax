"use server";

import { revalidatePath } from "next/cache";

import { getPrismaClient } from "@/lib/prisma";
import { createReferenceImportSchema } from "@/lib/validation/reconciliation";

type CreateReconciliationSetupInput = unknown;

export async function createReconciliationSetup(
  input: CreateReconciliationSetupInput,
) {
  const validation = createReferenceImportSchema.safeParse(input);

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

  const business = await prisma.business.findUnique({
    where: {
      id: businessId,
    },
    select: {
      id: true,
    },
  });

  if (!business) {
    return {
      success: false as const,
      fieldErrors: {
        businessId: ["Business was not found."],
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
