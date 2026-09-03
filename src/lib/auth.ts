import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import type { AuthContext } from "@/lib/auth-context";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string | null;
  businessId: string;
  role: AuthContext["role"];
};

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  if (
    !session?.user?.id ||
    !session.user.email ||
    !session.user.businessId ||
    !session.user.role
  ) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name ?? null,
    businessId: session.user.businessId,
    role: session.user.role,
  } satisfies AuthenticatedUser;
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user satisfies AuthenticatedUser;
}

export async function requireAuthContext() {
  const user = await requireCurrentUser();

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    businessId: user.businessId,
    role: user.role,
  } satisfies AuthContext;
}
