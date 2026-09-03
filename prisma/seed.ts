import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { normalizeDatabaseUrl } from "../src/lib/database-url";

const BCRYPT_SALT_ROUNDS = 12;

const demoUser = {
  email: "demo@cleartax.local",
  name: "Demo Accountant",
  password: "ClearTaxDemo#2026",
};

const demoBusiness = {
  legalName: "ClearTax Demo Private Limited",
  gstin: "29ABCDE1234F1Z5",
};

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new pg.Pool({
    connectionString: normalizeDatabaseUrl(databaseUrl),
  });

  return new PrismaClient({
    adapter: new PrismaPg(pool, {
      disposeExternalPool: true,
    }),
  });
}

async function main() {
  const prisma = createPrismaClient();
  const passwordHash = await bcrypt.hash(demoUser.password, BCRYPT_SALT_ROUNDS);

  try {
    const user = await prisma.user.upsert({
      where: {
        email: demoUser.email,
      },
      update: {
        name: demoUser.name,
        passwordHash,
      },
      create: {
        email: demoUser.email,
        name: demoUser.name,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
      },
    });

    const business = await prisma.business.upsert({
      where: {
        gstin: demoBusiness.gstin,
      },
      update: {
        legalName: demoBusiness.legalName,
        ownerId: user.id,
      },
      create: {
        legalName: demoBusiness.legalName,
        gstin: demoBusiness.gstin,
        ownerId: user.id,
      },
      select: {
        id: true,
        gstin: true,
      },
    });

    console.info(
      `Seeded demo user ${user.email} and business ${business.gstin}.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Failed to seed demo data", error);
  process.exit(1);
});
