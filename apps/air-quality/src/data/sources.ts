/**
 * The measurement sources this demo can show. Each is a static GeoJSON
 * FeatureCollection of Points under `public/data/` (served as-is, the same way
 * the original demo did). The app reads `valueProp` off each feature to get the
 * concentration; the loader normalises that onto a uniform `value` property so
 * everything downstream — colour ramps, legend, detail panel — is source-agnostic.
 */
export type Pollutant = 'NO2'

export interface AirSource {
  id: string
  label: string
  /** One-line description shown under the selector. */
  blurb: string
  /** File under `public/data/`. */
  file: string
  /** Property carrying the measured concentration on each feature. */
  valueProp: string
  /** Values below this are treated as missing (stations use -9999 as no-data). */
  minValid: number
  pollutant: Pollutant
  unit: string
  /** Circle radius in px — sparse reference sets read better a little larger. */
  pointRadius: number
}

export const sources: AirSource[] = [
  {
    id: 'curieuzenair',
    label: 'CurieuzenAir',
    blurb: '2 484 citizen-science NO₂ samplers, one month (CurieuzenAir, 2021).',
    file: 'no2_curieusenair.json',
    valueProp: 'no2',
    minValid: 0,
    pollutant: 'NO2',
    unit: 'µg/m³',
    pointRadius: 5,
  },
  {
    id: 'expair',
    label: 'ExpAir',
    blurb: 'Citizen NO₂ measurements taken at street level (ExpAir).',
    file: 'no2_expair.json',
    valueProp: 'no2',
    minValid: 0,
    pollutant: 'NO2',
    unit: 'µg/m³',
    pointRadius: 8,
  },
  {
    id: 'irceline',
    label: 'Official stations',
    blurb: 'IRCEL-CELINE reference monitoring stations, annual mean (2023).',
    file: 'no2_anmean_station_brussels2023.json',
    valueProp: 'value',
    minValid: 1,
    pollutant: 'NO2',
    unit: 'µg/m³',
    pointRadius: 11,
  },
]

export const defaultSourceId = 'curieuzenair'
