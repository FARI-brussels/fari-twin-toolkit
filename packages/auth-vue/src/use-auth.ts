import { computed } from 'vue'
import { useKeycloak } from '@josempgon/vue-keycloak'
import { buildRedirectUri } from './path'
import type { KeycloakTokenParsed } from './types'

const RETURN_PATH_KEY = 'auth_return_path'

export interface UseAuthOptions {
  /** Path Keycloak redirects back to after login. Default: `'/callback'`. */
  redirectPath?: string
  /** Path for the register flow. Default: same as `redirectPath`. */
  registerPath?: string
  /**
   * Build an avatar image URL from a display name. Default: a ui-avatars.com
   * initials avatar tinted with FARI brand teal. Override to self-host avatars
   * or change the look.
   */
  avatarUrlFor?: (displayName: string) => string
}

function defaultAvatarUrl(displayName: string): string {
  const initials = (displayName || 'User')
    .split(' ')
    .map((n) => n[0])
    .join('+')
    .toUpperCase()
  return `https://ui-avatars.com/api/?name=${initials}&bold=true&color=FFFFFF&background=64d8bf&size=32`
}

/** `location.origin`, guarded for non-browser (SSR/test) contexts. */
function currentOrigin(): string {
  return typeof window === 'undefined' ? '' : window.location.origin
}

/** Current `path + query + hash` — the target to return to after login. */
function currentPath(): string {
  if (typeof window === 'undefined') return '/'
  const { pathname, search, hash } = window.location
  return `${pathname}${search}${hash}`
}

/**
 * Null-safe Keycloak auth composable for FARI apps.
 *
 * Works whether or not the `vueKeycloak` plugin was installed: the plugin keeps
 * its state in a module-level singleton, so an app that runs unauthenticated
 * (no `VITE_KEYCLOAK_URL`) still gets a coherent signed-out state here instead
 * of throwing.
 *
 * Deliberately decoupled from `vue-router` (return path comes from
 * `window.location`) and from any specific env-var names (redirect paths are
 * passed in via {@link UseAuthOptions}), so it drops into any Vue app.
 */
export function useAuth(options: UseAuthOptions = {}) {
  const { keycloak, isAuthenticated, isPending, decodedToken, username } = useKeycloak()

  const redirectPath = options.redirectPath ?? '/callback'
  const registerPath = options.registerPath ?? redirectPath
  const avatarUrlFor = options.avatarUrlFor ?? defaultAvatarUrl

  const tokenPayload = computed<KeycloakTokenParsed | undefined>(
    () => (decodedToken.value ?? keycloak.value?.tokenParsed) as KeycloakTokenParsed | undefined,
  )

  const displayName = computed(
    () =>
      tokenPayload.value?.name ?? tokenPayload.value?.preferred_username ?? username.value ?? '',
  )
  const userEmail = computed(() => tokenPayload.value?.email ?? '')
  const userId = computed(() => tokenPayload.value?.sub ?? null)
  const userRoles = computed(() => tokenPayload.value?.realm_access?.roles ?? [])
  const isAdmin = computed(() => userRoles.value.includes('admin'))
  /** Write access is gated on being signed in; refine per-app via {@link hasRole}. */
  const canWrite = computed(() => isAuthenticated.value)
  const avatarUrl = computed(() => avatarUrlFor(displayName.value))

  /** True when the signed-in user holds the given realm role. */
  function hasRole(role: string): boolean {
    return userRoles.value.includes(role)
  }

  function storeReturnPath(): void {
    if (typeof window === 'undefined') return
    window.sessionStorage.setItem(RETURN_PATH_KEY, currentPath())
  }

  /**
   * Read (and clear) the path stashed before a login redirect. Call this from
   * your post-login callback route to send the user back where they were.
   */
  function consumeReturnPath(): string | null {
    if (typeof window === 'undefined') return null
    const path = window.sessionStorage.getItem(RETURN_PATH_KEY)
    window.sessionStorage.removeItem(RETURN_PATH_KEY)
    return path
  }

  function login(): void {
    storeReturnPath()
    keycloak.value?.login({ redirectUri: buildRedirectUri(currentOrigin(), redirectPath) })
  }

  function register(): void {
    storeReturnPath()
    keycloak.value?.register({ redirectUri: buildRedirectUri(currentOrigin(), registerPath) })
  }

  function logout(redirectUri?: string): void {
    keycloak.value?.logout(redirectUri ? { redirectUri } : undefined)
  }

  /**
   * Return a fresh access token (refreshing if it expires within 30s), or
   * `null` when signed out. Never throws — on refresh failure it returns the
   * existing token so in-flight requests can still try.
   */
  async function getToken(): Promise<string | null> {
    const kc = keycloak.value
    if (!kc || !isAuthenticated.value) return null
    try {
      await kc.updateToken(30)
    } catch {
      // fall through — return whatever token we currently hold
    }
    return kc.token ?? null
  }

  return {
    isAuthenticated,
    isPending,
    displayName,
    userEmail,
    userId,
    userRoles,
    isAdmin,
    canWrite,
    avatarUrl,
    hasRole,
    login,
    register,
    logout,
    getToken,
    consumeReturnPath,
  }
}
