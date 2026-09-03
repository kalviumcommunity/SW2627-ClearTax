import { z } from "zod";
import { requiredTrimmedString } from "@/lib/validation/common";

export const loginSchema = z.object({
  email: requiredTrimmedString("email")
    .email("Enter a valid email address.")
    .transform((email) => email.toLowerCase()),
  password: requiredTrimmedString("password"),
  next: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
