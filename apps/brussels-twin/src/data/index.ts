/**
 * Active dataset for the app. Everything else imports from `../data` (this
 * file) — never from `./sample` or `./real` directly — so swapping the data
 * source is a one-line change here.
 *
 * Default: the bundled `sample` data, so a fresh clone runs with zero setup.
 *
 * To use the real Brussels dataset:
 *   1. Drop the source files into `data/raw/` (see scripts/import-brussels-data.mjs).
 *   2. Run `pnpm --filter @fari-brussels/brussels-twin import:data`.
 * The importer writes `./real.ts` and repoints the line below to `./real`.
 * Run `pnpm --filter @fari-brussels/brussels-twin import:reset` to switch back.
 */
export * from './real'
