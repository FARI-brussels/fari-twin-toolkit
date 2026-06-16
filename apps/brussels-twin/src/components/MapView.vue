<script setup lang="ts">
import { computed } from 'vue'
import { TwinViewer } from '@fari-brussels/viewer-vue'
import { CesiumAdapter } from '@fari-brussels/viewer-cesium'
import type { LayerSpec, PickResult } from '@fari-brussels/viewer-core'
import { joinIndicatorValues } from '@fari-brussels/geo-ingest'
import { tokens } from '@fari-brussels/twin-ui-tokens'
import { applyOverrides } from '@fari-brussels/scenario-engine'
import type { Timeseries } from '@fari-brussels/twin-types'
import { brusselsBbox, places, series } from '../data'
import { activeIndicator, dataset, state } from '../state'

/**
 * Build the choropleth FeatureCollection from places + indicator timeseries +
 * any what-if overrides, then hand it to TwinViewer with a colorBy ramp.
 * Re-runs reactively whenever the user moves a control.
 */
const layers = computed<LayerSpec[]>(() => {
  const period = String(state.activeYear)

  // Apply scenario overrides at the active year, then re-extract timeseries.
  const overridden = applyOverrides(dataset, state.overrides, { period })
  const seriesAtYear: Timeseries[] = series.map((ts) => ({
    place_id: ts.place_id,
    indicator_key: ts.indicator_key,
    points: ts.points.map((p) => {
      if (p.period !== period) return p
      const match = overridden.values.find(
        (v) =>
          v.place_id === ts.place_id && v.indicator_key === ts.indicator_key && v.period === period,
      )
      return match ? { period: p.period, value: match.value } : p
    }),
  }))
  const filtered = seriesAtYear.filter((s) => s.indicator_key === state.activeIndicator)
  const fc = joinIndicatorValues(places, filtered, { period })

  // Higher-is-better -> teal=good (high), red=bad (low); else inverted.
  const ind = activeIndicator.value
  const min = Math.min(
    ...fc.features.map((f) => Number(f.properties?.value ?? Infinity)).filter(Number.isFinite),
  )
  const max = Math.max(
    ...fc.features.map((f) => Number(f.properties?.value ?? -Infinity)).filter(Number.isFinite),
  )
  const teal = tokens.brandColors.lighthouseBlue
  const red = tokens.statusColors.notOk
  const stops = ind.higher_is_better
    ? [
        { value: min, color: red },
        { value: max, color: teal },
      ]
    : [
        { value: min, color: teal },
        { value: max, color: red },
      ]

  return [
    {
      id: `choropleth-${ind.key}-${period}`,
      kind: 'geojson',
      data: fc,
      style: {
        colorBy: { property: 'value', stops },
        strokeColor: tokens.brandColors.blue,
        strokeWidth: 1,
      },
    },
  ]
})

function onPick(pick: PickResult) {
  const id = pick.properties?.code ?? pick.properties?.name
  if (typeof id === 'string') state.activePlaceId = id
}
</script>

<template>
  <TwinViewer
    :adapter="() => new CesiumAdapter()"
    :layers="layers"
    :basemap="{ kind: 'osm' }"
    :camera="{ bbox: brusselsBbox }"
    class="map"
    @pick="onPick"
  />
</template>

<style scoped>
.map {
  width: 100%;
  height: 100%;
}
</style>
