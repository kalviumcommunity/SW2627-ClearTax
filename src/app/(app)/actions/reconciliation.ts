"use server";
import { revalidatePath } from "next/cache";
import { getPrismaClient } from "@/lib/prisma";
import { isUuid } from "@/lib/ids";

type CreateReconciliationSetupInput = {
  businessId: string;
  gstin: string;
  financialYear: string;
  returnPeriod: string;
  originalFilename: string;
  storageObjectKey?: string;
};

export async function createReconciliationSetup(
  input: CreateReconciliationSetupInput,
) {
  const {
    businessId,
    gstin,
    financialYear,
    returnPeriod,
    originalFilename,
    storageObjectKey,
  } = input;

  if (!isUuid(businessId)) {
    throw new Error("Invalid business ID.");
  }

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
    throw new Error("Business was not found.");
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
    
  });

revalidatePath("/reference-imports");

  return referenceImport;
}