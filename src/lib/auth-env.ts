const DEVELOPMENT_AUTH_SECRET = "cleartax-local-development-auth-secret";
let warnedAboutDevelopmentSecret = false;

export function getAuthSecret() {
  const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

  if (authSecret) {
    return authSecret;
  }

  if (process.env.NODE_ENV !== "production") {
    if (!warnedAboutDevelopmentSecret) {
      console.warn(
        "AUTH_SECRET or NEXTAUTH_SECRET is not set. Using a local development-only auth secret.",
      );
      warnedAboutDevelopmentSecret = true;
    }

    return DEVELOPMENT_AUTH_SECRET;
  }

  throw new Error(
    "AUTH_SECRET or NEXTAUTH_SECRET must be set for authentication.",
  );
}
