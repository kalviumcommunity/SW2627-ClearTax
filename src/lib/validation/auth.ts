import { z } from "zod";
import { requiredTrimmedString } from "@/lib/validation/common";
import { gstinSchema } from "@/lib/validation/reconciliation";

export const loginSchema = z.object({
  email: requiredTrimmedString("email")
    .email("Enter a valid email address.")
    .transform((email) => email.toLowerCase()),
  password: requiredTrimmedString("password"),
  next: z.string().optional(),
});

const signupGstinSchema = requiredTrimmedString("gstin")
  .transform((gstin) => gstin.toUpperCase())
  .pipe(gstinSchema);

export const signupSchema = loginSchema
  .omit({
    next: true,
  })
  .extend({
    name: requiredTrimmedString("name", 120),
    password: requiredTrimmedString("password").min(
      8,
      "password must be at least 8 characters.",
    ),
    businessLegalName: requiredTrimmedString("businessLegalName", 180),
    businessGstin: signupGstinSchema,
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
