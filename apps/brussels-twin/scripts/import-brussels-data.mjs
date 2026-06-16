#!/usr/bin/env node
/**
 * Import the real Brussels dataset into the app.
 *
 * Reads two source files you copy/paste from the old BrusselsMigration repo:
 *
 *   data/raw/brussels-merged.geojson   commune polygons + identity (niscode, name)
 *   data/raw/brussels-data.json        { communes, metadata, allYears }
 *                                      timeseries + indicator metadata
 *
 * and writes src/data/real.ts with the exact same exports as src/data/sample.ts
 * (places, indicators, series, years, brusselsBbox), then repoints
 * src/data/index.ts to './real' so the app picks it up. Nothing else changes.
 *
 * Usage:
 *   pnpm --filter @fari-brussels/brussels-twin import:data     # generate real.ts + switch
 *   pnpm --filter @fari-brussels/brussels-twin import:reset    # switch back to sample
 *
 * The large source files and the generated real.ts are git-ignored — only the
 * one-line source switch in index.ts is tracked. Data is data, not code.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const appRoot = join(here, '..')
const RAW = join(appRoot, 'data', 'raw')
const GEOJSON = join(RAW, 'brussels-merged.geojson')
const DATA = join(RAW, 'brussels-data.json')
const OUT = join(appRoot, 'src', 'data', 'real.ts')
const INDEX = join(appRoot, 'src', 'data', 'index.ts')

const indexHeader = readIndexHeader()

// ── reset mode ──────────────────────────────────────────────────────────────
if (process.argv.includes('reset') || process.argv.includes('--reset')) {
  writeFileSync(INDEX, `${indexHeader}export * from './sample'\n`)
  console.log('↩  Switched active dataset back to ./sample.')
  process.exit(0)
}

// ── guard: source files present? ─────────────────────────────────────────────
const missing = [GEOJSON, DATA].filter((p) => !existsSync(p))
if (missing.length) {
  console.error('✗ Missing source file(s):\n' + missing.map((p) => '   ' + p).join('\n'))
  console.error(
    '\nCopy the two files from the old BrusselsMigration repo into data/raw/:\n' +
      '   data/raw/brussels-merged.geojson\n' +
      '   data/raw/brussels-data.json\n' +
      'then run this command again.',
  )
  process.exit(1)
}

// ── load ─────────────────────────────────────────────────────────────────────
const geo = JSON.parse(readFileSync(GEOJSON, 'utf8'))
const data = JSON.parse(readFileSync(DATA, 'utf8'))

// ── places (from the GeoJSON FeatureCollection) ──────────────────────────────
/** Average of a polygon's exterior-ring vertices — good enough for labels/flyTo. */
function centroidOf(geometry) {
  const ring =
    geometry.type === 'Polygon'
      ? geometry.coordinates[0]
      : geometry.type === 'MultiPolygon'
        ? geometry.coordinates[0][0]
        : null
  if (!ring || !ring.length) return null
  // drop the closing duplicate vertex if present
  const pts = ring.length > 1 && sameXY(ring[0], ring[ring.length - 1]) ? ring.slice(0, -1) : ring
  const [sx, sy] = pts.reduce(([x, y], [px, py]) => [x + px, y + py], [0, 0])
  return { type: 'Point', coordinates: [round(sx / pts.length, 6), round(sy / pts.length, 6)] }
}
const sameXY = (a, b) => a[0] === b[0] && a[1] === b[1]
const round = (n, d) => Math.round(n * 10 ** d) / 10 ** d

const places = geo.features.map((f) => {
  const p = f.properties ?? {}
  const id = String(p.niscode ?? p.code ?? p.id)
  return {
    id,
    name: p.name ?? p.nameFr ?? p.nameDut ?? id,
    kind: 'municipality',
    code: id,
    geometry: f.geometry,
    centroid: centroidOf(f.geometry),
    properties: {},
  }
})

// ── indicators (from data.metadata) ───────────────────────────────────────────
// The source has no category / direction. We map a sensible category by key
// prefix and default higher_is_better=true, flipping a curated set where lower
// is clearly better. Adjust to taste — these only affect grouping + ramp colour.
const LOWER_IS_BETTER = new Set(['zero_income_rate', 'internal_out_num', 'internal_out_pct'])
function categoryFor(key) {
  if (/^(total_population|age_|fam_|internal_|international_|migbg_|nat_)/.test(key))
    return 'population'
  if (/^(avg_|zero_income|tax_|pri_|rc_|hq_|bp_)/.test(key)) return 'socioeconomic'
  return 'custom'
}

