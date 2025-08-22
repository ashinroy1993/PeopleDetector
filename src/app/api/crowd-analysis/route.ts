import { getAggregatedAnalysis } from "@/lib/storage";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getAggregatedAnalysis();
    
    let dominantDirection = "front";
    let maxCount = -1; // Initialize with -1 to handle empty data case correctly

    // Convert to array and sort to handle ties consistently (e.g., alphabetically)
    const sortedDirections = Object.entries(data).sort((a, b) => a[0].localeCompare(b[0]));

    for (const [direction, count] of sortedDirections) {
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
