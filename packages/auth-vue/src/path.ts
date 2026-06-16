/**
 * Redirect-URI helpers for Keycloak flows. Pure functions — no `window`,
 * no env access — so they are trivially testable and SSR-safe.
 */

/**
 * Normalize a path so it either is empty or starts with a single `/`.
 * `null`/`undefined`/`''`/`'/'` all collapse to `''` (i.e. "the origin itself").
 */
export function normalizePath(value: string | null | undefined): string {
  if (!value || value === '/') return ''
  return value.startsWith('/') ? value : `/${value}`
}

/** Join an origin and a path into a full redirect URI. */
export function buildRedirectUri(origin: string, path: string | null | undefined): string {
  return `${origin}${normalizePath(path)}`
}

/**
 * Resolve the post-logout redirect URI from a configured setting.
 * - `undefined`  → fall back to the login redirect path.
 * - `'none'`     → `null` (logout redirect disabled).
 * - otherwise    → that path, resolved against `origin`.
 */
export function getLogoutRedirectUri(
  origin: string,
  logoutSetting: string | undefined,
  fallbackLoginPath: string | null | undefined,
): string | null {
  if (logoutSetting === undefined) return buildRedirectUri(origin, fallbackLoginPath)
  if (logoutSetting.toLowerCase() === 'none') return null
  return buildRedirectUri(origin, logoutSetting)
}
