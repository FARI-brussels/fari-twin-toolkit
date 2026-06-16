# @fari-brussels/auth-vue

Vue 3 Keycloak bindings for FARI apps — a **null-safe** `useAuth` composable plus
pure redirect-URI helpers.

It wraps [`@josempgon/vue-keycloak`](https://www.npmjs.com/package/@josempgon/vue-keycloak),
which keeps auth state in a module-level singleton. That means `useAuth()` works
even when the `vueKeycloak` plugin was never installed (e.g. an app running with
no `VITE_KEYCLOAK_URL`): you just get a coherent **signed-out** state instead of
a crash.

## Install

```bash
pnpm add @fari-brussels/auth-vue @josempgon/vue-keycloak vue
```

Register the plugin once, conditionally, in your app entry — so a missing
Keycloak URL means "run unauthenticated" rather than a hard failure:

```ts
import { vueKeycloak } from '@josempgon/vue-keycloak'

if (import.meta.env.VITE_KEYCLOAK_URL) {
  app.use(vueKeycloak, {
    config: {
      url: import.meta.env.VITE_KEYCLOAK_URL,
      realm: import.meta.env.VITE_KEYCLOAK_REALM,
      clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
    },
    initOptions: {
      onLoad: 'check-sso',
      // Hidden-iframe SSO probe instead of a full-page redirect, so a
      // not-yet-whitelisted dev origin can't replace your app with Keycloak's
      // "Invalid redirect_uri" error page:
      silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
      pkceMethod: 'S256',
      checkLoginIframe: false,
    },
  })
}
```

> The login redirect origin must be whitelisted in the Keycloak client's
> **Valid Redirect URIs** (and **Web Origins**). For local dev that means the
> exact `http://localhost:<port>/*` your dev server uses.

## Usage

```ts
import { useAuth } from '@fari-brussels/auth-vue'

const {
  isAuthenticated,
  isPending,
  displayName,
  userEmail,
  userRoles,
  isAdmin,
  avatarUrl,
  hasRole,
  login,
  logout,
  getToken, // fresh, auto-refreshed bearer token for API calls
} = useAuth({ redirectPath: import.meta.env.VITE_KEYCLOAK_REDIRECT_PATH ?? '/callback' })
```

In your post-login callback route, send the user back where they were:

```ts
import { useAuth } from '@fari-brussels/auth-vue'
const { consumeReturnPath } = useAuth()
router.replace(consumeReturnPath() ?? { name: 'Home' })
```

### Authenticated API calls

`getToken()` refreshes the token if it's about to expire and never throws:

```ts
const token = await getToken()
if (token) request.headers.set('Authorization', `Bearer ${token}`)
```

## Design notes

- **No `vue-router` dependency** — the post-login return path is captured from
  `window.location`, so the composable works in any Vue app.
- **No hard-coded env-var names** — redirect paths are passed in, keeping
  app-specific config in the app.
- **SSR-safe** — every `window`/`sessionStorage` touch is guarded.

## API

| Export                 | Kind       | Notes                                                    |
| ---------------------- | ---------- | -------------------------------------------------------- |
| `useAuth(options?)`    | composable | The main entry point (see `UseAuthOptions`).             |
| `useLoginDialog()`     | composable | Shared open/close state for an app-wide login dialog.    |
| `buildRedirectUri`     | function   | `(origin, path) => uri` with path normalization.         |
| `normalizePath`        | function   | Empty/`'/'` → `''`; otherwise ensures one leading slash. |
| `getLogoutRedirectUri` | function   | Resolves a logout target; `'none'` disables it.          |
| `KeycloakTokenParsed`  | type       | The token claims this package reads.                     |
