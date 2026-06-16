import { describe, it, expect } from 'vitest'
import { normalizePath, buildRedirectUri, getLogoutRedirectUri } from '../src/path'

describe('normalizePath', () => {
  it('collapses empty-ish values to ""', () => {
    expect(normalizePath(undefined)).toBe('')
    expect(normalizePath(null)).toBe('')
    expect(normalizePath('')).toBe('')
    expect(normalizePath('/')).toBe('')
  })

  it('ensures a single leading slash', () => {
    expect(normalizePath('callback')).toBe('/callback')
    expect(normalizePath('/callback')).toBe('/callback')
  })
})

describe('buildRedirectUri', () => {
  it('joins origin and normalized path', () => {
    expect(buildRedirectUri('http://localhost:5173', '/callback')).toBe(
      'http://localhost:5173/callback',
    )
    expect(buildRedirectUri('http://localhost:5173', 'callback')).toBe(
      'http://localhost:5173/callback',
    )
  })

  it('returns the bare origin for empty paths', () => {
    expect(buildRedirectUri('http://localhost:5173', '/')).toBe('http://localhost:5173')
    expect(buildRedirectUri('http://localhost:5173', undefined)).toBe('http://localhost:5173')
  })
})

describe('getLogoutRedirectUri', () => {
  it('falls back to the login path when unset', () => {
    expect(getLogoutRedirectUri('http://x', undefined, '/callback')).toBe('http://x/callback')
  })

  it('disables redirect on "none" (case-insensitive)', () => {
    expect(getLogoutRedirectUri('http://x', 'none', '/callback')).toBeNull()
    expect(getLogoutRedirectUri('http://x', 'NONE', '/callback')).toBeNull()
  })

  it('uses the explicit logout path otherwise', () => {
    expect(getLogoutRedirectUri('http://x', '/bye', '/callback')).toBe('http://x/bye')
  })
})
