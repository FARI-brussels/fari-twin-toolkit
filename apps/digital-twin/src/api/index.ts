/**
 * API Module - Central exports
 */

// Client
export { apiClient, mobilityTwinClient } from './client';

// Query Keys
export { queryKeys } from './queryKeys';

// Assets
export { useAssetsQuery, useUploadAssetMutation, useDeleteAssetMutation } from './queries/assets';

// Map Layers
export {
  useMapLayersQuery,
  useMapLayersGroupedQuery,
  useAddMapLayerMutation,
  useDeleteMapLayerMutation,
  useDeleteMapLayerByIdMutation,
  useDeleteAllLayersFromServerMutation,
  type AddMapLayerPayload,
  type DeleteMapLayerPayload,
} from './queries/mapLayers';

// Tilesets
export {
  useTilesetsQuery,
  useUploadTilesetMutation,
  useDeleteTilesetMutation,
  pollUploadStatus,
  type UploadStatusResponse,
} from './queries/tilesets';

// Realtime Data (Mobility Twin API)
export { fetchMobilityData, MobilityEndpoints, type MobilitySource } from './mobilityClient';

// Backend Components (Collectors, Harvesters, etc.)
export {
  useComponentQuery,
  ComponentEndpoints,
  type ComponentSource,
} from './queries/components';
