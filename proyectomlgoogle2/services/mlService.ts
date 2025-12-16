
import { SyncResult } from '../types';

/**
 * Performs a client-side request to our secure serverless function,
 * which then handles the actual synchronization with the Mercado Libre API.
 */
export const syncSales = async (dateFrom?: string, dateTo?: string): Promise<SyncResult> => {
  console.log(`Requesting sales sync from ${dateFrom} to ${dateTo}`);
  
  const response = await fetch('/api/sync-sales', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ dateFrom, dateTo }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to sync sales');
  }

  const result: SyncResult = await response.json();
  console.log("Sync successful:", result);
  return result;
};