const metadata = data.metadata ?? {}
const indicators = Object.entries(metadata).map(([key, m]) => ({
  key,
  label: m.labelEn || m.label || key,
  unit: m.unit ?? null,
  category: categoryFor(key),
  higher_is_better: !LOWER_IS_BETTER.has(key),
  description: m.label && m.labelEn && m.label !== m.labelEn ? m.label : null, // Dutch original, for context
}))

// ── series (from data.communes[nis].timeseries) ──────────────────────────────
const placeIds = new Set(places.map((p) => p.id))
const yearSet = new Set()
const series = []
for (const [nis, c] of Object.entries(data.communes ?? {})) {
  if (!placeIds.has(nis)) continue // skip communes without geometry
  for (const [indicatorKey, byYear] of Object.entries(c.timeseries ?? {})) {
    const points = Object.entries(byYear)
      .map(([year, value]) => {
        yearSet.add(Number(year))
        return { period: String(year), value: value == null ? null : Number(value) }
      })
      .sort((a, b) => Number(a.period) - Number(b.period))
    if (points.length) series.push({ place_id: nis, indicator_key: indicatorKey, points })
  }
}
const years = [...yearSet].sort((a, b) => a - b)

// ── bbox over all geometries ──────────────────────────────────────────────────
let minLon = Infinity,
  minLat = Infinity,
  maxLon = -Infinity,
  maxLat = -Infinity
function visit(coords) {
  if (typeof coords[0] === 'number') {
    const [lon, lat] = coords
    if (lon < minLon) minLon = lon
    if (lat < minLat) minLat = lat
    if (lon > maxLon) maxLon = lon
    if (lat > maxLat) maxLat = lat
  } else for (const c of coords) visit(c)
}
for (const f of geo.features) visit(f.geometry.coordinates)
const bbox = [minLon, minLat, maxLon, maxLat].map((n) => round(n, 5))

// ── emit src/data/real.ts ─────────────────────────────────────────────────────
const banner =
  `/* AUTO-GENERATED by scripts/import-brussels-data.mjs — do not edit by hand.\n` +
  `   Source: data/raw/brussels-merged.geojson + data/raw/brussels-data.json\n` +
  `   Generated: ${new Date().toISOString()}\n` +
  `   ${places.length} places · ${indicators.length} indicators · ${series.length} series · years ${years[0]}–${years[years.length - 1]} */\n`

const file =
  banner +
  `import type { Indicator, Place, Timeseries } from '@fari-brussels/twin-types'\n\n` +
  `export const places = (${JSON.stringify(places, null, 2)}) as Place[]\n\n` +
  `export const indicators = (${JSON.stringify(indicators, null, 2)}) as Indicator[]\n\n` +
  `export const series = (${JSON.stringify(series)}) as Timeseries[]\n\n` +
  `export const years: number[] = ${JSON.stringify(years)}\n\n` +
  `export const brusselsBbox: [number, number, number, number] = ${JSON.stringify(bbox)}\n`

writeFileSync(OUT, file)
writeFileSync(INDEX, `${indexHeader}export * from './real'\n`)

console.log(
  `✓ Wrote src/data/real.ts\n` +
    `   ${places.length} places · ${indicators.length} indicators · ${series.length} series\n` +
    `   years ${years[0]}–${years[years.length - 1]} · bbox [${bbox.join(', ')}]\n` +
    `✓ Switched active dataset to ./real (src/data/index.ts).\n\n` +
    `Run the app:  pnpm --filter @fari-brussels/brussels-twin dev`,
)

/** Keep the doc-comment block at the top of index.ts; replace only the export line. */
function readIndexHeader() {
  if (!existsSync(INDEX)) return ''
  const src = readFileSync(INDEX, 'utf8')
  const idx = src.search(/^export \* from/m)
  return idx >= 0 ? src.slice(0, idx) : src.endsWith('\n') ? src : src + '\n'
}
