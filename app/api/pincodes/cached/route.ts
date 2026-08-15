import { NextResponse } from "next/server";
import { getRecentCachedPincodes } from "@/lib/db";

export async function GET() {
  try {
    const data = await getRecentCachedPincodes();
    return NextResponse.json(
      {
        data,
        count: data.length,
        message: "Recently searched & cached pincodes retrieved successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/pincodes/cached error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve cached pincodes." },
      { status: 500 }
    );
  }
}
