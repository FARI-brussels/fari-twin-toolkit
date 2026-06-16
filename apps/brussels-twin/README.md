# @fari-brussels/brussels-twin

**BrusselsMigration v2** — the first real app on the FARI Twin Toolkit. Vue 3 +
Vite + Cesium, consuming every toolkit lib (tokens, icons, ui-vue, viewer-core,
viewer-cesium, viewer-vue, geo-ingest, scenario-engine, twin-types, twin-llm).

Lives inside the toolkit monorepo for fast iteration during the demo; can be
extracted to its own repo later (copy the dir, swap `workspace:*` for real
versions, publish the `@fari-brussels/*` packages).

```bash
pnpm install
pnpm --filter @fari-brussels/brussels-twin dev      # http://localhost:5181
pnpm --filter @fari-brussels/brussels-twin build    # production build (verifies Cesium bundle)
```

## What this demo shows

- **Choropleth map** — `viewer-vue` + `viewer-cesium` rendering a GeoJSON layer
  with **`colorBy`** ramps from the brand tokens (`#64D8BF` ↔ `#B32A2D`).
- **Reactive controls** — `FYearSlider`, native select, `FChoroplethLegend`
  styled by tokens. Change indicator / year → map recolours instantly.
- **What-if** — pick a driver indicator, move its slider for the selected
  commune; `scenario-engine`'s `predictIndicator(linear)` fits across all
  communes and reports baseline / predicted / Δ with the R² of the fit.
- **Click-to-select** — click a commune on the map, the sidebar shows its
  current value (and any active override), the what-if panel targets it.

What's intentionally fake here: the commune polygons are small squares around
the real centroids and the indicator values are plausible but invented. The
shapes of `Place` / `Indicator` / `Timeseries` are real — replace
`src/data/sample.ts` with the actual prepared Brussels dataset and the UI
follows.

## Data

The whole app reads from `src/data/index.ts`, which re-exports one dataset:

- **`sample`** (default) — small fabricated data, committed, so a fresh clone
  runs with zero setup (`src/data/sample.ts`).
- **`real`** — the actual Brussels dataset, generated on demand into
  `src/data/real.ts` (git-ignored; never hand-edited).

Both expose the same five names: `places: Place[]`, `indicators: Indicator[]`,
`series: Timeseries[]`, `years: number[]`, `brusselsBbox`.

### Loading the real data (one command)

Copy the two source files from the old BrusselsMigration repo into `data/raw/`
(git-ignored — data is data, not code), then run the importer:

```bash
data/raw/brussels-merged.geojson   # commune polygons + identity (niscode, name)
data/raw/brussels-data.json        # { communes, metadata, allYears }

pnpm --filter @fari-brussels/brussels-twin import:data    # generate real.ts + go live
pnpm --filter @fari-brussels/brussels-twin import:reset   # switch back to sample
```

`import:data` reads `data/raw/`, writes `src/data/real.ts`, and repoints the one
export line in `src/data/index.ts` to `./real`. That one-line switch is the only
tracked change — the large raw files and generated `real.ts` stay git-ignored,
and the committed default remains `sample` so CI / fresh clones always build.
Run `import:reset` before committing if the switch got flipped.

The importer (`scripts/import-brussels-data.mjs`) maps NIS code → `Place.id`,
`metadata` → `Indicator[]` (English labels; `category`/`higher_is_better` are
heuristics you can tune in the script), and `communes[nis].timeseries` →
`Timeseries[]`. To ingest from raw UrbIS shapefiles + Excel instead of the
prepared JSON, use `@fari-brussels/geo-ingest` (`readShapefile`, `featuresToPlaces`,
`readExcelTable`) — the toolkit's
[end-to-end walkthrough](../../apps/docs/guide/end-to-end.md) shows that pattern.

## Architecture (what the toolkit gives you for free here)

```
sample.ts (Place[] + Timeseries[] + Indicator[])
     │ @fari-brussels/geo-ingest (joinIndicatorValues)
     │ @fari-brussels/scenario-engine (applyOverrides at the active period)
     ▼
FeatureCollection  ──▶  TwinViewer (@fari-brussels/viewer-vue + @fari-brussels/viewer-cesium)
                                colorBy ramp from @fari-brussels/twin-ui-tokens
                                styled with @fari-brussels/twin-ui-vue widgets

scenario-engine.predictIndicator(linear) drives the what-if panel
```

## Not in this demo yet (next iterations)

- **LLM chat panel** — `@fari-brussels/twin-llm` is wired into the deps; a `LlmPanel.vue`
  using `Conversation` + scripted `MockProvider` (or a real Anthropic adapter)
  comes next. Tool builders for `set_active_indicator` / `apply_overrides` /
  `predict_indicator` already exist in `@fari-brussels/twin-llm/tools/domain`.
- **Polynomial / CART / k-NN model toggle** — `scenario-engine` ships all four;
  add a model picker to the what-if panel.
- **Real data** — replace `src/data/sample.ts`.
- **Compare scenarios** — save/load named scenarios (`ScenarioState.toScenario`).
- **3D buildings layer** — `tileset3d` layer on top of the choropleth.
