/**
 * The subset of Keycloak's parsed access-token claims this package reads.
 * Kept local (rather than importing keycloak-js' broad type) so consumers get
 * precise, documented fields.
 */
export interface KeycloakTokenParsed {
  /** Full display name, when the realm populates it. */
  name?: string
  /** Login / username. */
  preferred_username?: string
  email?: string
  /** Stable user id (subject). */
  sub?: string
  /** Realm-level roles. */
  realm_access?: { roles: string[] }
  /** Per-client roles, keyed by client id. */
  resource_access?: Record<string, { roles: string[] }>
}
