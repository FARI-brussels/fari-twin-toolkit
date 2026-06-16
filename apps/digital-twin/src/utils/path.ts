/**
 * Keycloak redirect-URI path helpers.
 *
 * Promoted into the toolkit as `@fari-brussels/auth-vue` — re-exported here so existing
 * `@/utils/path` imports keep working while the single implementation lives in
 * the shared package.
 */
export { normalizePath, buildRedirectUri, getLogoutRedirectUri } from '@fari-brussels/auth-vue';
