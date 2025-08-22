import fs from 'fs/promises';
import path from 'path';

type Direction = 'left' | 'center' | 'right' | 'everywhere';

export interface AnalysisRecord {
  direction: Direction;
  confidence: number;
  timestamp: number;
}

// Define the path to the data directory and the JSON file.
// Using a .data directory is a common convention.
const dataDir = path.join(process.cwd(), '.data');
const dataPath = path.join(dataDir, 'analysis.json');

/**
 * Ensures that the data directory and the analysis.json file exist.
 * If they don't, it creates them.
 */
async function ensureDataFileExists() {
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (error) {
    // The directory probably already exists, which is fine.
  }
  try {
    // Try to access the file; if it throws, the file doesn't exist.
    await fs.access(dataPath);
  } catch (error) {
    // File doesn't exist, so create it with a default value.
    await fs.writeFile(dataPath, JSON.stringify(null), 'utf-8');
  }
}

/**
 * Adds a new analysis record to our persistent store.
 * This will overwrite the file with the latest record.
 * @param record - The analysis record to add.
 */
export async function addAnalysis(record: Omit<AnalysisRecord, 'timestamp'>): Promise<void> {
  await ensureDataFileExists();
  const newRecord: AnalysisRecord = { ...record, timestamp: Date.now() };
  await fs.writeFile(dataPath, JSON.stringify(newRecord, null, 2), 'utf-8');
}

/**
 * Retrieves the most recent analysis record from the store.
 * @returns The latest analysis record, or null if none exists.
 */
export async function getLatestAnalysis(): Promise<AnalysisRecord | null> {
  await ensureDataFileExists();
  try {
    const data = await fs.readFile(dataPath, 'utf-8');
    // If the file is empty or just "null", return null.
    if (!data || data.trim() === 'null') {
      return null;
    }
    return JSON.parse(data) as AnalysisRecord;
  } catch (error) {
    console.error('Error reading analysis file:', error);
    // If we can't read or parse the file, return null as a fallback.
    return null;
  }
}
