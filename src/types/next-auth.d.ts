import type { DefaultSession } from "next-auth";
import type { AuthRole } from "@/lib/auth-context";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      businessId: string;
      role: AuthRole;
    } & DefaultSession["user"];
  }

  interface User {
    userId: string;
    businessId: string;
    role: AuthRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    businessId?: string;
    role?: AuthRole;
  }
}
