import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/session-token";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Login is a public route.
  if (pathname === "/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);

  if (session) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);

  loginUrl.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/",
    "/reconciliations/:path*",
    "/reference-imports/:path*",
    "/help/:path*",
  ],
};