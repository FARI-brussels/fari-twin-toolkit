# Getting started

## Prerequisites

- **Node.js ≥ 20** and **pnpm 9** (`corepack enable` will provide pnpm).
- **uv** for the Python packages ([install](https://docs.astral.sh/uv/)).

## Clone & install

```bash
git clone https://github.com/FARI-brussels/fari-twin-toolkit
cd fari-twin-toolkit
pnpm install
```

## Everyday commands

Run from the repo root (turbo runs each across all packages):

```bash
pnpm build       # build every package
pnpm test        # run unit tests (Vitest)
pnpm typecheck   # type-check everything
pnpm format      # Prettier write
```

Run the visual playground (design tokens + a live Cesium map, with HMR):

```bash
pnpm --filter @fari-brussels/playground dev      # http://localhost:5180
```

Run this documentation site locally:

```bash
pnpm --filter @fari-brussels/docs dev
```

## Using a package in your app

Packages are published under the `@fari` scope. Install only what you need:

```bash
pnpm add @fari-brussels/twin-types @fari-brussels/viewer-core @fari-brussels/viewer-cesium @fari-brussels/twin-ui-tokens
pnpm add @fari-brussels/geo-ingest        # Node-side ingestion
```

Python:

```bash
uv add fari-twin-types
```

## Quality gates

CI enforces, on every PR:

- build + typecheck + unit tests,
- Prettier formatting,
- **codegen drift** — regenerate the TS types and Pydantic models from
  `specs/openapi.yaml` and fail if the committed output differs. This is what
  keeps the two languages in sync. After editing the spec, run:

```bash
pnpm --filter @fari-brussels/twin-types generate
cd python/twin-types && ./generate.sh
```
