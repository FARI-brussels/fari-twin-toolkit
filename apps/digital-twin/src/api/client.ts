/**
 * API Client - Ky instance with auth hooks
 */
import ky from 'ky';
import { getToken, useKeycloak } from '@josempgon/vue-keycloak';

const { isAuthenticated } = useKeycloak();

export const apiClient = ky.create({
  prefixUrl: import.meta.env.VITE_BACKEND_URL,
  timeout: 30000,
  hooks: {
    beforeRequest: [
      async request => {
        // Only fetch a token when signed in. Calling getToken() while logged out
        // triggers Keycloak's updateToken → a "no refresh token" console error on
        // every request; public reads should just proceed unauthenticated.
        if (!isAuthenticated.value) return;
        try {
          const token = await getToken();
          if (token) {
            request.headers.set('Authorization', `Bearer ${token}`);
          }
        } catch {
          // Allow the call to proceed even if the token refresh fails.
        }
      },
    ],
  },
});

export const mobilityTwinClient = ky.create({
  prefixUrl: 'https://api.mobilitytwin.brussels',
  timeout: 30000,
  hooks: {
    beforeRequest: [
      request => {
        const twinToken = import.meta.env.VITE_TWIN_API_TOKEN;
        if (twinToken) {
          request.headers.set('Authorization', `Bearer ${twinToken}`);
        }
      },
    ],
  },
});
