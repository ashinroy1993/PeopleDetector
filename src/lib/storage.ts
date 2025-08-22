
type Direction = 'left' | 'center' | 'right' | 'everywhere';

export interface AnalysisRecord {
  direction: Direction;
  confidence: number;
  timestamp: number;
}

// A simple in-memory store that is shared across server requests.
// NOTE: This is volatile and will be reset on server restart or redeployment.
let latestAnalysis: AnalysisRecord | null = null;

export async function addAnalysis(record: Omit<AnalysisRecord, 'timestamp'>): Promise<void> {
  latestAnalysis = { ...record, timestamp: Date.now() };
}

export async function getLatestAnalysis(): Promise<AnalysisRecord | null> {
  return latestAnalysis;
}
