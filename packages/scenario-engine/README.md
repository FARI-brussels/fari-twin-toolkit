# @fari-brussels/scenario-engine

Generic **regression + scenario** engine for FARI digital twins. The shape is
universal:

> _panel data (places × indicators × periods) + an override → predicted outcome_

That covers Brussels-style socio-economic what-ifs, mobility scenarios ("close
this street → predicted traffic"), energy planning ("install N MW solar →
predicted coverage"), climate adaptation, and any project where you fit a model
across places and ask "what if this number changed?".

Brussels-flavoured policy is **not** baked in (no indicator catalog, no driver
direction convention, no localStorage). The Brussels v2 app configures the
engine with its own indicators; another twin configures it differently.

## Install

```bash
pnpm add @fari-brussels/scenario-engine @fari-brussels/twin-types
```

## Regressors

The four models match `ModelKind` in `@fari-brussels/twin-types`:

```ts
import { fitModel } from '@fari-brussels/scenario-engine'

const fitted = fitModel('linear', [
  { x: 0, y: 1 },
  { x: 1, y: 3 },
  { x: 2, y: 5 },
])
fitted.predict(10) // 21
fitted.r2() // 1
```

| Model         | Implementation                                             |
| ------------- | ---------------------------------------------------------- |
| `linear`      | Weighted OLS (closed form)                                 |
| `polynomial2` | Normal equations via Gaussian elimination                  |
| `cart`        | Univariate binary tree, weighted variance reduction        |
| `knn`         | min-max normalized x, k=7 default, weighted neighbour mean |

Per-model options:

```ts
fitModel('cart', samples, { cart: { maxDepth: 3, minLeaf: 5 } })
fitModel('knn', samples, { knn: { k: 7 } })
```

## Panel data + scenarios

```ts
import {
  panelFromTimeseries,
  pairs,
  applyOverrides,
  ScenarioState,
  predictIndicator,
} from '@fari-brussels/scenario-engine'

const dataset = panelFromTimeseries(myTimeseries) // from @fari-brussels/twin-types

const scenario = new ScenarioState()
scenario.set({ place_id: '21004', indicator_key: 'unemployment_rate', value: 18 })

const result = predictIndicator({
  dataset,
  driverKey: 'unemployment_rate',
  outcomeKey: 'income_index',
  placeId: '21004',
  model: 'linear',
  overrides: scenario.values(),
})
// { baseline, predicted, delta, r2 }
```

`predictIndicator` fits `outcome ~ driver` across all places at the given
period, then predicts the outcome for one place after the scenario's overrides
are applied. The reported `delta` is the predicted change vs. what the model
would predict at the _original_ driver value — so a no-op scenario gives a delta
of zero.

## Persistence

`ScenarioState.toScenario(id, name, options)` produces a wire `Scenario`
matching `@fari-brussels/twin-types`; `ScenarioState.fromScenario(wire)` reverses it.
That's the seam for any backend / localStorage / LLM tool layer (`@fari-brussels/twin-llm`
will call right into this).

## Tests

```bash
pnpm --filter @fari-brussels/scenario-engine test
```

Math is verified against known answers (`y = 2x + 1`, `y = x²`, step functions),
plus dataset/scenario/predict end-to-end.

## Not yet (v0.2+)

- Multivariate regression (multiple drivers at once)
- Confidence intervals / standard errors
- Time-aware models (period as a feature, not a slice)
- Pre-built drivers helper (top-3 by correlation per outcome)
