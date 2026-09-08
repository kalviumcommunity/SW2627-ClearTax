import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { Prisma, PrismaClient } from "../src/generated/prisma/client";
import { normalizeDatabaseUrl } from "../src/lib/database-url";

const DEMO_PASSWORD_SALT = "$2b$12$f3j8MVOgXMW/kkJzK.KeT.";
const DEMO_REFERENCE_IMPORT_ID = "11111111-1111-4111-8111-111111111111";
const DEMO_UPLOAD_BATCH_ID = "22222222-2222-4222-8222-222222222222";
const SEED_STARTED_AT = new Date("2026-09-01T04:30:00.000Z");
const SEED_COMPLETED_AT = new Date("2026-09-01T04:34:00.000Z");

const demoUser = {
  email: "demo@cleartax.local",
  name: "Demo Accountant",
  password: "ClearTaxDemo#2026",
};

const demoBusiness = {
  legalName: "ClearTax Demo Private Limited",
  gstin: "29ABCDE1234F1Z5",
};

type ReferenceInvoiceSeed = {
  id: string;
  supplierGstin: string;
  supplierName: string;
  invoiceNumber: string;
  invoiceDate: string;
  taxableValue: string;
  igstAmount: string;
  cgstAmount: string;
  sgstAmount: string;
  cessAmount: string;
  totalInvoiceValue: string;
};

type ReconciliationRowSeed = {
  id: string;
  rowNumber: number;
  rawData: Prisma.InputJsonValue;
  invoiceNumber: string | null;
  normalizedInvoiceNumber: string | null;
  supplierGstin: string | null;
  invoiceDate: string | null;
  taxableValue: string | null;
  igstAmount: string | null;
  cgstAmount: string | null;
  sgstAmount: string | null;
  cessAmount: string | null;
  totalInvoiceValue: string | null;
  processingStatus: "COMPLETED" | "FAILED";
  reconciliationResult: "MATCHED" | "MISMATCHED" | "ERROR";
  errorCode?: "INVALID_GSTIN" | "MISSING_INVOICE_NUMBER";
  errorMessage?: string;
  matchedReferenceId?: string;
  mismatchCodes?: string[];
  mismatchDetails?: Prisma.InputJsonValue;
};

const referenceImport = {
  gstin: demoBusiness.gstin,
  financialYear: "2026-27",
  returnPeriod: "082026",
  originalFilename: "demo-gstr-2b-aug-2026.json",
  storageObjectKey: "demo/reference/demo-gstr-2b-aug-2026.json",
};

const uploadBatch = {
  originalFilename: "demo-purchase-register-aug-2026.csv",
  storageObjectKey: "demo/uploads/demo-purchase-register-aug-2026.csv",
};

