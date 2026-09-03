export type AuthRole = "OWNER";

export type AuthContext = {
  userId: string;
  email: string;
  name: string | null;
  businessId: string;
  role: AuthRole;
};

export const OWNER_ROLE: AuthRole = "OWNER";
