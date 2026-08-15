import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: any };

function getPrismaClient() {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  try {
    const client = new PrismaClient();
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = client;
    }
    return client;
  } catch {
    // Silent fallback when database driver adapter is not connected
    return null;
  }
}

export const prisma = getPrismaClient() as PrismaClient;