const referenceInvoices: ReferenceInvoiceSeed[] = [
  {
    id: "30000000-0000-4000-8000-000000000001",
    supplierGstin: "29AAACF1354Q1Z2",
    supplierName: "FinOps Services Private Limited",
    invoiceNumber: "FOP/26-27/001",
    invoiceDate: "2026-08-03",
    taxableValue: "25000.00",
    igstAmount: "0.00",
    cgstAmount: "2250.00",
    sgstAmount: "2250.00",
    cessAmount: "0.00",
    totalInvoiceValue: "29500.00",
  },
  {
    id: "30000000-0000-4000-8000-000000000002",
    supplierGstin: "27AABCM4752C1ZV",
    supplierName: "Mumbai Cloud Technologies Limited",
    invoiceNumber: "MCT-0826-114",
    invoiceDate: "2026-08-05",
    taxableValue: "48000.00",
    igstAmount: "8640.00",
    cgstAmount: "0.00",
    sgstAmount: "0.00",
    cessAmount: "0.00",
    totalInvoiceValue: "56640.00",
  },
  {
    id: "30000000-0000-4000-8000-000000000003",
    supplierGstin: "29AACCB2230M1Z8",
    supplierName: "Bengaluru Hardware Mart",
    invoiceNumber: "BHM/2026/778",
    invoiceDate: "2026-08-08",
    taxableValue: "125000.00",
    igstAmount: "0.00",
    cgstAmount: "11250.00",
    sgstAmount: "11250.00",
    cessAmount: "0.00",
    totalInvoiceValue: "147500.00",
  },
  {
    id: "30000000-0000-4000-8000-000000000004",
    supplierGstin: "07AADCD1122E1Z9",
    supplierName: "Delhi Logistics Network",
    invoiceNumber: "DLN/0826/045",
    invoiceDate: "2026-08-10",
    taxableValue: "10000.00",
    igstAmount: "1800.00",
    cgstAmount: "0.00",
    sgstAmount: "0.00",
    cessAmount: "0.00",
    totalInvoiceValue: "11800.00",
  },
  {
    id: "30000000-0000-4000-8000-000000000005",
    supplierGstin: "27AACCP1234Q1Z4",
    supplierName: "Pune Office Supplies",
    invoiceNumber: "POS-26-0091",
    invoiceDate: "2026-08-12",
    taxableValue: "18000.00",
    igstAmount: "3240.00",
    cgstAmount: "0.00",
    sgstAmount: "0.00",
    cessAmount: "0.00",
    totalInvoiceValue: "21240.00",
  },
  {
    id: "30000000-0000-4000-8000-000000000006",
    supplierGstin: "33AACCC6789D1Z3",
    supplierName: "Chennai Tax Advisory",
    invoiceNumber: "CTA/26/221",
    invoiceDate: "2026-08-14",
    taxableValue: "30000.00",
    igstAmount: "5400.00",
    cgstAmount: "0.00",
    sgstAmount: "0.00",
    cessAmount: "0.00",
    totalInvoiceValue: "35400.00",
  },
  {
    id: "30000000-0000-4000-8000-000000000007",
    supplierGstin: "24AABCA8056G1ZP",
    supplierName: "Ahmedabad Packaging Co",
    invoiceNumber: "APC/0826/310",
    invoiceDate: "2026-08-15",
    taxableValue: "41000.00",
    igstAmount: "7380.00",
    cgstAmount: "0.00",
    sgstAmount: "0.00",
    cessAmount: "0.00",
    totalInvoiceValue: "48380.00",
  },
  {
    id: "30000000-0000-4000-8000-000000000008",
    supplierGstin: "08AACJS9012L1Z6",
    supplierName: "Jaipur Software Studio",
    invoiceNumber: "JSS-2026-188",
    invoiceDate: "2026-08-18",
    taxableValue: "22000.00",
    igstAmount: "3960.00",
    cgstAmount: "0.00",
    sgstAmount: "0.00",
    cessAmount: "0.00",
    totalInvoiceValue: "25960.00",
  },
  {
    id: "30000000-0000-4000-8000-000000000009",
    supplierGstin: "19AACCK9901A1Z7",
    supplierName: "Kolkata Analytics LLP",
    invoiceNumber: "KAL/26-27/076",
    invoiceDate: "2026-08-20",
    taxableValue: "36500.00",
    igstAmount: "6570.00",
    cgstAmount: "0.00",
    sgstAmount: "0.00",
    cessAmount: "0.00",
    totalInvoiceValue: "43070.00",
  },
  {
    id: "30000000-0000-4000-8000-000000000010",
    supplierGstin: "36AADCH7654R1Z1",
    supplierName: "Hyderabad Travel Desk",
    invoiceNumber: "HTD/AUG/502",
    invoiceDate: "2026-08-24",
    taxableValue: "15600.00",
    igstAmount: "2808.00",
    cgstAmount: "0.00",
    sgstAmount: "0.00",
    cessAmount: "0.00",
    totalInvoiceValue: "18408.00",
  },
];

