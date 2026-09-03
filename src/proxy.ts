import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getAuthSecret } from "@/lib/auth-env";

const LOGIN_PATH = "/login";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({
    req: request,
    secret: getAuthSecret(),
  });
  const hasAuthContext =
    typeof token?.userId === "string" &&
    typeof token.businessId === "string" &&
    typeof token.role === "string";

  if (pathname === LOGIN_PATH) {
    if (hasAuthContext) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  if (!hasAuthContext) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("next", pathname);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
