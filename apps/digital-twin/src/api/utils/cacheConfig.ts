/**
 * Cache Configuration - Centralized staleTime and gcTime settings
 * for TanStack Query
 */

export const CACHE_CONFIG = {
  /** Assets - moderate refresh rate */
  assets: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  },

  /** Tilesets - less frequent updates */
  tilesets: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  },

  /** Map layers - moderate refresh rate */
  mapLayers: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  },

  /** Vehicles - real-time data, very short cache */
  vehicles: {
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 30 * 1000, // 30 seconds
  },

  /** Backend components - moderate refresh, data typically updates periodically */
  components: {
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  },
} as const;
