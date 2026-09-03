"use server";

import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import { getSafeRedirectPath } from "@/lib/auth-redirect";
import { createSession, deleteSession } from "@/lib/auth";
import { getPrismaClient } from "@/lib/prisma";
import { formatZodIssues } from "@/lib/api-response";
import { loginSchema } from "@/lib/validation/auth";

export type LoginActionState = {
  errors?: {
    email?: string[];
    password?: string[];
    request?: string[];
  };
  message?: string;
};

const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password.";
const UNEXPECTED_AUTH_ERROR_MESSAGE =
  "Unable to sign in right now. Please try again.";
const DUMMY_PASSWORD_HASH =
  "$2b$12$f3j8MVOgXMW/kkJzK.KeT.dv3QwY6fbz1tNAeb5Ts/85t2IBP3ZwK";

export async function signInWithDemoCredentials(
  _state: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const validationResult = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next"),
  });

  if (!validationResult.success) {
    return {
      errors: formatZodIssues(validationResult.error),
      message: "Check the highlighted fields and try again.",
    };
  }

  const { email, password, next } = validationResult.data;

  try {
    const prisma = getPrismaClient();

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    const passwordHash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
    const validPassword = await bcrypt.compare(password, passwordHash);

    if (!user || !user.passwordHash || !validPassword) {
      return {
        message: INVALID_CREDENTIALS_MESSAGE,
      };
    }

    await createSession(user.id);
  } catch (error) {
    console.error("Failed to authenticate credentials", error);

    return {
      message: UNEXPECTED_AUTH_ERROR_MESSAGE,
    };
  }

  redirect(getSafeRedirectPath(next ?? null));
}

export async function signOut() {
  await deleteSession();
  redirect("/login");
}
