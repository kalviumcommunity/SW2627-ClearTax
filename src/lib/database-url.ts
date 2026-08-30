const SSL_MODES_REQUIRING_EXPLICIT_PG_SEMANTICS = new Set([
  "prefer",
  "require",
  "verify-ca",
]);

export function normalizeDatabaseUrl(connectionString: string) {
  try {
    const url = new URL(connectionString);

    if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
      return connectionString;
    }

    const sslMode = url.searchParams.get("sslmode");

    if (
      sslMode &&
      SSL_MODES_REQUIRING_EXPLICIT_PG_SEMANTICS.has(sslMode.toLowerCase())
    ) {
      url.searchParams.set("sslmode", "require");
      url.searchParams.set("uselibpqcompat", "true");
    }

    return url.toString();
  } catch {
    return connectionString;
  }
}
