/**
 * Mobility Twin API Client - Ky instance for external realtime GeoJSON data
 *
 * Uses the ULB Mobility Twin API for realtime data sources
 * (STIB, SNCB, Bolt, Dott, Telraam, etc.)
 */
import ky from 'ky';
import type { GeoJSONFeatureCollection } from '@/types';

/**
 * Mobility Twin API Endpoints Configuration
 */
export const MobilityEndpoints = {
  stib: '/stib/vehicle-position',
  sncb: '/sncb/vehicle-position',
  bolt: '/bolt/vehicle-position',
  dott: '/dott/vehicle-position',
  telraam: '/traffic/telraam',
} as const;

export type MobilitySource = keyof typeof MobilityEndpoints;

/**
 * Ky client for Mobility Twin API
 */
const mobilityTwinClient = ky.create({
  prefixUrl: 'https://api.mobilitytwin.brussels',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${import.meta.env.VITE_TWIN_API_TOKEN}`,
  },
});

/**
 * Mobility Twin API response wrapper
 * The API wraps GeoJSON in metadata - we normalize this internally
 */
interface MobilityApiResponse {
  status_code: number;
  message: string;
  type: string;
  features: GeoJSONFeatureCollection['features'];
}

/**
 * Fetch GeoJSON data from Mobility Twin API
 * Returns normalized GeoJSONFeatureCollection (handles API wrapper internally)
 */
export async function fetchMobilityData(
  source: MobilitySource,
  params?: Record<string, string>
): Promise<GeoJSONFeatureCollection> {
  const endpoint = MobilityEndpoints[source];
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  const response = await mobilityTwinClient
    .get(cleanEndpoint, { searchParams: params })
    .json<MobilityApiResponse | GeoJSONFeatureCollection>();

  // Normalize: API wraps GeoJSON in metadata, we return clean GeoJSON
  if ('status_code' in response) {
    return {
      type: 'FeatureCollection',
      features: response.features,
    };
  }

  return response;
}