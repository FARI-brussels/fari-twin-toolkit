/**
 * SAMPLE Brussels-flavoured data so the app runs out-of-the-box.
 *
 * Replace this file with the real prepared dataset:
 *   - `places`: Place[] from @fari-brussels/twin-types (commune geometry + name + code)
 *   - `indicators`: Indicator[] (metadata: label, unit, higher_is_better, …)
 *   - `series`: Timeseries[] (one per (place, indicator) pair)
 *
 * The rest of the app reads these by name — change the data, the UI follows.
 * Geometry here is a tiny square around each commune's real centroid so the
 * choropleth shows real positions while staying small enough to inline.
 */
import type { Indicator, Place, Timeseries } from '@fari-brussels/twin-types'

const COMMUNES: { id: string; name: string; lon: number; lat: number }[] = [
  { id: '21004', name: 'Bruxelles-Ville', lon: 4.3525, lat: 50.8467 },
  { id: '21001', name: 'Anderlecht', lon: 4.3074, lat: 50.8359 },
  { id: '21015', name: 'Schaerbeek', lon: 4.3787, lat: 50.8676 },
  { id: '21009', name: 'Ixelles', lon: 4.372, lat: 50.83 },
  { id: '21013', name: 'Saint-Gilles', lon: 4.3437, lat: 50.8273 },
  { id: '21005', name: 'Etterbeek', lon: 4.3905, lat: 50.8347 },
  { id: '21007', name: 'Forest', lon: 4.3203, lat: 50.8125 },
]

const HALF = 0.012 // ~1.3 km square per commune (fake but recognisable)

function square(lon: number, lat: number) {
  return {
    type: 'Polygon' as const,
    coordinates: [
      [
        [lon - HALF, lat - HALF],
        [lon - HALF, lat + HALF],
        [lon + HALF, lat + HALF],
        [lon + HALF, lat - HALF],
        [lon - HALF, lat - HALF],
      ],
    ],
  }
}

export const places: Place[] = COMMUNES.map((c) => ({
  id: c.id,
  name: c.name,
  kind: 'municipality',
  code: c.id,
  geometry: square(c.lon, c.lat),
  centroid: { type: 'Point', coordinates: [c.lon, c.lat] },
  properties: {},
}))

export const indicators: Indicator[] = [
  {
    key: 'unemployment_rate',
    label: 'Unemployment rate',
    unit: '%',
    category: 'socioeconomic',
    higher_is_better: false,
    description: 'Share of the working-age population without paid work.',
  },
  {
    key: 'median_income_index',
    label: 'Median income (index)',
    unit: 'index',
    category: 'socioeconomic',
    higher_is_better: true,
    description: 'Brussels region average = 100.',
  },
  {
    key: 'population_density',
    label: 'Population density',
    unit: '/km²',
    category: 'population',
    higher_is_better: true,
    description: 'Inhabitants per square kilometre.',
  },
]

const YEARS = [2020, 2021, 2022, 2023, 2024] as const

// Fabricated but plausible values per (commune, indicator, year). Mildly
// correlated so the regression demo is meaningful.
const RAW: Record<string, Record<string, number[]>> = {
  '21004': {
    unemployment_rate: [16.2, 15.8, 14.9, 14.2, 13.6],
    median_income_index: [92, 93, 95, 96, 97],
    population_density: [7400, 7480, 7560, 7610, 7680],
  },
  '21001': {
    unemployment_rate: [20.5, 20.1, 19.4, 18.9, 18.2],
    median_income_index: [78, 79, 80, 81, 82],
    population_density: [12100, 12230, 12350, 12480, 12610],
  },
  '21015': {
    unemployment_rate: [17.4, 17.0, 16.3, 15.8, 15.1],
    median_income_index: [86, 87, 89, 91, 92],
    population_density: [16200, 16380, 16560, 16740, 16920],
  },
  '21009': {
    unemployment_rate: [11.2, 10.9, 10.4, 10.1, 9.6],
    median_income_index: [115, 117, 118, 120, 122],
    population_density: [13400, 13520, 13650, 13780, 13910],
  },
  '21013': {
    unemployment_rate: [19.1, 18.8, 18.2, 17.7, 17.0],
    median_income_index: [82, 83, 84, 85, 86],
    population_density: [20100, 20300, 20500, 20710, 20920],
  },
  '21005': {
    unemployment_rate: [10.8, 10.5, 10.0, 9.7, 9.2],
    median_income_index: [118, 119, 121, 123, 125],
    population_density: [12900, 13030, 13160, 13300, 13440],
  },
  '21007': {
    unemployment_rate: [18.6, 18.3, 17.7, 17.2, 16.6],
    median_income_index: [88, 89, 90, 92, 93],
    population_density: [9300, 9400, 9500, 9600, 9700],
  },
}

export const series: Timeseries[] = []
for (const place of places) {
  for (const indicator of indicators) {
    const values = RAW[place.id]?.[indicator.key]
    if (!values) continue
    series.push({
      place_id: place.id,
      indicator_key: indicator.key,
      points: YEARS.map((year, i) => ({ period: String(year), value: values[i] ?? null })),
    })
  }
}

export const years = [...YEARS]

/** Convenient bounding box around all communes — pass to viewer.flyTo. */
export const brusselsBbox: [number, number, number, number] = [4.27, 50.79, 4.43, 50.89]
