// Gradient + legend math is promoted to the toolkit (`@fari-brussels/viewer-core`); this
// file keeps only the app's per-source thresholds and property extractors.
import { gradientLegend } from '@fari-brussels/viewer-core';

// Types for our style configuration
export interface LegendItem {
  color: string;
  label: string;
}

export interface LayerStyleConfig {
  // GeoJsonLayer point props
  getFillColor?: unknown;
  getLineColor?: unknown;
  getLineWidth?: unknown;
  getRadius?: unknown; // For point features (circles)
  pointRadiusMinPixels?: number;
  pointRadiusMaxPixels?: number;
  pointRadiusScale?: number;
  
  // Icon specific (for IconLayer)
  useIconLayer?: boolean;
  iconEmoji?: string;
  iconSize?: number;
  iconColor?: [number, number, number];
  
  // Legend
  legend?: {
    title: string;
    items: LegendItem[];
  };
}

// Color interpolation helper - interpolates between two RGB colors
function interpolateColor(
  color1: [number, number, number],
  color2: [number, number, number],
  t: number
): [number, number, number] {
  return [
    Math.round(color1[0] + (color2[0] - color1[0]) * t),
    Math.round(color1[1] + (color2[1] - color1[1]) * t),
    Math.round(color1[2] + (color2[2] - color1[2]) * t)
  ];
}

// Gradient color stops: green → yellow → orange → red
const GRADIENT_STOPS: [number, number, number][] = [
  [0, 200, 0],    // Green (good/low)
  [255, 255, 0],  // Yellow
  [255, 165, 0],  // Orange
  [255, 0, 0]     // Red (bad/high)
];

// Get color from gradient based on normalized value (0-1)
function getGradientColor(normalizedValue: number, alpha?: number): [number, number, number] | [number, number, number, number] {
  const t = Math.max(0, Math.min(1, normalizedValue));
  const segmentCount = GRADIENT_STOPS.length - 1;
  const segment = Math.min(Math.floor(t * segmentCount), segmentCount - 1);
  const localT = (t * segmentCount) - segment;
  
  const color = interpolateColor(
    GRADIENT_STOPS[segment] as [number, number, number],
    GRADIENT_STOPS[segment + 1] as [number, number, number],
    localT
  );
  
  if (alpha !== undefined) {
    return [...color, alpha] as [number, number, number, number];
  }
  return color;
}

// Create a gradient legend based on min/max values. Delegates to the toolkit's
// single legend generator; the app supplies its own thresholds + unit.
export function createGradientLegend(
  title: string,
  min: number,
  max: number,
  steps: number = 4,
  unit: string = ''
): { title: string; items: LegendItem[] } {
  return gradientLegend(min, max, { title, steps, unit });
}

// Get color for a value based on min/max range
export function getValueColor(
  value: number,
  min: number,
  max: number,
  alpha?: number
): [number, number, number] | [number, number, number, number] {
  const normalizedValue = (value - min) / (max - min);

  return getGradientColor(normalizedValue, alpha);
}

// Traffic thresholds for Telraam
const TRAFFIC_MIN = 0;
const TRAFFIC_MAX = 500;

// Helper for Telraam color scale
export function getTrafficColor(carCount: number): [number, number, number] {
  return getValueColor(carCount, TRAFFIC_MIN, TRAFFIC_MAX) as [number, number, number];
}

// Air quality thresholds for sensor community (PM2.5)
const PM25_MIN = 0;
// const PM25_MAX = 300;
const PM25_MAX = 55;

// Helper for air quality color scale (PM2.5 based)
export function getAirQualityColor(pm25: number): [number, number, number, number] {

  return getValueColor(pm25, PM25_MIN, PM25_MAX, 220) as [number, number, number, number];
}

// Extract PM2.5 value from sensor community data
export function getPM25Value(sensordatavalues: Array<{ value_type: string; value: string }> | undefined): number {
  if (!sensordatavalues) return 0;
  const pm25 = sensordatavalues.find(v => v.value_type === 'P2') || sensordatavalues.find(v => v.value_type === 'P0');
  return pm25 ? parseFloat(pm25.value) : 0;
}

export const LAYER_STYLES: Record<string, LayerStyleConfig> = {
  stib: {
    useIconLayer: true,
    iconEmoji: '🚌',
    iconSize: 40,
    iconColor: [181, 55, 140],
    legend: {
      title: 'STIB Vehicles',
      items: [{ color: '#B5378C', label: '🚌 Bus/Tram' }]
    }
  },
  sncb: {
    useIconLayer: true,
    iconEmoji: '🚆',
    iconSize: 45,
    iconColor: [0, 100, 0],
    legend: {
      title: 'SNCB Trains',
      items: [{ color: '#006400', label: '🚆 Train' }]
    }
  },
  bolt: {
    useIconLayer: true,
    iconEmoji: '🛴',
    iconSize: 35,
    iconColor: [50, 205, 50],
    legend: {
      title: 'Bolt',
      items: [{ color: '#32CD32', label: '🛴 Scooter' }]
    }
  },
  dott: {
    useIconLayer: true,
    iconEmoji: '🛴',
    iconSize: 35,
    iconColor: [0, 0, 255],
    legend: {
      title: 'Dott',
      items: [{ color: '#0000FF', label: '🛴 Scooter' }]
    }
  },
  telraam: {
    getLineColor: (d: { properties?: { car?: number } }) => {
      const count = d.properties?.car || 0;
      return getTrafficColor(count);
    },
    getLineWidth: () => 20,
    legend: createGradientLegend('Traffic Density (Cars/Hour)', TRAFFIC_MIN, TRAFFIC_MAX, 4)
  },
  openSky: {
    useIconLayer: true,
    iconEmoji: '🛩️',
    iconSize: 35,
    iconColor: [255, 255, 255],
    legend: {
      title: 'OpenSky',
      items: [{ color: '#808080', label: '🛩️ Aircraft' }]
    }
  },

  // Backend Components
  sensorCommunity: {
    getFillColor: (d: { properties?: { sensordatavalues?: Array<{ value_type: string; value: string }> } }) => {
      const pm25 = getPM25Value(d.properties?.sensordatavalues);
      return getAirQualityColor(pm25);
    },
    // getFillColor: (d: { properties?: { sensordatavalues?: Array<{ value_type: string; value: string }> } }) => {
    //   const pm25 = getPM25Value(d.properties?.sensordatavalues);
    //   return getAirQualityColor(pm25);
    // },
    getRadius: 20, // Radius in meters
    pointRadiusMinPixels: 5,
    pointRadiusMaxPixels: 15,
    getLineWidth: 1,
    getLineColor: [255, 255, 255],
    legend: createGradientLegend('Air Quality (PM2.5 µg/m³)', PM25_MIN, PM25_MAX, 4)
  },

  // Fallback for others
  default: {
    getFillColor: [128, 128, 128, 200],
    getRadius: 100,
    pointRadiusMinPixels: 4,
    pointRadiusMaxPixels: 10,
    getLineWidth: 2,
    getLineColor: [255, 255, 255],
    legend: {
      title: 'Data',
      items: [{ color: '#808080', label: 'Point' }]
    }
  }
};

export function getLayerStyle(source: string): LayerStyleConfig {
  return LAYER_STYLES[source] ?? LAYER_STYLES.default ?? {};
}