const reconciliationRows: ReconciliationRowSeed[] = [
  ...referenceInvoices.slice(0, 5).map((invoice, index) => ({
    id: `40000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    rowNumber: index + 1,
    rawData: toRawRow(invoice, "Matched purchase-register row"),
    invoiceNumber: invoice.invoiceNumber,
    normalizedInvoiceNumber: normalizeInvoiceNumber(invoice.invoiceNumber),
    supplierGstin: invoice.supplierGstin,
    invoiceDate: invoice.invoiceDate,
    taxableValue: invoice.taxableValue,
    igstAmount: invoice.igstAmount,
    cgstAmount: invoice.cgstAmount,
    sgstAmount: invoice.sgstAmount,
    cessAmount: invoice.cessAmount,
    totalInvoiceValue: invoice.totalInvoiceValue,
    processingStatus: "COMPLETED" as const,
    reconciliationResult: "MATCHED" as const,
    matchedReferenceId: invoice.id,
  })),
  {
    id: "40000000-0000-4000-8000-000000000006",
    rowNumber: 6,
    rawData: toRawRow(referenceInvoices[5], "Taxable and GST amount mismatch"),
    invoiceNumber: referenceInvoices[5].invoiceNumber,
    normalizedInvoiceNumber: normalizeInvoiceNumber(
      referenceInvoices[5].invoiceNumber,
    ),
    supplierGstin: referenceInvoices[5].supplierGstin,
    invoiceDate: referenceInvoices[5].invoiceDate,
    taxableValue: "31000.00",
    igstAmount: "5580.00",
    cgstAmount: "0.00",
    sgstAmount: "0.00",
    cessAmount: "0.00",
    totalInvoiceValue: "36580.00",
    processingStatus: "COMPLETED",
    reconciliationResult: "MISMATCHED",
    matchedReferenceId: referenceInvoices[5].id,
    mismatchCodes: [
      "TAXABLE_VALUE_MISMATCH",
      "TAX_AMOUNT_MISMATCH",
      "TOTAL_VALUE_MISMATCH",
    ],
    mismatchDetails: {
      taxableValue: {
        reference: referenceInvoices[5].taxableValue,
        uploaded: "31000.00",
      },
      igstAmount: {
        reference: referenceInvoices[5].igstAmount,
        uploaded: "5580.00",
      },
      totalInvoiceValue: {
        reference: referenceInvoices[5].totalInvoiceValue,
        uploaded: "36580.00",
      },
    },
  },
  {
    id: "40000000-0000-4000-8000-000000000007",
    rowNumber: 7,
    rawData: toRawRow(referenceInvoices[6], "Invoice date mismatch"),
    invoiceNumber: referenceInvoices[6].invoiceNumber,
    normalizedInvoiceNumber: normalizeInvoiceNumber(
      referenceInvoices[6].invoiceNumber,
    ),
    supplierGstin: referenceInvoices[6].supplierGstin,
    invoiceDate: "2026-08-16",
    taxableValue: referenceInvoices[6].taxableValue,
    igstAmount: referenceInvoices[6].igstAmount,
    cgstAmount: referenceInvoices[6].cgstAmount,
    sgstAmount: referenceInvoices[6].sgstAmount,
    cessAmount: referenceInvoices[6].cessAmount,
    totalInvoiceValue: referenceInvoices[6].totalInvoiceValue,
    processingStatus: "COMPLETED",
    reconciliationResult: "MISMATCHED",
    matchedReferenceId: referenceInvoices[6].id,
    mismatchCodes: ["INVOICE_DATE_MISMATCH"],
    mismatchDetails: {
      invoiceDate: {
        reference: referenceInvoices[6].invoiceDate,
        uploaded: "2026-08-16",
      },
    },
  },
  {
    id: "40000000-0000-4000-8000-000000000008",
    rowNumber: 8,
    rawData: toRawRow(referenceInvoices[7], "Supplier GSTIN mismatch"),
    invoiceNumber: referenceInvoices[7].invoiceNumber,
    normalizedInvoiceNumber: normalizeInvoiceNumber(
      referenceInvoices[7].invoiceNumber,
    ),
    supplierGstin: "08AACJS9012L1Z8",
    invoiceDate: referenceInvoices[7].invoiceDate,
    taxableValue: referenceInvoices[7].taxableValue,
    igstAmount: referenceInvoices[7].igstAmount,
    cgstAmount: referenceInvoices[7].cgstAmount,
    sgstAmount: referenceInvoices[7].sgstAmount,
    cessAmount: referenceInvoices[7].cessAmount,
    totalInvoiceValue: referenceInvoices[7].totalInvoiceValue,
    processingStatus: "COMPLETED",
    reconciliationResult: "MISMATCHED",
    matchedReferenceId: referenceInvoices[7].id,
    mismatchCodes: ["SUPPLIER_GSTIN_MISMATCH"],
    mismatchDetails: {
      supplierGstin: {
        reference: referenceInvoices[7].supplierGstin,
        uploaded: "08AACJS9012L1Z8",
      },
    },
  },
  {
    id: "40000000-0000-4000-8000-000000000009",
    rowNumber: 9,
    rawData: {
      supplierGstin: "BADGSTIN0000000",
      supplierName: "Malformed Supplier Row",
      invoiceNumber: "BAD-GSTIN-001",
      invoiceDate: "2026-08-21",
      taxableValue: "9000.00",
      igstAmount: "1620.00",
      totalInvoiceValue: "10620.00",
      note: "Invalid GSTIN error demo row",
    },
    invoiceNumber: "BAD-GSTIN-001",
    normalizedInvoiceNumber: normalizeInvoiceNumber("BAD-GSTIN-001"),
    supplierGstin: "BADGSTIN0000000",
    invoiceDate: "2026-08-21",
    taxableValue: "9000.00",
    igstAmount: "1620.00",
    cgstAmount: "0.00",
    sgstAmount: "0.00",
    cessAmount: "0.00",
    totalInvoiceValue: "10620.00",
    processingStatus: "FAILED",
    reconciliationResult: "ERROR",
    errorCode: "INVALID_GSTIN",
    errorMessage: "Supplier GSTIN does not match the GSTIN format.",
  },
  {
    id: "40000000-0000-4000-8000-000000000010",
    rowNumber: 10,
    rawData: {
      supplierGstin: "36AADCH7654R1Z1",
      supplierName: "Hyderabad Travel Desk",
      invoiceNumber: "",
      invoiceDate: "2026-08-24",
      taxableValue: "15600.00",
      igstAmount: "2808.00",
      totalInvoiceValue: "18408.00",
      note: "Missing invoice number error demo row",
    },
    invoiceNumber: null,
    normalizedInvoiceNumber: null,
    supplierGstin: referenceInvoices[9].supplierGstin,
    invoiceDate: referenceInvoices[9].invoiceDate,
    taxableValue: referenceInvoices[9].taxableValue,
    igstAmount: referenceInvoices[9].igstAmount,
    cgstAmount: referenceInvoices[9].cgstAmount,
    sgstAmount: referenceInvoices[9].sgstAmount,
    cessAmount: referenceInvoices[9].cessAmount,
    totalInvoiceValue: referenceInvoices[9].totalInvoiceValue,
    processingStatus: "FAILED",
    reconciliationResult: "ERROR",
    errorCode: "MISSING_INVOICE_NUMBER",
    errorMessage: "Invoice number is required before reconciliation.",
  },
];

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new pg.Pool({
    connectionString: normalizeDatabaseUrl(databaseUrl),
  });

  return new PrismaClient({
    adapter: new PrismaPg(pool, {
      disposeExternalPool: true,
    }),
  });
}

async function main() {
  const prisma = createPrismaClient();
  const passwordHash = await bcrypt.hash(demoUser.password, DEMO_PASSWORD_SALT);

  try {
    const user = await prisma.user.upsert({
      where: {
        email: demoUser.email,
      },
      update: {
        name: demoUser.name,
        passwordHash,
        updatedAt: SEED_COMPLETED_AT,
      },
      create: {
        email: demoUser.email,
        name: demoUser.name,
        passwordHash,
        createdAt: SEED_STARTED_AT,
        updatedAt: SEED_COMPLETED_AT,
      },
      select: {
        id: true,
        email: true,
      },
    });

    const business = await prisma.business.upsert({
      where: {
        gstin: demoBusiness.gstin,
      },
      update: {
        legalName: demoBusiness.legalName,
        ownerId: user.id,
        updatedAt: SEED_COMPLETED_AT,
      },
      create: {
        legalName: demoBusiness.legalName,
        gstin: demoBusiness.gstin,
        ownerId: user.id,
        createdAt: SEED_STARTED_AT,
        updatedAt: SEED_COMPLETED_AT,
      },
      select: {
        id: true,
        gstin: true,
      },
    });

    await prisma.referenceImport.upsert({
      where: {
        id: DEMO_REFERENCE_IMPORT_ID,
      },
      update: {
        businessId: business.id,
        gstin: referenceImport.gstin,
        financialYear: referenceImport.financialYear,
        returnPeriod: referenceImport.returnPeriod,
        originalFilename: referenceImport.originalFilename,
        storageObjectKey: referenceImport.storageObjectKey,
        status: "READY",
        totalDocuments: referenceInvoices.length,
        importedDocuments: referenceInvoices.length,
        skippedDocuments: 0,
        failedDocuments: 0,
        isActive: true,
        updatedAt: SEED_COMPLETED_AT,
        startedAt: SEED_STARTED_AT,
        completedAt: SEED_COMPLETED_AT,
      },
      create: {
        id: DEMO_REFERENCE_IMPORT_ID,
        businessId: business.id,
        gstin: referenceImport.gstin,
        financialYear: referenceImport.financialYear,
        returnPeriod: referenceImport.returnPeriod,
        originalFilename: referenceImport.originalFilename,
        storageObjectKey: referenceImport.storageObjectKey,
        status: "READY",
        totalDocuments: referenceInvoices.length,
        importedDocuments: referenceInvoices.length,
        skippedDocuments: 0,
        failedDocuments: 0,
        isActive: true,
        createdAt: SEED_STARTED_AT,
        updatedAt: SEED_COMPLETED_AT,
        startedAt: SEED_STARTED_AT,
        completedAt: SEED_COMPLETED_AT,
      },
    });

    for (const invoice of referenceInvoices) {
      await prisma.referenceInvoice.upsert({
        where: {
          id: invoice.id,
        },
        update: toReferenceInvoiceData(invoice),
        create: {
          id: invoice.id,
          ...toReferenceInvoiceData(invoice),
          createdAt: SEED_STARTED_AT,
        },
      });
    }

    await prisma.uploadBatch.upsert({
      where: {
        id: DEMO_UPLOAD_BATCH_ID,
      },
      update: {
        businessId: business.id,
        referenceImportId: DEMO_REFERENCE_IMPORT_ID,
        originalFilename: uploadBatch.originalFilename,
        storageObjectKey: uploadBatch.storageObjectKey,
        status: "COMPLETED_WITH_ERRORS",
        totalRows: reconciliationRows.length,
        processedRows: reconciliationRows.length,
        matchedRows: countRows("MATCHED"),
        mismatchedRows: countRows("MISMATCHED"),
        errorRows: countRows("ERROR"),
        fileErrorMessage: null,
        updatedAt: SEED_COMPLETED_AT,
        startedAt: SEED_STARTED_AT,
        completedAt: SEED_COMPLETED_AT,
      },
      create: {
        id: DEMO_UPLOAD_BATCH_ID,
        businessId: business.id,
        referenceImportId: DEMO_REFERENCE_IMPORT_ID,
        originalFilename: uploadBatch.originalFilename,
        storageObjectKey: uploadBatch.storageObjectKey,
        status: "COMPLETED_WITH_ERRORS",
        totalRows: reconciliationRows.length,
        processedRows: reconciliationRows.length,
        matchedRows: countRows("MATCHED"),
        mismatchedRows: countRows("MISMATCHED"),
        errorRows: countRows("ERROR"),
        fileErrorMessage: null,
        createdAt: SEED_STARTED_AT,
        updatedAt: SEED_COMPLETED_AT,
        startedAt: SEED_STARTED_AT,
        completedAt: SEED_COMPLETED_AT,
      },
    });

    await prisma.reconciliationRow.deleteMany({
      where: {
        batchId: DEMO_UPLOAD_BATCH_ID,
      },
    });

    await prisma.reconciliationRow.createMany({
      data: reconciliationRows.map((row) => ({
        id: row.id,
        batchId: DEMO_UPLOAD_BATCH_ID,
        rowNumber: row.rowNumber,
        rawData: row.rawData,
        invoiceNumber: row.invoiceNumber,
        normalizedInvoiceNumber: row.normalizedInvoiceNumber,
        supplierGstin: row.supplierGstin,
        invoiceDate: row.invoiceDate
          ? new Date(`${row.invoiceDate}T00:00:00.000Z`)
          : null,
        taxableValue: row.taxableValue,
        igstAmount: row.igstAmount,
        cgstAmount: row.cgstAmount,
        sgstAmount: row.sgstAmount,
        cessAmount: row.cessAmount,
        totalInvoiceValue: row.totalInvoiceValue,
        processingStatus: row.processingStatus,
        reconciliationResult: row.reconciliationResult,
        errorCode: row.errorCode,
        errorMessage: row.errorMessage,
        matchedReferenceId: row.matchedReferenceId,
        mismatchCodes: row.mismatchCodes ?? [],
        mismatchDetails: row.mismatchDetails,
        createdAt: SEED_STARTED_AT,
        updatedAt: SEED_COMPLETED_AT,
        processedAt: SEED_COMPLETED_AT,
      })),
    });

    console.info(
      [
        `Seeded demo user ${user.email} and business ${business.gstin}.`,
        `Reference invoices: ${referenceInvoices.length}.`,
        `Reconciliation rows: ${reconciliationRows.length}`,
        `(${countRows("MATCHED")} matched, ${countRows("MISMATCHED")} mismatched, ${countRows("ERROR")} errors).`,
      ].join(" "),
    );
  } finally {
    await prisma.$disconnect();
  }
}

function toReferenceInvoiceData(invoice: ReferenceInvoiceSeed) {
  return {
    referenceImportId: DEMO_REFERENCE_IMPORT_ID,
    supplierGstin: invoice.supplierGstin,
    invoiceNumber: invoice.invoiceNumber,
    normalizedInvoiceNumber: normalizeInvoiceNumber(invoice.invoiceNumber),
    invoiceDate: new Date(`${invoice.invoiceDate}T00:00:00.000Z`),
    taxableValue: invoice.taxableValue,
    igstAmount: invoice.igstAmount,
    cgstAmount: invoice.cgstAmount,
    sgstAmount: invoice.sgstAmount,
    cessAmount: invoice.cessAmount,
    totalInvoiceValue: invoice.totalInvoiceValue,
    updatedAt: SEED_COMPLETED_AT,
  };
}

function toRawRow(invoice: ReferenceInvoiceSeed, note: string) {
  return {
    supplierGstin: invoice.supplierGstin,
    supplierName: invoice.supplierName,
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate,
    taxableValue: invoice.taxableValue,
    igstAmount: invoice.igstAmount,
    cgstAmount: invoice.cgstAmount,
    sgstAmount: invoice.sgstAmount,
    cessAmount: invoice.cessAmount,
    totalInvoiceValue: invoice.totalInvoiceValue,
    note,
  };
}

function normalizeInvoiceNumber(invoiceNumber: string) {
  return invoiceNumber.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function countRows(result: ReconciliationRowSeed["reconciliationResult"]) {
  return reconciliationRows.filter(
    (row) => row.reconciliationResult === result,
  ).length;
}

main().catch((error: unknown) => {
  console.error("Failed to seed demo data", error);
  process.exit(1);
});
