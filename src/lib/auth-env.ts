export function getAuthSecret() {
  const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

  if (!authSecret) {
    throw new Error(
      "AUTH_SECRET or NEXTAUTH_SECRET must be set for authentication.",
    );
  }

  return authSecret;
}
