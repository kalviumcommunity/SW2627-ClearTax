export const UPLOAD_FILE_FIELD_NAME = "file";
export const MAX_UPLOAD_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_PURCHASE_REGISTER_ROWS = 10_000;

export const JSON_UPLOAD_EXTENSIONS = [".json"] as const;
export const CSV_UPLOAD_EXTENSIONS = [".csv"] as const;

export const JSON_UPLOAD_MIME_TYPES = new Set([
  "application/json",
  "application/x-json",
  "text/json",
]);

export const CSV_UPLOAD_MIME_TYPES = new Set([
  "application/csv",
  "application/vnd.ms-excel",
  "text/csv",
]);

export const REQUIRED_PURCHASE_REGISTER_HEADERS = [
  "invoice_number",
  "supplier_gstin",
  "invoice_date",
  "taxable_value",
  "igst_amount",
  "cgst_amount",
  "sgst_amount",
  "cess_amount",
  "total_invoice_value",
] as const;

export type UploadValidationError = {
  status: number;
  code: string;
  message: string;
  details?: unknown;
};

type ValidationResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: UploadValidationError;
    };

type FileValidationConfig = {
  acceptedExtensions: readonly string[];
  acceptedMimeTypes: ReadonlySet<string>;
  fileKind: "GSTR-2B JSON" | "Purchase Register CSV";
};

export type ValidatedTextFile = {
  originalFilename: string;
  contentType: string | null;
  text: string;
};

export type Gstr2bValidationSummary = {
  gstin: string;
  returnPeriod: string | null;
  totalDocuments: number;
};

export type PurchaseRegisterCsvSummary = {
  headers: string[];
  totalRows: number;
};

export function isMultipartRequest(request: Request) {
  return (
    request.headers.get("content-type")?.toLowerCase().includes(
      "multipart/form-data",
    ) ?? false
  );
}

export async function parseMultipartFormData(
  request: Request,
): Promise<ValidationResult<FormData>> {
  try {
    return {
      success: true,
      data: await request.formData(),
    };
  } catch {
    return uploadError(
      400,
      "INVALID_MULTIPART_FORM",
      "Request body must be valid multipart form data.",
    );
  }
}

export function getRequiredUploadFile(
  formData: FormData,
  fieldName = UPLOAD_FILE_FIELD_NAME,
): ValidationResult<File> {
  const value = formData.get(fieldName);

  if (!isUploadedFile(value)) {
    return uploadError(
      400,
      "MISSING_UPLOAD_FILE",
      `Upload a file using the "${fieldName}" form field.`,
    );
  }

  return {
    success: true,
    data: value,
  };
}

export async function readValidatedTextFile(
  file: File,
  config: FileValidationConfig,
): Promise<ValidationResult<ValidatedTextFile>> {
  const metadataValidation = validateUploadedFileMetadata(file, config);

  if (!metadataValidation.success) {
    return metadataValidation;
  }

  let text: string;

  try {
    text = await file.text();
  } catch {
    return uploadError(
      400,
      "UNREADABLE_UPLOAD_FILE",
      "The uploaded file could not be read.",
    );
  }

  if (text.trim().length === 0) {
    return uploadError(400, "EMPTY_UPLOAD_FILE", "Uploaded file is empty.");
  }

  return {
    success: true,
    data: {
      ...metadataValidation.data,
      text,
    },
  };
}

