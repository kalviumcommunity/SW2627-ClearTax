-- CreateEnum
CREATE TYPE "ReferenceImportStatus" AS ENUM ('QUEUED', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "UploadBatchStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'COMPLETED_WITH_ERRORS', 'FAILED');

-- CreateEnum
CREATE TYPE "RowProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReconciliationResult" AS ENUM ('PENDING', 'MATCHED', 'MISMATCHED', 'UNMATCHED', 'ERROR');

-- CreateEnum
CREATE TYPE "RowErrorCode" AS ENUM ('MISSING_INVOICE_NUMBER', 'INVALID_GSTIN', 'INVALID_INVOICE_DATE', 'INVALID_TAXABLE_VALUE', 'INVALID_IGST', 'INVALID_CGST', 'INVALID_SGST', 'INVALID_CESS', 'INVALID_TOTAL_VALUE', 'NEGATIVE_AMOUNT', 'DUPLICATE_IN_BATCH', 'MALFORMED_ROW');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Business" (
    "id" UUID NOT NULL,
    "legalName" TEXT NOT NULL,
    "gstin" VARCHAR(15) NOT NULL,
    "ownerId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferenceImport" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "gstin" VARCHAR(15) NOT NULL,
    "financialYear" VARCHAR(16) NOT NULL,
    "returnPeriod" VARCHAR(16) NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "storageObjectKey" TEXT,
    "status" "ReferenceImportStatus" NOT NULL DEFAULT 'QUEUED',
    "totalDocuments" INTEGER NOT NULL DEFAULT 0,
    "importedDocuments" INTEGER NOT NULL DEFAULT 0,
    "skippedDocuments" INTEGER NOT NULL DEFAULT 0,
    "failedDocuments" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ReferenceImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferenceInvoice" (
    "id" UUID NOT NULL,
    "referenceImportId" UUID NOT NULL,
    "supplierGstin" VARCHAR(15) NOT NULL,
    "invoiceNumber" VARCHAR(64) NOT NULL,
    "normalizedInvoiceNumber" VARCHAR(64) NOT NULL,
    "invoiceDate" DATE NOT NULL,
    "taxableValue" DECIMAL(18,2) NOT NULL,
    "igstAmount" DECIMAL(18,2) NOT NULL,
    "cgstAmount" DECIMAL(18,2) NOT NULL,
    "sgstAmount" DECIMAL(18,2) NOT NULL,
    "cessAmount" DECIMAL(18,2) NOT NULL,
    "totalInvoiceValue" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferenceInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadBatch" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "referenceImportId" UUID NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "storageObjectKey" TEXT,
    "status" "UploadBatchStatus" NOT NULL DEFAULT 'QUEUED',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "processedRows" INTEGER NOT NULL DEFAULT 0,
    "matchedRows" INTEGER NOT NULL DEFAULT 0,
    "mismatchedRows" INTEGER NOT NULL DEFAULT 0,
    "errorRows" INTEGER NOT NULL DEFAULT 0,
    "fileErrorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "UploadBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationRow" (
    "id" UUID NOT NULL,
    "batchId" UUID NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "rawData" JSONB,
    "invoiceNumber" VARCHAR(64),
    "normalizedInvoiceNumber" VARCHAR(64),
    "supplierGstin" VARCHAR(15),
    "invoiceDate" DATE,
    "taxableValue" DECIMAL(18,2),
    "igstAmount" DECIMAL(18,2),
    "cgstAmount" DECIMAL(18,2),
    "sgstAmount" DECIMAL(18,2),
    "cessAmount" DECIMAL(18,2),
    "totalInvoiceValue" DECIMAL(18,2),
    "processingStatus" "RowProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "reconciliationResult" "ReconciliationResult" NOT NULL DEFAULT 'PENDING',
    "errorCode" "RowErrorCode",
    "errorMessage" TEXT,
    "matchedReferenceId" UUID,
    "mismatchCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mismatchDetails" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "ReconciliationRow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Business_gstin_key" ON "Business"("gstin");

-- CreateIndex
CREATE INDEX "Business_ownerId_idx" ON "Business"("ownerId");

-- CreateIndex
CREATE INDEX "ReferenceImport_businessId_idx" ON "ReferenceImport"("businessId");

-- CreateIndex
CREATE INDEX "ReferenceImport_businessId_gstin_financialYear_returnPeriod_idx" ON "ReferenceImport"("businessId", "gstin", "financialYear", "returnPeriod");

-- CreateIndex
CREATE INDEX "ReferenceImport_status_idx" ON "ReferenceImport"("status");

-- CreateIndex
CREATE INDEX "ReferenceInvoice_referenceImportId_idx" ON "ReferenceInvoice"("referenceImportId");

-- CreateIndex
CREATE INDEX "ReferenceInvoice_supplierGstin_normalizedInvoiceNumber_idx" ON "ReferenceInvoice"("supplierGstin", "normalizedInvoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ReferenceInvoice_referenceImportId_supplierGstin_normalized_key" ON "ReferenceInvoice"("referenceImportId", "supplierGstin", "normalizedInvoiceNumber", "invoiceDate");

-- CreateIndex
CREATE INDEX "UploadBatch_businessId_idx" ON "UploadBatch"("businessId");

-- CreateIndex
CREATE INDEX "UploadBatch_referenceImportId_idx" ON "UploadBatch"("referenceImportId");

-- CreateIndex
CREATE INDEX "UploadBatch_status_idx" ON "UploadBatch"("status");

-- CreateIndex
CREATE INDEX "UploadBatch_businessId_createdAt_idx" ON "UploadBatch"("businessId", "createdAt");

-- CreateIndex
CREATE INDEX "ReconciliationRow_batchId_idx" ON "ReconciliationRow"("batchId");

-- CreateIndex
CREATE INDEX "ReconciliationRow_matchedReferenceId_idx" ON "ReconciliationRow"("matchedReferenceId");

-- CreateIndex
CREATE INDEX "ReconciliationRow_processingStatus_idx" ON "ReconciliationRow"("processingStatus");

-- CreateIndex
CREATE INDEX "ReconciliationRow_reconciliationResult_idx" ON "ReconciliationRow"("reconciliationResult");

-- CreateIndex
CREATE INDEX "ReconciliationRow_supplierGstin_normalizedInvoiceNumber_idx" ON "ReconciliationRow"("supplierGstin", "normalizedInvoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ReconciliationRow_batchId_rowNumber_key" ON "ReconciliationRow"("batchId", "rowNumber");

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferenceImport" ADD CONSTRAINT "ReferenceImport_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferenceInvoice" ADD CONSTRAINT "ReferenceInvoice_referenceImportId_fkey" FOREIGN KEY ("referenceImportId") REFERENCES "ReferenceImport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadBatch" ADD CONSTRAINT "UploadBatch_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadBatch" ADD CONSTRAINT "UploadBatch_referenceImportId_fkey" FOREIGN KEY ("referenceImportId") REFERENCES "ReferenceImport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationRow" ADD CONSTRAINT "ReconciliationRow_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "UploadBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationRow" ADD CONSTRAINT "ReconciliationRow_matchedReferenceId_fkey" FOREIGN KEY ("matchedReferenceId") REFERENCES "ReferenceInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
