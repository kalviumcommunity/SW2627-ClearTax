import "server-only";

import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: {
    paths: [
      "authorization",
      "cookie",
      "cookies",
      "password",
      "passwordHash",
      "token",
      "accessToken",
      "refreshToken",
      "sessionToken",
      "apiKey",
      "secret",
      "clientSecret",
      "DATABASE_URL",
      "databaseUrl",
      "headers.authorization",
      "headers.cookie",
      "req.headers.authorization",
      "req.headers.cookie",
      "*.authorization",
      "*.cookie",
      "*.cookies",
      "*.password",
      "*.passwordHash",
      "*.token",
      "*.accessToken",
      "*.refreshToken",
      "*.sessionToken",
      "*.apiKey",
      "*.secret",
      "*.clientSecret",
    ],
    censor: "[REDACTED]",
  },
  serializers: {
    err: pino.stdSerializers.err,
  },
});

export type AppLogger = typeof logger;
