import { unstable_cache as cache } from 'next/cache';

type Direction = 'left' | 'center' | 'right' | 'everywhere';

export interface AnalysisRecord {
  direction: Direction;
  confidence: number;
  timestamp: number;
}

// Use Next.js cache for in-memory, request-deduped storage.
// This acts as a volatile, in-memory store.
const getCache = cache(
  async () => ({ data: null as AnalysisRecord | null }),
  ['crowd-analysis-cache'],
  { revalidate: false } // Persists until re-deployment or server restart
);


export async function addAnalysis(record: Omit<AnalysisRecord, 'timestamp'>) {
  const newRecord = { ...record, timestamp: Date.now() };
  const cached = await getCache();
  cached.data = newRecord;
}

export async function getLatestAnalysis(): Promise<AnalysisRecord | null> {
    const cached = await getCache();
    return cached.data;
}