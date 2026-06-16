/**
 * Tileset Queries and Mutations
 * Aligned with backend TilesetManager endpoints (api/tilesets)
 * Supports async upload processing for large files
 */
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { apiClient } from '../client';
import { queryKeys } from '../queryKeys';
import { createMutation } from '../utils/mutationFactory';
import { CACHE_CONFIG } from '../utils/cacheConfig';
import { buildAssetUrl } from '../utils/urlBuilder';
import type { Tileset, ResourceRecord } from '@/types';

// ============================================================================
// Types for Async Upload
// ============================================================================

/** Response from async upload (HTTP 202) */
interface AsyncUploadResponse {
  message: string;
  id: number;
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  status_url: string;
}

/** Response from sync upload (HTTP 200) */
interface SyncUploadResponse {
  message: string;
  id: number;
  file_count: number;
  root_file: string;
  tileset_url: string;
}

/** Upload status response */
export interface UploadStatusResponse {
  id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  job_id?: string;
  error?: string;
  tileset_url?: string;
  file_count?: number;
}

/** Combined upload result */
export interface UploadResult {
  id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  isAsync: boolean;
  tilesetUrl?: string;
  error?: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * GET /api/tilesets - Fetch all tilesets
 */
async function fetchTilesets(): Promise<Tileset[]> {
  const records = await apiClient.get('api/tilesets').json<ResourceRecord[]>();

  if (!Array.isArray(records)) {
    throw new Error('Invalid API response: expected array');
  }

  return records.map(record => ({
    id: record.id,
    // New backend returns tileset_url for the JSON file path
    url: buildAssetUrl(record.tileset_url || record.url),
    name: record.filename || record.name,
    description: record.description,
    date: record.date,
  }));
}

/**
 * POST /api/tilesets - Upload a new tileset
 * Supports both sync (small files) and async (large files) modes
 * Returns immediately for async uploads with status URL
 */
async function uploadTileset(formData: FormData): Promise<UploadResult> {
  const response = await apiClient.post('api/tilesets', {
    body: formData,
    timeout: 600000, // 10 minutes max (covers both modes)
  });

  // Check if async (202 Accepted) or sync (200 OK)
  if (response.status === 202) {
    const data = await response.json() as AsyncUploadResponse;
    return {
      id: data.id,
      status: data.status,
      isAsync: true,
    };
  }

  // Sync upload completed
  const data = await response.json() as SyncUploadResponse;
  return {
    id: data.id,
    status: 'completed',
    isAsync: false,
    tilesetUrl: data.tileset_url,
  };
}

/**
 * GET /api/tilesets/:id/status - Get upload processing status
 */
export async function fetchUploadStatus(id: number): Promise<UploadStatusResponse> {
  return apiClient.get(`api/tilesets/${id}/status`).json<UploadStatusResponse>();
}

/**
 * Poll upload status until completed or failed
 * @param id - Tileset ID
 * @param onProgress - Callback for status updates
 * @param intervalMs - Polling interval in milliseconds (default: 2000)
 * @param maxAttempts - Maximum polling attempts (default: 300 = 10 minutes at 2s interval)
 */
export async function pollUploadStatus(
  id: number,
  onProgress?: (status: UploadStatusResponse) => void,
  intervalMs = 2000,
  maxAttempts = 300
): Promise<UploadStatusResponse> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const status = await fetchUploadStatus(id);
    onProgress?.(status);

    if (status.status === 'completed' || status.status === 'failed') {
      return status;
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs));
    attempts++;
  }

  throw new Error('Upload processing timeout');
}

/**
 * DELETE /api/tilesets/:id - Delete a tileset by ID
 */
async function deleteTilesetById(id: number): Promise<void> {
  await apiClient.delete(`api/tilesets/${id}`);
}

// ============================================================================
// Query Hooks
// ============================================================================

export function useTilesetsQuery() {
  return useQuery({
    queryKey: queryKeys.tilesets.list(),
    queryFn: fetchTilesets,
    staleTime: CACHE_CONFIG.tilesets.staleTime,
    gcTime: CACHE_CONFIG.tilesets.gcTime,
  });
}

// ============================================================================
// Mutation Hooks (using factory)
// ============================================================================

export const useUploadTilesetMutation = createMutation(
  uploadTileset,
  [queryKeys.tilesets.all]
);

export const useDeleteTilesetByIdMutation = createMutation(
  deleteTilesetById,
  [queryKeys.tilesets.all]
);

/**
 * Delete tileset by URL - uses QueryClient cache to avoid extra API call
 */
export function useDeleteTilesetMutation() {
  const queryClient = useQueryClient();

  return createMutation(
    async (url: string) => {
      // Try to find ID from cache first
      const cached = queryClient.getQueryData<Tileset[]>(queryKeys.tilesets.list());
      let tilesetId = cached?.find(t => t.url === url)?.id;

      // If not in cache, fetch to find ID
      if (!tilesetId) {
        const records = await apiClient.get('api/tilesets').json<ResourceRecord[]>();
        const tileset = records.find(r => r.url === url);
        if (!tileset) {
          throw new Error(`Tileset not found with URL: ${url}`);
        }
        tilesetId = tileset.id;
      }

      await deleteTilesetById(tilesetId);
    },
    [queryKeys.tilesets.all]
  )();
}
