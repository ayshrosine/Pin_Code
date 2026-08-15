import { prisma } from "./prisma";
import { BANGALORE_PINCODES } from "./seedData";
import { FilteredPincodeRecord } from "./postalApi";

export interface PincodeItem {
  id?: string;
  code: string;
  areaName: string;
  district: string;
  state: string;
  fetchedAt?: Date;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Save fresh records to MongoDB PincodeCache table
 */
export async function saveToCache(records: FilteredPincodeRecord[]) {
  if (!records || records.length === 0 || !prisma || !prisma.pincodeCache) return;

  try {
    for (const record of records) {
      // Upsert by checking existing matching pincode & areaName
      const existing = await prisma.pincodeCache.findFirst({
        where: {
          pincode: record.pincode,
          areaName: record.areaName,
        },
      });

      if (existing) {
        await prisma.pincodeCache.update({
          where: { id: existing.id },
          data: { fetchedAt: new Date() },
        });
      } else {
        await prisma.pincodeCache.create({
          data: {
            pincode: record.pincode,
            areaName: record.areaName,
            district: record.district,
            state: record.state,
            fetchedAt: new Date(),
          },
        });
      }
    }
  } catch (err) {
    console.warn("Failed to write records to MongoDB cache:", err);
  }
}

/**
 * Get cached pincode records by exact code (if < 30 days old)
 */
export async function getCachedPincode(code: string): Promise<PincodeItem[] | null> {
  if (!prisma || !prisma.pincodeCache) return null;

  try {
    const cutoffDate = new Date(Date.now() - THIRTY_DAYS_MS);
    const results = await prisma.pincodeCache.findMany({
      where: {
        pincode: code,
        fetchedAt: { gte: cutoffDate },
      },
    });

    if (results && results.length > 0) {
      return results.map((item: any) => ({
        id: item.id,
        code: item.pincode,
        areaName: item.areaName,
        district: item.district,
        state: item.state,
        fetchedAt: item.fetchedAt,
      }));
    }
  } catch {
    // Cache miss / database offline
  }

  return null;
}

/**
 * Get cached area records by area name (if < 30 days old)
 */
export async function getCachedArea(areaName: string): Promise<PincodeItem[] | null> {
  if (!prisma || !prisma.pincodeCache) return null;

  try {
    const cutoffDate = new Date(Date.now() - THIRTY_DAYS_MS);
    const results = await prisma.pincodeCache.findMany({
      where: {
        areaName: {
          contains: areaName,
          mode: "insensitive",
        },
        fetchedAt: { gte: cutoffDate },
      },
    });

    if (results && results.length > 0) {
      return results.map((item: any) => ({
        id: item.id,
        code: item.pincode,
        areaName: item.areaName,
        district: item.district,
        state: item.state,
        fetchedAt: item.fetchedAt,
      }));
    }
  } catch {
    // Cache miss
  }

  return null;
}

/**
 * Get all cached pincodes for initial homepage load
 */
export async function getRecentCachedPincodes(): Promise<PincodeItem[]> {
  if (prisma && prisma.pincodeCache) {
    try {
      const cached = await prisma.pincodeCache.findMany({
        orderBy: { fetchedAt: "desc" },
        take: 30,
      });

      if (cached && cached.length > 0) {
        return cached.map((item: any) => ({
          id: item.id,
          code: item.pincode,
          areaName: item.areaName,
          district: item.district,
          state: item.state,
          fetchedAt: item.fetchedAt,
        }));
      }
    } catch {
      // Fallback
    }
  }

  // Fallback initial dataset so initial load is never empty
  return BANGALORE_PINCODES.slice(0, 16).map((item, idx) => ({
    id: `seed-cached-${idx + 1}`,
    code: item.code,
    areaName: item.areaName,
    district: item.district,
    state: item.state,
  }));
}
