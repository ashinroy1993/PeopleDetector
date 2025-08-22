import { getLatestAnalysis } from "@/lib/storage";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const latest = await getLatestAnalysis();
    
    let currentPosition = "Everywhere";

    if (latest) {
        currentPosition = latest.direction;
    }

    const capitalizedPosition =
      currentPosition.charAt(0).toUpperCase() + currentPosition.slice(1);

    return NextResponse.json({ position: capitalizedPosition });
  } catch (error) {
    console.error("Failed to get latest analysis:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
