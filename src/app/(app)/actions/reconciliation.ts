"use server";
import { revalidatePath } from "next/cache";
import { getPrimaryBusiness, requireCurrentUser } from "@/lib/auth";
import { getPrismaClient } from "@/lib/prisma";
import { createOwnedReferenceImportSchema } from "@/lib/validation/reconciliation";

type CreateReconciliationSetupInput = unknown;

export async function createReconciliationSetup(
  input: CreateReconciliationSetupInput,
) {
  const validationResult = createOwnedReferenceImportSchema.safeParse(input);

  if (!validationResult.success) {
    throw new Error("The reconciliation setup contains invalid fields.");
  }

  const {
    gstin,
    financialYear,
    returnPeriod,
    originalFilename,
    storageObjectKey,
  } = validationResult.data;
  const user = await requireCurrentUser();
  const business = getPrimaryBusiness(user);

  const prisma = getPrismaClient();

  const referenceImport = await prisma.referenceImport.create({
    data: {
      businessId: business.id,
      gstin,
      financialYear,
      returnPeriod,
      originalFilename,
      ...(storageObjectKey ? { storageObjectKey } : {}),
    },
    select: {
      id: true,
      originalFilename: true,
      status: true,
      gstin: true,
      financialYear: true,
      returnPeriod: true,
      createdAt: true,
    },
  });

  revalidatePath("/reference-imports");

  return referenceImport;
}
