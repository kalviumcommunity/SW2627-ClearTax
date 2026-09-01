import { z } from "zod";

export function requiredTrimmedString(field: string, maxLength?: number) {
  let schema = z
    .string({
      error: `${field} is required.`,
    })
    .trim()
    .min(1, `${field} is required.`);

  if (maxLength !== undefined) {
    schema = schema.max(
      maxLength,
      `${field} must be ${maxLength} characters or fewer.`,
    );
  }

  return schema;
}

export function optionalTrimmedString(field: string, maxLength?: number) {
  let schema = z
    .string({
      error: `${field} must be a non-empty string.`,
    })
    .trim()
    .min(1, `${field} must be a non-empty string.`);

  if (maxLength !== undefined) {
    schema = schema.max(
      maxLength,
      `${field} must be ${maxLength} characters or fewer.`,
    );
  }

  return z.preprocess(
    (value) => (value === null ? undefined : value),
    schema.optional(),
  );
}

export function uuidString(field: string) {
  return requiredTrimmedString(field).uuid(`${field} must be a valid UUID.`);
}
