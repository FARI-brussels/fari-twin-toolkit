/**
 * App-side realtime wiring for the toolkit viewer.
 *
 * The toolkit's `realtime` LayerSpec renders the features; this module supplies
 * the two app-specific seams it asks for:
 *  - `fetchRealtimeFeatures` — fetch via the app's *authed* clients (Mobility
 *    Twin token / Keycloak-bearer apiClient), which a bare URL can't do.
 *  - `realtimeStyleFor` — a per-feature style callback derived from the app's
 *    own Cesium style table (`getCesiumLayerStyle`), kept here as data.
 */
import type { FeatureCollection, RealtimeFeatureStyle, RealtimeStyleFn } from '@fari-brussels/viewer-core';
import { fetchMobilityData, MobilityEndpoints, type MobilitySource } from '@/api/mobilityClient';
import { apiClient } from '@/api';
import { ComponentEndpoints, type ComponentSource } from '@/api/queries/components';
import { getCesiumLayerStyle } from '@/lib/cesiumLayerStyle';

/** Fetch a realtime source's features through the app's authed API clients. */
export async function fetchRealtimeFeatures(sourceId: string): Promise<FeatureCollection> {
  if (sourceId in MobilityEndpoints) {
    return (await fetchMobilityData(sourceId as MobilitySource)) as unknown as FeatureCollection;
  }
  if (sourceId in ComponentEndpoints) {
    const endpoint = ComponentEndpoints[sourceId as ComponentSource];
    return apiClient.get(endpoint).json<FeatureCollection>();
  }
  throw new Error(`Unknown realtime source: ${sourceId}`);
}

/** Format a Cesium-style `[r,g,b,a?]` (a in 0–255) as a CSS color string. */
function rgbaCss(c: [number, number, number, number?]): string {
  const [r, g, b, a] = c;
  return a == null ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
}

/**
 * Build a per-feature style callback from the app's Cesium style table. The
 * toolkit decides representation from geometry (emoji billboard / point circle /
 * line / polygon); we only provide the emoji + colors.
 */
export function realtimeStyleFor(sourceId: string): RealtimeStyleFn {
  const style = getCesiumLayerStyle(sourceId);
  return (props): RealtimeFeatureStyle => {
    if (style.useCustomIcon && style.iconEmoji) {
      return { emoji: style.iconEmoji, sizePx: style.iconSize };
    }
    if (style.getLineColor) {
      return {
        color: rgbaCss(style.getLineColor({ properties: props })),
        lineWidth: style.getLineWidth,
      };
    }
    if (style.getFillColor) {
      return { color: rgbaCss(style.getFillColor({ properties: props })) };
    }
    return { color: 'rgb(128, 128, 128)' };
  };
}
