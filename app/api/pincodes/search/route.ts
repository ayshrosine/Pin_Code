import { NextResponse } from "next/server";
import { getCachedArea, saveToCache } from "@/lib/db";
import { fetchAreaFromIndiaPost } from "@/lib/postalApi";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const area = searchParams.get("area") || searchParams.get("q");

    if (!area || !area.trim()) {
      return NextResponse.json(
        { error: "Search query parameter 'area' is required." },
        { status: 400 }
      );
    }

    const cleanArea = area.trim();

    // 1. Cache-first strategy: check MongoDB cache
    const cached = await getCachedArea(cleanArea);
    if (cached && cached.length > 0) {
      return NextResponse.json(
        {
          data: cached,
          count: cached.length,
          source: "cache",
          query: cleanArea,
        },
        {
          status: 200,
          headers: { "X-Cache": "HIT" },
        }
      );
    }

    // 2. Cache miss: fetch live from India Post API
    const result = await fetchAreaFromIndiaPost(cleanArea);

    if (!result.success) {
      const statusMap = {
        INVALID_FORMAT: 400,
        NOT_FOUND: 404,
        SERVICE_UNAVAILABLE: 503,
      };

      const statusCode = statusMap[result.errorStatus || "NOT_FOUND"] || 500;
      return NextResponse.json(
        { error: result.errorMessage || `No results found for '${cleanArea}'.` },
        { status: statusCode }
      );
    }

    // 3. Save fresh results to MongoDB cache asynchronously
    saveToCache(result.data).catch((err) =>
      console.warn("Background cache save error:", err)
    );

    return NextResponse.json(
      {
        data: result.data.map((item, idx) => ({
          id: `live-area-${cleanArea}-${idx}`,
          code: item.pincode,
          areaName: item.areaName,
          district: item.district,
          state: item.state,
        })),
        count: result.data.length,
        source: "live-api",
        query: cleanArea,
      },
      {
        status: 200,
        headers: { "X-Cache": "MISS" },
      }
    );
  } catch (error) {
    console.error("GET /api/pincodes/search error:", error);
    return NextResponse.json(
      { error: "Service temporarily unavailable, please try again." },
      { status: 503 }
    );
  }
}
