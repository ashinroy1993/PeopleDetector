'use server';

import { put, head } from '@vercel/blob';
import getConfig from 'next/config';

type Direction = 'left' | 'center' | 'right' | 'everywhere';

export interface AnalysisRecord {
  direction: Direction;
  confidence: number;
  timestamp: number;
}

const BLOB_FILENAME = 'analysis.json';

const { publicRuntimeConfig } = getConfig();
const BLOB_READ_WRITE_TOKEN = publicRuntimeConfig.BLOB_READ_WRITE_TOKEN;

/**
 * Stores the latest analysis record in Vercel Blob storage.
 * @param record - The analysis record to store.
 */
export async function addAnalysis(record: Omit<AnalysisRecord, 'timestamp'>): Promise<void> {
  const analysisRecord: AnalysisRecord = { ...record, timestamp: Date.now() };
  try {
    await put(BLOB_FILENAME, JSON.stringify(analysisRecord), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false, // Ensure we overwrite the same file
      token: BLOB_READ_WRITE_TOKEN
    });
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error);
    throw new Error('Failed to save analysis data.');
  }
}

/**
 * Retrieves the most recent analysis record from Vercel Blob storage.
 * @returns The latest analysis record, or a default if not found.
 */
export async function getLatestAnalysis(): Promise<AnalysisRecord | null> {
  try {
    const blobUrl = (await head(BLOB_FILENAME, { token: BLOB_READ_WRITE_TOKEN })).url;
    // Use fetch with 'no-store' to prevent caching
    const response = await fetch(blobUrl, { cache: 'no-store' });

    if (response.ok) {
        return await response.json();
    }
    
    if (response.status === 404) {
      return null;
    }

    throw new Error(`Failed to fetch analysis data: ${response.statusText}`)

  } catch (error: any) {
    if (error?.status === 404 || error?.message?.includes('404')) {
      // File doesn't exist yet, return default state
      return null;
    }
    console.error('Error fetching from Vercel Blob:', error);
    // In case of other errors, we might want to return a default or re-throw
    return null;
  }
}
