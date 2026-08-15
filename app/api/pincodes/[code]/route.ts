import { NextResponse } from "next/server";
import { getCachedPincode, saveToCache } from "@/lib/db";
import { fetchPincodeFromIndiaPost } from "@/lib/postalApi";

const requestCounts = new Map<string, { count: number; expires: number }>();
const RATE_LIMIT_MAX = 60;
const WINDOW_MS = 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = requestCounts.get(ip);
  if (!entry || now > entry.expires) {
    requestCounts.set(ip, { count: 1, expires: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  entry.count++;
  return true;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const clientIp = request.headers.get("x-forwarded-for") || "127.0.0.1";
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }

    // 1. Validate 6-digit numeric format BEFORE calling external API
    if (!code || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: "Invalid pincode format. Must be a 6-digit numeric string." },
        { status: 400 }
      );
    }

    // 2. Cache-first strategy: check MongoDB cache
    const cached = await getCachedPincode(code);
    if (cached && cached.length > 0) {
      return NextResponse.json(
        {
          data: cached,
          count: cached.length,
          source: "cache",
          query: code,
        },
        {
          status: 200,
          headers: { "X-Cache": "HIT" },
        }
      );
    }

    // 3. Cache miss: fetch from India Post live REST API
    const result = await fetchPincodeFromIndiaPost(code);

    if (!result.success) {
      const statusMap = {
        INVALID_FORMAT: 400,
        NOT_FOUND: 404,
        SERVICE_UNAVAILABLE: 503,
      };

      const statusCode = statusMap[result.errorStatus || "NOT_FOUND"] || 500;
      return NextResponse.json(
        { error: result.errorMessage || "Failed to fetch pincode details." },
        { status: statusCode }
      );
    }

    // 4. Save fresh results to MongoDB cache asynchronously
    saveToCache(result.data).catch((err) =>
      console.warn("Background cache save error:", err)
    );

    return NextResponse.json(
      {
        data: result.data.map((item, idx) => ({
          id: `live-${code}-${idx}`,
          code: item.pincode,
          areaName: item.areaName,
          district: item.district,
          state: item.state,
        })),
        count: result.data.length,
        source: "live-api",
        query: code,
      },
      {
        status: 200,
        headers: { "X-Cache": "MISS" },
      }
    );
  } catch (error) {
    console.error("GET /api/pincodes/[code] error:", error);
    return NextResponse.json(
      { error: "Service temporarily unavailable, please try again." },
      { status: 503 }
    );
  }
}
