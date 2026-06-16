/**
 * Asset Queries and Mutations
 * Aligned with backend AssetsManager endpoints (api/assets)
 */
import { useQuery, useQueryClient, useMutation } from '@tanstack/vue-query';
import { apiClient } from '../client';
import { queryKeys } from '../queryKeys';
import { createMutation } from '../utils/mutationFactory';
import { CACHE_CONFIG } from '../utils/cacheConfig';
import { buildAssetUrl } from '../utils/urlBuilder';
import type { Asset, ResourceRecord } from '@/types';

// ============================================================================
// API Functions
// ============================================================================

/**
 * GET /api/assets - Fetch all assets
 */
async function fetchAssets(): Promise<Asset[]> {
  const records = await apiClient.get('api/assets').json<ResourceRecord[]>();

  if (!Array.isArray(records)) {
    throw new Error('Invalid API response: expected array');
  }

  return records.map(record => ({
    id: record.id,
    url: buildAssetUrl(record.url),
    name: record.filename || record.name,
    description: record.description,
    type: record.type,
    date: record.date,
    owner_id: record.owner_id ?? undefined,
    is_public: record.is_public,
  }));
}

/**
 * POST /api/assets - Upload a new asset
 */
async function uploadAsset(formData: FormData): Promise<void> {
  await apiClient.post('api/assets', { body: formData });
}

/**
 * DELETE /api/assets/:id - Delete an asset by ID
 */
async function deleteAssetById(id: number): Promise<void> {
  await apiClient.delete(`api/assets/${id}`);
}

// ============================================================================
// Query Hooks
// ============================================================================

export function useAssetsQuery() {
  return useQuery({
    queryKey: queryKeys.assets.list(),
    queryFn: fetchAssets,
    staleTime: CACHE_CONFIG.assets.staleTime,
    gcTime: CACHE_CONFIG.assets.gcTime,
  });
}

// ============================================================================
// Mutation Hooks (using factory)
// ============================================================================

export const useUploadAssetMutation = createMutation(
  uploadAsset,
  [queryKeys.assets.all]
);

export const useDeleteAssetByIdMutation = createMutation(
  deleteAssetById,
  [queryKeys.assets.all]
);

/**
 * Delete asset by ID
 */
export function useDeleteAssetMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await deleteAssetById(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });
    },
  });
}
