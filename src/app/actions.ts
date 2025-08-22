"use server";

import { classifyCrowdDirection } from "@/ai/flows/classify-crowd-direction";
import { addAnalysis } from "@/lib/storage";

export type AnalysisResult = {
  personCount: number;
  direction: "left" | "center" | "right" | "everywhere";
  confidence: number;
};

export async function analyzeFrame(
  frameDataUri: string
): Promise<AnalysisResult> {
  try {
    const { personCount, direction, confidence } = await classifyCrowdDirection({
      frameDataUri,
    });

    if (personCount > 0) {
      await addAnalysis({ direction, confidence });
      return { personCount, direction, confidence };
    }

    return { personCount: 0, direction: 'front', confidence: 0 };
  } catch (error) {
    console.error("Error analyzing frame:", error);
    throw new Error("Failed to analyze frame.");
  }
}
