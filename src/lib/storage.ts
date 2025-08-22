type Direction = 'left' | 'front' | 'right' | 'everywhere';

interface AnalysisRecord {
  direction: Direction;
  confidence: number;
  timestamp: number;
}

const analysisRecords: AnalysisRecord[] = [];
const MAX_RECORDS = 1000;

export function addAnalysis(record: Omit<AnalysisRecord, 'timestamp'>) {
  if (analysisRecords.length >= MAX_RECORDS) {
    analysisRecords.shift();
  }
  analysisRecords.push({ ...record, timestamp: Date.now() });
}

export function getAggregatedAnalysis() {
  const aggregatedData: Record<Direction, number> = {
    left: 0,
    front: 0,
    right: 0,
    everywhere: 0,
  };

  for (const record of analysisRecords) {
    if (aggregatedData[record.direction] !== undefined) {
      aggregatedData[record.direction]++;
    }
  }

  return aggregatedData;
}
