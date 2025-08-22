'use server';

import { put, head, del } from '@vercel/blob';
import { NextResponse } from 'next/server';

type Direction = 'left' | 'center' | 'right' | 'everywhere';

export interface AnalysisRecord {
  direction: Direction;
  confidence: number;
  timestamp: number;
}

const BLOB_FILENAME = 'analysis.json';

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
    const blobUrl = (await head(BLOB_FILENAME)).url;
    const response = await fetch(blobUrl);

    if (response.ok) {
        return await response.json();
    }
    
    if (response.status === 404) {
      return null;
    }

    throw new Error(`Failed to fetch analysis data: ${response.statusText}`)

  } catch (error: any) {
    if (error?.status === 404) {
      // File doesn't exist yet, return default state
      return null;
    }
    console.error('Error fetching from Vercel Blob:', error);
    // In case of other errors, we might want to return a default or re-throw
    return null;
  }
}