import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "@/generated/prisma/client";
import { normalizeDatabaseUrl } from "@/lib/database-url";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaCacheKey?: string;
};

const poolConfig = {
  application_name: "sw2627-cleartax",
  connectionTimeoutMillis: 15_000,
  idleTimeoutMillis: 60_000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10_000,
  max: 5,
};

const transientDatabaseErrorCodes = new Set([
  "ECONNRESET",
  "ENOTFOUND",
  "ETIMEDOUT",
  "P1001",
]);

function createPrismaClient(connectionString: string) {
  const pool = new pg.Pool({
    connectionString,
    ...poolConfig,
  });

  return new PrismaClient({
    adapter: new PrismaPg(pool, {
      disposeExternalPool: true,
      onPoolError(error) {
        console.error("PostgreSQL idle client error", error);
      },
    }),
  });
}

export function getPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const normalizedConnectionString = normalizeDatabaseUrl(connectionString);
  const cacheKey = JSON.stringify({
    connectionString: normalizedConnectionString,
    poolConfig,
  });

  if (globalForPrisma.prismaCacheKey === cacheKey && globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  if (globalForPrisma.prisma) {
    void globalForPrisma.prisma.$disconnect().catch((error: unknown) => {
      console.error("Failed to disconnect stale Prisma client", error);
    });
  }

  const prisma = createPrismaClient(normalizedConnectionString);

  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaCacheKey = cacheKey;

  return prisma;
}

export async function withDatabaseRetry<T>(operation: () => Promise<T>) {
  try {
    return await operation();
  } catch (error) {
    if (!isTransientDatabaseError(error)) {
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
    return operation();
  }
}

function isTransientDatabaseError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const code =
    "code" in error && typeof error.code === "string" ? error.code : null;

  if (code && transientDatabaseErrorCodes.has(code)) {
    return true;
  }

  return (
    error.message.includes("connection timeout") ||
    error.message.includes("Connection terminated") ||
    error.message.includes("Can't reach database server")
  );
}