export function validateGstr2bJson(
  text: string,
): ValidationResult<Gstr2bValidationSummary> {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    return uploadError(400, "INVALID_JSON", "Uploaded JSON is malformed.");
  }

  if (!isRecord(parsed)) {
    return invalidGstr2bStructure("GSTR-2B JSON must contain an object root.");
  }

  const payload = isRecord(parsed.data) ? parsed.data : parsed;
  const docData = payload.docdata;

  if (!isRecord(docData) || !Array.isArray(docData.b2b)) {
    return invalidGstr2bStructure(
      "GSTR-2B JSON must contain data.docdata.b2b invoice records.",
    );
  }

  const gstin = getStringValue(payload, ["gstin"]);

  if (!gstin) {
    return invalidGstr2bStructure("GSTR-2B JSON is missing gstin.");
  }

  const returnPeriod = getStringValue(payload, [
    "rtnprd",
    "returnPeriod",
    "return_period",
  ]);

  let totalDocuments = 0;

  for (const [supplierIndex, supplier] of docData.b2b.entries()) {
    if (!isRecord(supplier)) {
      return invalidGstr2bStructure(
        `GSTR-2B supplier record ${supplierIndex + 1} must be an object.`,
      );
    }

    if (!getStringValue(supplier, ["ctin", "supplierGstin"])) {
      return invalidGstr2bStructure(
        `GSTR-2B supplier record ${supplierIndex + 1} is missing supplier GSTIN.`,
      );
    }

    if (!Array.isArray(supplier.inv) || supplier.inv.length === 0) {
      return invalidGstr2bStructure(
        `GSTR-2B supplier record ${supplierIndex + 1} is missing invoices.`,
      );
    }

    for (const [invoiceIndex, invoice] of supplier.inv.entries()) {
      if (!isRecord(invoice)) {
        return invalidGstr2bStructure(
          `GSTR-2B invoice ${invoiceIndex + 1} for supplier ${
            supplierIndex + 1
          } must be an object.`,
        );
      }

      const invoiceLabel = `GSTR-2B invoice ${invoiceIndex + 1} for supplier ${
        supplierIndex + 1
      }`;

      if (!getStringValue(invoice, ["inum", "invoiceNumber"])) {
        return invalidGstr2bStructure(`${invoiceLabel} is missing invoice number.`);
      }

      if (!getStringValue(invoice, ["dt", "invoiceDate"])) {
        return invalidGstr2bStructure(`${invoiceLabel} is missing invoice date.`);
      }

      if (!hasNumericValue(invoice, ["val", "totalInvoiceValue"])) {
        return invalidGstr2bStructure(
          `${invoiceLabel} is missing total invoice value.`,
        );
      }

      if (!Array.isArray(invoice.items) || invoice.items.length === 0) {
        return invalidGstr2bStructure(`${invoiceLabel} is missing item values.`);
      }

      for (const [itemIndex, item] of invoice.items.entries()) {
        if (!isRecord(item)) {
          return invalidGstr2bStructure(
            `${invoiceLabel} item ${itemIndex + 1} must be an object.`,
          );
        }

        const itemLabel = `${invoiceLabel} item ${itemIndex + 1}`;

        if (!hasNumericValue(item, ["txval", "taxableValue"])) {
          return invalidGstr2bStructure(
            `${itemLabel} is missing taxable value.`,
          );
        }

        if (!hasNumericValue(item, ["iamt", "igst", "igstAmount"])) {
          return invalidGstr2bStructure(`${itemLabel} is missing IGST amount.`);
        }

        if (!hasNumericValue(item, ["camt", "cgst", "cgstAmount"])) {
          return invalidGstr2bStructure(`${itemLabel} is missing CGST amount.`);
        }

        if (!hasNumericValue(item, ["samt", "sgst", "sgstAmount"])) {
          return invalidGstr2bStructure(`${itemLabel} is missing SGST amount.`);
        }

        if (!hasNumericValue(item, ["cess", "csamt", "cessAmount"])) {
          return invalidGstr2bStructure(`${itemLabel} is missing cess amount.`);
        }
      }

      totalDocuments += 1;
    }
  }

  if (totalDocuments === 0) {
    return invalidGstr2bStructure(
      "GSTR-2B JSON does not contain supported B2B invoices.",
    );
  }

  return {
    success: true,
    data: {
      gstin,
      returnPeriod,
      totalDocuments,
    },
  };
}

export function validatePurchaseRegisterCsv(
  text: string,
): ValidationResult<PurchaseRegisterCsvSummary> {
  const csvParseResult = parseCsv(text);

  if (!csvParseResult.success) {
    return csvParseResult;
  }

  const rows = csvParseResult.data.filter((row) =>
    row.some((cell) => cell.trim().length > 0),
  );

  if (rows.length === 0) {
    return uploadError(
      400,
      "INVALID_CSV_HEADERS",
      "Purchase Register CSV is missing a header row.",
    );
  }

  const headers = rows[0].map((header) => header.trim());
  const duplicateHeaders = findDuplicateHeaders(headers);

  if (duplicateHeaders.length > 0) {
    return uploadError(
      400,
      "DUPLICATE_CSV_HEADERS",
      "Purchase Register CSV contains duplicate columns.",
      {
        duplicateHeaders,
      },
    );
  }

  const missingHeaders = REQUIRED_PURCHASE_REGISTER_HEADERS.filter(
    (header) => !headers.includes(header),
  );

  if (missingHeaders.length > 0) {
    return uploadError(
      400,
      "INVALID_CSV_HEADERS",
      "Purchase Register CSV is missing required columns.",
      {
        missingHeaders,
      },
    );
  }

  const totalRows = rows.length - 1;

  if (totalRows === 0) {
    return uploadError(
      400,
      "EMPTY_PURCHASE_REGISTER",
      "Purchase Register CSV does not contain invoice rows.",
    );
  }

  if (totalRows > MAX_PURCHASE_REGISTER_ROWS) {
    return uploadError(
      400,
      "TOO_MANY_CSV_ROWS",
      `Purchase Register CSV cannot exceed ${MAX_PURCHASE_REGISTER_ROWS} invoice rows.`,
      {
        maxRows: MAX_PURCHASE_REGISTER_ROWS,
      },
    );
  }

  return {
    success: true,
    data: {
      headers,
      totalRows,
    },
  };
}

