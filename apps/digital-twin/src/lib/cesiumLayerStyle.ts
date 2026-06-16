import { getTrafficColor, getAirQualityColor, getPM25Value } from '@/lib/layerStyles'

export interface CesiumLayerStyle {
  useCustomIcon?: boolean
  iconEmoji?: string
  iconSize?: number
  iconColor?: [number, number, number, number?]

  getFillColor?: (feature: { properties: unknown }) => [number, number, number, number?]
  getLineColor?: (feature: { properties: unknown }) => [number, number, number, number?]
  getLineWidth?: number
  pointRadiusScale?: number
}

const CESIUM_STYLES: Record<string, CesiumLayerStyle> = {
  stib: {
    useCustomIcon: true,
    iconEmoji: '🚌',
    iconSize: 40,
    iconColor: [181, 55, 140, 255],
  },
  sncb: {
    useCustomIcon: true,
    iconEmoji: '🚆',
    iconSize: 45,
    iconColor: [0, 100, 0, 255],
  },
  bolt: {
    useCustomIcon: true,
    iconEmoji: '🛴',
    iconSize: 35,
    iconColor: [50, 205, 50, 255],
  },
  dott: {
    useCustomIcon: true,
    iconEmoji: '🛴',
    iconSize: 35,
    iconColor: [0, 0, 255, 255],
  },
  telraam: {
    getLineColor: ({ properties }) => {
      const props = properties as Record<string, unknown>
      const count = (props.car as number | undefined) ?? 0
      const [r, g, b] = getTrafficColor(count)
      return [r, g, b, 220]
    },
    getLineWidth: 8,
  },
  sensorCommunity: {
    getFillColor: ({ properties }) => {
      const props = properties as Record<string, unknown>
      const pm25 = getPM25Value(props.sensordatavalues as Array<{ value_type: string; value: string }> | undefined)
      return getAirQualityColor(pm25) // already returns [r,g,b,a]
    },
    pointRadiusScale: 1.2,
  },
  openSky: {
    useCustomIcon: true,
    iconEmoji: '✈',
    iconSize: 35,
    iconColor: [255, 255, 255, 255],
  },
  default: {
    getFillColor: () => [128, 128, 128, 200],
    pointRadiusScale: 1,
  }
}

export function getCesiumLayerStyle(sourceId: string): CesiumLayerStyle {
  return CESIUM_STYLES[sourceId] ?? CESIUM_STYLES.default!
}