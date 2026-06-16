/**
 * Component Queries - Fetch data from backend components
 * (Collectors, Harvesters, etc.)
 *
 * To add a new component: just add an entry to ComponentEndpoints
 */
import { useQuery } from '@tanstack/vue-query';
import type { MaybeRefOrGetter } from 'vue';
import { toValue, computed } from 'vue';
import { apiClient } from '../client';
import { queryKeys } from '../queryKeys';
import { CACHE_CONFIG } from '../utils/cacheConfig';
import type { GeoJSONFeatureCollection } from '@/types';

// ============================================================================
// Configuration
// ============================================================================

export const ComponentEndpoints = {
  sensorCommunity: 'api/sensor-community',
  openSky: 'api/opensky',

} as const;

export type ComponentSource = keyof typeof ComponentEndpoints;

// ============================================================================
// API Functions
// ============================================================================

async function fetchComponentData<T = GeoJSONFeatureCollection>(
  source: ComponentSource
): Promise<T> {
  const endpoint = ComponentEndpoints[source];
  return apiClient.get(endpoint).json<T>();
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Generic query hook for fetching component data
 *
 * @example
 * const { data, isLoading } = useComponentQuery('sensorCommunity');
 */
export function useComponentQuery<T = GeoJSONFeatureCollection>(
  source: MaybeRefOrGetter<ComponentSource>,
  options?: {
    refetchInterval?: number;
    enabled?: MaybeRefOrGetter<boolean>;
  }
) {
  const sourceValue = computed(() => toValue(source));

  return useQuery({
    queryKey: computed(() => queryKeys.components.data(sourceValue.value)),
    queryFn: () => fetchComponentData<T>(sourceValue.value),
    staleTime: CACHE_CONFIG.components.staleTime,
    gcTime: CACHE_CONFIG.components.gcTime,
    refetchInterval: options?.refetchInterval,
    enabled: options?.enabled,
  });
}
