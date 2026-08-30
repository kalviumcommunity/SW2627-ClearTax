import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "@/generated/prisma/client";
import { normalizeDatabaseUrl } from "@/lib/database-url";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaCacheKey?: string;
};

const poolConfig = {
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 10_000,
  max: 2,
};

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

  const prisma =
    globalForPrisma.prismaCacheKey === cacheKey && globalForPrisma.prisma
      ? globalForPrisma.prisma
      : createPrismaClient(normalizedConnectionString);

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
    globalForPrisma.prismaCacheKey = cacheKey;
  }

  return prisma;
}
