/**
 * URL Builder Utilities
 * Builds full URLs for assets served by the backend
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

/**
 * Builds a full URL for an asset served by the backend.
 * Handles relative URLs (e.g., /assets_manager/3) and absolute URLs.
 */
export function buildAssetUrl(url: string): string {
  if (!url) return '';

  // Already an absolute URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Relative URL - prefix with backend URL
  const baseUrl = BACKEND_URL.endsWith('/') ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
  const path = url.startsWith('/') ? url : `/${url}`;

  return `${baseUrl}${path}`;
}
