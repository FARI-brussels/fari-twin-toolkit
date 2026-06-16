/**
 * Map Layer Queries and Mutations
 * Aligned with backend WMSLayersManager endpoints
 */
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { apiClient } from '../client';
import { queryKeys } from '../queryKeys';
import { createMutation } from '../utils/mutationFactory';
import { CACHE_CONFIG } from '../utils/cacheConfig';
import type { MapLayer } from '@/types';

// ============================================================================
// Types
// ============================================================================

export interface AddMapLayerPayload {
  url: string;
  layer: string;
  description: string;
}

export interface DeleteMapLayerPayload {
  url: string;
  layer: string;
}

interface WMSLayerRecord {
  id: number;
  wms_url: string;
  layer_name: string;
  description: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * GET /wms_layers - Fetch all WMS layers
 */
async function fetchMapLayers(): Promise<MapLayer[]> {
  const records = await apiClient.get('wms_layers').json<WMSLayerRecord[]>();

  if (!Array.isArray(records)) {
    throw new Error('Invalid API response: expected array');
  }

  return records.map(record => ({
    id: record.id,
    url: record.wms_url,
    layer: record.layer_name,
    description: record.description || '',
  }));
}

/**
 * GET /wms_layers/servers/grouped - Fetch layers grouped by WMS server
 */
async function fetchLayersGroupedByServer(): Promise<Record<string, MapLayer[]>> {
  const grouped = await apiClient
    .get('wms_layers/servers/grouped')
    .json<Record<string, WMSLayerRecord[]>>();

  const result: Record<string, MapLayer[]> = {};
  for (const [wmsUrl, layers] of Object.entries(grouped)) {
    result[wmsUrl] = layers.map(record => ({
      id: record.id,
      url: wmsUrl,
      layer: record.layer_name,
      description: record.description || '',
    }));
  }
  return result;
}

/**
 * POST /wms_layers/servers/:wmsUrl/layers - Add layer(s) to a WMS server
 */
async function addMapLayer(payload: AddMapLayerPayload): Promise<void> {
  const encodedUrl = encodeURIComponent(payload.url);
  await apiClient.post(`wms_layers/servers/${encodedUrl}/layers`, {
    json: {
      layers: [payload.layer],
      description: payload.description,
    },
  });
}

/**
 * DELETE /wms_layers/:id - Delete a single layer by ID
 */
async function deleteMapLayerById(id: number): Promise<void> {
  await apiClient.delete(`wms_layers/${id}`);
}

/**
 * DELETE /wms_layers/servers/:wmsUrl/layers - Delete ALL layers from a WMS server
 */
async function deleteAllLayersFromServer(wmsUrl: string): Promise<{ deleted_count: number }> {
  const encodedUrl = encodeURIComponent(wmsUrl);
  return apiClient
    .delete(`wms_layers/servers/${encodedUrl}/layers`)
    .json<{ message: string; deleted_count: number }>();
}

// ============================================================================
// Query Hooks
// ============================================================================

export function useMapLayersQuery() {
  return useQuery({
    queryKey: queryKeys.mapLayers.list(),
    queryFn: fetchMapLayers,
    staleTime: CACHE_CONFIG.mapLayers.staleTime,
    gcTime: CACHE_CONFIG.mapLayers.gcTime,
  });
}

export function useMapLayersGroupedQuery() {
  return useQuery({
    queryKey: [...queryKeys.mapLayers.all, 'grouped'],
    queryFn: fetchLayersGroupedByServer,
    staleTime: CACHE_CONFIG.mapLayers.staleTime,
    gcTime: CACHE_CONFIG.mapLayers.gcTime,
  });
}

// ============================================================================
// Mutation Hooks (using factory)
// ============================================================================

export const useAddMapLayerMutation = createMutation(
  addMapLayer,
  [queryKeys.mapLayers.all]
);

export const useDeleteMapLayerByIdMutation = createMutation(
  deleteMapLayerById,
  [queryKeys.mapLayers.all]
);

export const useDeleteAllLayersFromServerMutation = createMutation(
  deleteAllLayersFromServer,
  [queryKeys.mapLayers.all]
);

/**
 * Delete map layer by URL + layer name - uses QueryClient cache to avoid extra API call
 */
export function useDeleteMapLayerMutation() {
  const queryClient = useQueryClient();

  return createMutation(
    async (payload: DeleteMapLayerPayload) => {
      // Try to find ID from cache first
      const cached = queryClient.getQueryData<MapLayer[]>(queryKeys.mapLayers.list());
      let layerId = cached?.find(
        l => l.url === payload.url && l.layer === payload.layer
      )?.id;

      // If not in cache, fetch to find ID
      if (!layerId) {
        const records = await apiClient.get('wms_layers').json<WMSLayerRecord[]>();
        const layer = records.find(
          r => r.wms_url === payload.url && r.layer_name === payload.layer
        );
        if (!layer) {
          throw new Error(`Layer not found: ${payload.layer} on ${payload.url}`);
        }
        layerId = layer.id;
      }

      await deleteMapLayerById(layerId);
    },
    [queryKeys.mapLayers.all]
  )();
}
