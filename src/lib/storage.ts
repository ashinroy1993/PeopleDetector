
'use server';

type Direction = 'left' | 'center' | 'right' | 'everywhere';

export interface AnalysisRecord {
  direction: Direction;
  confidence: number;
  timestamp: number;
}

// Use a simple in-memory store. This is a module-level variable, so it will
// persist for the lifetime of the server instance.
let latestAnalysis: AnalysisRecord = {
    direction: 'everywhere',
    confidence: 0,
    timestamp: Date.now(),
};

/**
 * Stores the latest analysis record in memory.
 * @param record - The analysis record to store.
 */
export async function addAnalysis(record: Omit<AnalysisRecord, 'timestamp'>): Promise<void> {
  latestAnalysis = { ...record, timestamp: Date.now() };
}

/**
 * Retrieves the most recent analysis record from memory.
 * @returns The latest analysis record.
 */
export async function getLatestAnalysis(): Promise<AnalysisRecord | null> {
  // Return a copy to prevent accidental mutation
  return { ...latestAnalysis };
}
