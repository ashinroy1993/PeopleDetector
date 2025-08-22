import { getAggregatedAnalysis } from "@/lib/storage";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = getAggregatedAnalysis();
    
    let dominantDirection = "front";
    let maxCount = 0;

    for (const [direction, count] of Object.entries(data)) {
      if (count > maxCount) {
        maxCount = count;
        dominantDirection = direction;
      }
    }

    const capitalizedDirection =
      dominantDirection.charAt(0).toUpperCase() + dominantDirection.slice(1);

    return NextResponse.json({ Crowd: capitalizedDirection });
  } catch (error) {
    console.error("Failed to get aggregated analysis:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
