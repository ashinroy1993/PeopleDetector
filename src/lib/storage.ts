import fs from 'fs/promises';
import path from 'path';

type Direction = 'left' | 'front' | 'right' | 'everywhere';

interface AnalysisRecord {
  direction: Direction;
  confidence: number;
  timestamp: number;
}

const storagePath = path.join(process.cwd(), '.data');
const dataFilePath = path.join(storagePath, 'analysis.json');
const MAX_RECORDS = 1000;

async function ensureStorage(): Promise<AnalysisRecord[]> {
  try {
    await fs.mkdir(storagePath, { recursive: true });
    const data = await fs.readFile(dataFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(dataFilePath, '[]', 'utf-8');
      return [];
    }
    console.error('Error reading storage:', error);
    return [];
  }
}

async function writeRecords(records: AnalysisRecord[]): Promise<void> {
    await fs.writeFile(dataFilePath, JSON.stringify(records, null, 2), 'utf-8');
}

export async function addAnalysis(record: Omit<AnalysisRecord, 'timestamp'>) {
  const records = await ensureStorage();
  
  records.push({ ...record, timestamp: Date.now() });

  if (records.length > MAX_RECORDS) {
    records.shift();
  }
  
  await writeRecords(records);
}

export async function getAggregatedAnalysis() {
  const records = await ensureStorage();
  const aggregatedData: Record<Direction, number> = {
    left: 0,
    front: 0,
    right: 0,
    everywhere: 0,
  };

  for (const record of records) {
    if (aggregatedData[record.direction] !== undefined) {
      aggregatedData[record.direction]++;
    }
  }

  return aggregatedData;
}
