"use server";

import { detectPeople } from "@/ai/flows/detect-people";
import { classifyCrowdDirection } from "@/ai/flows/classify-crowd-direction";
import { addAnalysis } from "@/lib/storage";

export type AnalysisResult = {
  personCount: number;
  direction: "left" | "front" | "right" | "everywhere";
  confidence: number;
};

export async function analyzeFrame(
  frameDataUri: string
): Promise<AnalysisResult> {
  try {
    const { personCount } = await detectPeople({ photoDataUri: frameDataUri });

    if (personCount > 0) {
      const { direction, confidence } = await classifyCrowdDirection({
        frameDataUri,
        detectedPeopleCount: personCount,
      });
      
      addAnalysis({ direction, confidence });
      
      return { personCount, direction, confidence };
    }

    return { personCount: 0, direction: 'front', confidence: 0 };
  } catch (error) {
    console.error("Error analyzing frame:", error);
    throw new Error("Failed to analyze frame.");
  }
}
