import fs from 'fs/promises';
import path from 'path';

type Direction = 'left' | 'center' | 'right' | 'everywhere';

export interface AnalysisRecord {
  direction: Direction;
  confidence: number;
  timestamp: number;
}

const storagePath = path.join(process.cwd(), '.data');
const dataFilePath = path.join(storagePath, 'analysis.json');

async function ensureStorage(): Promise<AnalysisRecord[]> {
  try {
    await fs.mkdir(storagePath, { recursive: true });
    const data = await fs.readFile(dataFilePath, 'utf-8');
    // Ensure we always return an array, even if the file is empty or malformed
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // If file doesn't exist, create it with an empty array
      await fs.writeFile(dataFilePath, '[]', 'utf-8');
      return [];
    }
    console.error('Error reading storage:', error);
    // In case of other errors, default to an empty array
    return [];
  }
}

async function writeRecord(record: AnalysisRecord): Promise<void> {
    // Overwrite the file with an array containing only the single, latest record.
    await fs.writeFile(dataFilePath, JSON.stringify([record], null, 2), 'utf-8');
}

export async function addAnalysis(record: Omit<AnalysisRecord, 'timestamp'>) {
  const newRecord = { ...record, timestamp: Date.now() };
  await writeRecord(newRecord);
}

export async function getLatestAnalysis(): Promise<AnalysisRecord | null> {
    const records = await ensureStorage();
    if (records.length === 0) {
        return null;
    }
    // The file should only contain one record, which is the latest.
    return records[0];
}
