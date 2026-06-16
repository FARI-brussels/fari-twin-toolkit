/**
 * Centralized Query Keys
 * Using factory pattern for type-safe and consistent query keys
 */

export const queryKeys = {
  assets: {
    all: ['assets'] as const,
    list: () => [...queryKeys.assets.all, 'list'] as const,
    detail: (id: string | number) => [...queryKeys.assets.all, 'detail', id] as const,
  },
  mapLayers: {
    all: ['mapLayers'] as const,
    list: () => [...queryKeys.mapLayers.all, 'list'] as const,
    detail: (url: string, layer: string) =>
      [...queryKeys.mapLayers.all, 'detail', url, layer] as const,
  },
  tilesets: {
    all: ['tilesets'] as const,
    list: () => [...queryKeys.tilesets.all, 'list'] as const,
    detail: (id: string | number) => [...queryKeys.tilesets.all, 'detail', id] as const,
  },
  components: {
    all: ['components'] as const,
    data: (source: string) => [...queryKeys.components.all, 'data', source] as const,
  },
} as const;
