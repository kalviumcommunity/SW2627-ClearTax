import { apiError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";

export async function requireApiUser() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      success: false,
      response: apiError(401, "UNAUTHORIZED", "Authentication is required."),
    } as const;
  }

  return {
    success: true,
    auth: {
      userId: user.id,
      email: user.email,
      name: user.name,
      businessId: user.businessId,
      role: user.role,
    },
  } as const;
}
