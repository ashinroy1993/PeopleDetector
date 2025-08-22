import { getAggregatedAnalysis } from "@/lib/storage";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = getAggregatedAnalysis();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to get aggregated analysis:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
