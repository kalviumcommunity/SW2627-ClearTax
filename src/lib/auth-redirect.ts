const DEFAULT_AUTHENTICATED_PATH = "/";

export function getSafeRedirectPath(value: FormDataEntryValue | string | null) {
  if (typeof value !== "string") {
    return DEFAULT_AUTHENTICATED_PATH;
  }

  const trimmedValue = value.trim();

  if (
    !trimmedValue.startsWith("/") ||
    trimmedValue.startsWith("//") ||
    trimmedValue.startsWith("/login")
  ) {
    return DEFAULT_AUTHENTICATED_PATH;
  }

  return trimmedValue;
}
