import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPrismaClient } from "@/lib/prisma";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
  verifySessionToken,
} from "@/lib/session-token";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string | null;
  businesses: {
    id: string;
    legalName: string;
    gstin: string;
  }[];
};

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const token = createSessionToken({
    userId,
    expiresAt: expiresAt.toISOString(),
  });
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  return verifySessionToken(token);
}

export async function getCurrentUser() {
  const session = await getCurrentSession();

  if (!session) {
    return null;
  }

  const prisma = getPrismaClient();

  return prisma.user.findUnique({
    where: {
      id: session.userId,
    },
    select: {
      id: true,
      email: true,
      name: true,
      businesses: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          legalName: true,
          gstin: true,
        },
      },
    },
  });
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user satisfies AuthenticatedUser;
}

export function getPrimaryBusiness(user: AuthenticatedUser) {
  const [business] = user.businesses;

  if (!business) {
    throw new Error("No business is associated with this user.");
  }

  return business;
}
