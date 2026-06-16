# Publishing the `@fari-brussels/*` toolkit

The toolkit packages (`packages/*`) are published from this monorepo with
[Changesets](https://github.com/changesets/changesets). The apps (`apps/*`) are
`private` and never published — they consume the packages via `workspace:*` for
instant HMR during development.

## Day-to-day workflow (unchanged)

Develop in the monorepo as usual: edit a `@fari-brussels/*` package and the apps pick it
up immediately (`workspace:*` + Vite HMR). **No publish step is needed to test
changes locally** — that convenience is exactly why the apps stay in the monorepo.

## Cutting a release

1. **Describe the change** (run after making changes to one or more packages):

   ```bash
   pnpm changeset
   ```

   Pick the changed packages + bump type (patch/minor/major) and write a summary.
   This writes a markdown file under `.changeset/`.

2. **Version** (consumes the changesets, bumps versions + changelogs):

   ```bash
   pnpm version-packages
   ```

3. **Publish** (builds the packages, then publishes the bumped ones):
   ```bash
   pnpm release
   ```

CI does steps 2–3 automatically — see `.github/workflows/release.yml`: merging a
PR that contains changesets opens/refreshes a "Version Packages" PR; merging
_that_ publishes.

## Registry: GitHub Packages (private to the FARI org)

Packages publish to `https://npm.pkg.github.com`. Consumers (and CI) need an
`.npmrc` that points the scope at GitHub Packages and authenticates:

```ini
@fari-brussels:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

In CI, `NODE_AUTH_TOKEN` is the built-in `GITHUB_TOKEN` (with `packages: write`).
A consuming repo uses a PAT / org token with `read:packages`.

## Scope matches the owner

GitHub Packages requires the **npm scope to equal the repository owner**. The
repo owner is **`FARI-brussels`**, so the packages are scoped **`@fari-brussels/*`**
to match — they publish to GitHub Packages with no extra infra. (This is why the
scope is `@fari-brussels` rather than a tidier `@fari`: a bare `@fari` scope would
require a `fari` GitHub org, or publishing to public npm.)
