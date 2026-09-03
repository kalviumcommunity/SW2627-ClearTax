import { z } from "zod";
import {
  optionalTrimmedString,
  requiredTrimmedString,
  uuidString,
} from "@/lib/validation/common";

const gstinPattern =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export const businessIdSchema = uuidString("businessId");
export const batchIdSchema = uuidString("batchId");
export const referenceImportIdSchema = uuidString("referenceImportId");

export const gstinSchema = requiredTrimmedString("gstin")
  .length(15, "gstin must be exactly 15 characters.")
  .regex(gstinPattern, "Invalid GSTIN format.");

export const financialYearSchema = requiredTrimmedString("financialYear", 16);
export const returnPeriodSchema = requiredTrimmedString("returnPeriod", 16);
export const originalFilenameSchema = requiredTrimmedString("originalFilename");
export const storageObjectKeySchema = optionalTrimmedString("storageObjectKey");

export const batchRouteParamsSchema = z.object({
  batchId: batchIdSchema,
});

export const referenceImportRouteParamsSchema = z.object({
  referenceImportId: referenceImportIdSchema,
});

export const createReferenceImportSchema = z.object({
  businessId: businessIdSchema,
  gstin: gstinSchema,
  financialYear: financialYearSchema,
  returnPeriod: returnPeriodSchema,
  originalFilename: originalFilenameSchema,
  storageObjectKey: storageObjectKeySchema,
});

export const createOwnedReferenceImportSchema =
  createReferenceImportSchema.omit({
    businessId: true,
  });

export const createReconciliationBatchSchema = z.object({
  businessId: businessIdSchema,
  referenceImportId: referenceImportIdSchema,
  originalFilename: originalFilenameSchema,
  storageObjectKey: storageObjectKeySchema,
});

export const createOwnedReconciliationBatchSchema =
  createReconciliationBatchSchema.omit({
    businessId: true,
  });

export type CreateReferenceImportInput = z.infer<
  typeof createReferenceImportSchema
>;
export type CreateOwnedReferenceImportInput = z.infer<
  typeof createOwnedReferenceImportSchema
>;
export type CreateReconciliationBatchInput = z.infer<
  typeof createReconciliationBatchSchema
>;
export type CreateOwnedReconciliationBatchInput = z.infer<
  typeof createOwnedReconciliationBatchSchema
>;
