import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | null | undefined;
};

function createPrismaClient(): PrismaClient | null {
  try {
    return new PrismaClient();
  } catch {
    return null;
  }
}

export const prisma =
  globalForPrisma.prisma !== undefined
    ? (globalForPrisma.prisma as PrismaClient)
    : (createPrismaClient() as PrismaClient);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

