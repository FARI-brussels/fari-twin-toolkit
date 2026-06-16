/**
 * App-side tileset wiring for the toolkit viewer.
 *
 * The toolkit's `tileset3d` LayerSpec loads + frames the tileset; this module
 * supplies the app-specific bits: deciding Ion vs URL, and providing auth
 * headers for private backend tilesets (the toolkit's `getHeaders` seam) while
 * leaving external object storage unauthenticated.
 */
import type { Tileset3dLayerSpec, WmsLayerSpec } from '@fari-brussels/viewer-core';

/** The single tileset layer id the TilesetViewer reconciles. */
export const TILESET_LAYER_ID = 'tileset';

/** Default framing matching the DT's TilesetViewer (heading/pitch/distance). */
const TILESET_FRAME = { heading: 240, pitch: -25, distanceMultiplier: 1.8 } as const;

const EXTERNAL_STORAGE_HOSTS = [
  'ovh.net',
  'amazonaws.com',
  'storage.googleapis.com',
  'blob.core.windows.net',
  'digitaloceanspaces.com',
];

/** External object storage shouldn't receive the app's auth header. */
export function isExternalStorageUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return EXTERNAL_STORAGE_HOSTS.some((h) => hostname.includes(h));
  } catch {
    return false;
  }
}

/**
 * Build the tileset LayerSpec for a url. Ion assets (`ion:123` or a bare number)
 * load by asset id; backend urls get a bearer token via `getHeaders`; external
 * storage urls load unauthenticated.
 */
export function buildTilesetSpec(
  url: string,
  getToken: () => Promise<string | null>,
): Tileset3dLayerSpec {
  const trimmed = url.trim();
  const isIon = trimmed.startsWith('ion:') || /^\d+$/.test(trimmed);

  if (isIon) {
    return {
      id: TILESET_LAYER_ID,
      kind: 'tileset3d',
      ionAssetId: Number(trimmed.replace('ion:', '')),
      maximumScreenSpaceError: 4,
      frame: { ...TILESET_FRAME },
    };
  }

  return {
    id: TILESET_LAYER_ID,
    kind: 'tileset3d',
    url,
    maximumScreenSpaceError: 4,
    frame: { ...TILESET_FRAME },
    getHeaders: isExternalStorageUrl(url)
      ? undefined
      : async () => {
          const token = await getToken();
          return token ? { Authorization: `Bearer ${token}` } : undefined;
        },
  };
}

/** Frame options for re-framing the active tileset on "reset". */
export const TILESET_FRAME_OPTIONS = TILESET_FRAME;

/** The UrbIS gray base map, as a toolkit WMS overlay layer. */
export const URBIS_WMS_SPEC: WmsLayerSpec = {
  id: 'urbis',
  kind: 'wms',
  url: 'https://geoservices-urbis.irisnet.be/geoserver/BaseMaps/ows',
  layers: ['UrbISNotLabeledGray'],
  opacity: 0.9,
  maximumLevel: 21,
  tileWidth: 512,
  tileHeight: 512,
  parameters: { transparent: 'true', format: 'image/png' },
};
