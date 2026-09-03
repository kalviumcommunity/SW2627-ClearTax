import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";
import { z } from "zod";

export const SESSION_COOKIE_NAME = "cleartax_session";
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

const SESSION_TOKEN_VERSION = "v1";
const SESSION_TOKEN_AAD = Buffer.from("cleartax.session.v1");

const sessionPayloadSchema = z.object({
  userId: z.string().uuid(),
  expiresAt: z.string().datetime(),
});

export type SessionPayload = z.infer<typeof sessionPayloadSchema>;

export function createSessionToken(payload: SessionPayload) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getSessionEncryptionKey(), iv);
  cipher.setAAD(SESSION_TOKEN_AAD);

  const encryptedPayload = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    SESSION_TOKEN_VERSION,
    toBase64Url(iv),
    toBase64Url(encryptedPayload),
    toBase64Url(authTag),
  ].join(".");
}

export function verifySessionToken(token: string | undefined) {
  if (!token) {
    return null;
  }

  const [version, iv, encryptedPayload, authTag] = token.split(".");

  if (
    version !== SESSION_TOKEN_VERSION ||
    !iv ||
    !encryptedPayload ||
    !authTag
  ) {
    return null;
  }

  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      getSessionEncryptionKey(),
      fromBase64Url(iv),
    );
    decipher.setAAD(SESSION_TOKEN_AAD);
    decipher.setAuthTag(fromBase64Url(authTag));

    const decryptedPayload = Buffer.concat([
      decipher.update(fromBase64Url(encryptedPayload)),
      decipher.final(),
    ]).toString("utf8");

    const validationResult = sessionPayloadSchema.safeParse(
      JSON.parse(decryptedPayload),
    );

    if (!validationResult.success) {
      return null;
    }

    if (Date.parse(validationResult.data.expiresAt) <= Date.now()) {
      return null;
    }

    return validationResult.data;
  } catch {
    return null;
  }
}

function getSessionEncryptionKey() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }

  return createHash("sha256").update(secret).digest();
}

function toBase64Url(value: Buffer) {
  return value.toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url");
}