export function deriveFinancialYearFromReturnPeriod(returnPeriod: string) {
  if (!/^(0[1-9]|1[0-2])\d{4}$/.test(returnPeriod)) {
    return null;
  }

  const month = Number(returnPeriod.slice(0, 2));
  const year = Number(returnPeriod.slice(2));
  const startYear = month >= 4 ? year : year - 1;
  const endYearSuffix = String((startYear + 1) % 100).padStart(2, "0");

  return `${startYear}-${endYearSuffix}`;
}

export function getOptionalFormString(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

export function getRequiredFormString(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);

  return typeof value === "string" ? value.trim() : "";
}

export function uploadError(
  status: number,
  code: string,
  message: string,
  details?: unknown,
): ValidationResult<never> {
  return {
    success: false,
    error: {
      status,
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };
}

function validateUploadedFileMetadata(
  file: File,
  config: FileValidationConfig,
): ValidationResult<Omit<ValidatedTextFile, "text">> {
  if (file.size === 0) {
    return uploadError(400, "EMPTY_UPLOAD_FILE", "Uploaded file is empty.");
  }

  if (file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
    return uploadError(
      413,
      "UPLOAD_FILE_TOO_LARGE",
      `Uploaded file exceeds the ${formatMegabytes(
        MAX_UPLOAD_FILE_SIZE_BYTES,
      )} limit.`,
      {
        maxFileSizeBytes: MAX_UPLOAD_FILE_SIZE_BYTES,
      },
    );
  }

  const originalFilename = sanitizeOriginalFilename(file.name);
  const extension = getFileExtension(originalFilename);

  if (!config.acceptedExtensions.includes(extension)) {
    return uploadError(
      400,
      "UNSUPPORTED_FILE_EXTENSION",
      `${config.fileKind} uploads must use ${formatList(
        config.acceptedExtensions,
      )} files.`,
      {
        acceptedExtensions: config.acceptedExtensions,
      },
    );
  }

  const contentType = file.type.trim().toLowerCase();

  if (contentType && !config.acceptedMimeTypes.has(contentType)) {
    return uploadError(
      400,
      "UNSUPPORTED_MIME_TYPE",
      `${config.fileKind} upload has an unsupported content type.`,
      {
        acceptedMimeTypes: Array.from(config.acceptedMimeTypes),
      },
    );
  }

  return {
    success: true,
    data: {
      originalFilename,
      contentType: contentType || null,
    },
  };
}

function parseCsv(text: string): ValidationResult<string[][]> {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (inQuotes) {
      if (character === "\"") {
        if (text[index + 1] === "\"") {
          field += "\"";
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += character;
      }

      continue;
    }

    if (character === "\"") {
      if (field.length > 0) {
        return malformedCsv("CSV contains an unexpected quote.");
      }

      inQuotes = true;
      continue;
    }

    if (character === ",") {
      row.push(field);
      field = "";
      continue;
    }

    if (character === "\r" || character === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";

      if (character === "\r" && text[index + 1] === "\n") {
        index += 1;
      }

      continue;
    }

    field += character;
  }

  if (inQuotes) {
    return malformedCsv("CSV contains an unterminated quoted field.");
  }

  row.push(field);
  rows.push(row);

  return {
    success: true,
    data: rows,
  };
}

function malformedCsv(message: string): ValidationResult<never> {
  return uploadError(400, "MALFORMED_CSV", message);
}

function invalidGstr2bStructure(message: string): ValidationResult<never> {
  return uploadError(400, "INVALID_GSTR2B_STRUCTURE", message);
}

function sanitizeOriginalFilename(filename: string) {
  const basename = filename.split(/[/\\]/).pop()?.trim() ?? "";
  const withoutControlCharacters = basename.replace(/[\u0000-\u001f\u007f]/g, "");

  return withoutControlCharacters || "upload";
}

function getFileExtension(filename: string) {
  const lastDotIndex = filename.lastIndexOf(".");

  return lastDotIndex >= 0 ? filename.slice(lastDotIndex).toLowerCase() : "";
}

function findDuplicateHeaders(headers: string[]) {
  const seenHeaders = new Set<string>();
  const duplicateHeaders = new Set<string>();

  for (const header of headers) {
    if (!header) {
      continue;
    }

    if (seenHeaders.has(header)) {
      duplicateHeaders.add(header);
    }

    seenHeaders.add(header);
  }

  return Array.from(duplicateHeaders);
}

function getStringValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

function hasNumericValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return true;
    }

    if (
      typeof value === "string" &&
      value.trim().length > 0 &&
      Number.isFinite(Number(value))
    ) {
      return true;
    }
  }

  return false;
}

function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "size" in value &&
    "type" in value &&
    "text" in value &&
    typeof value.name === "string" &&
    typeof value.size === "number" &&
    typeof value.type === "string" &&
    typeof value.text === "function"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatMegabytes(bytes: number) {
  return `${bytes / (1024 * 1024)} MB`;
}

function formatList(values: readonly string[]) {
  return values.map((value) => `\`${value}\``).join(", ");
}
