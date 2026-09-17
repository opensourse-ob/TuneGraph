import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules() })
describe('OAuth configuration', () => {
  it('uses explicitly configured credentials and URLs', async () => {
    vi.resetModules()
    vi.stubEnv('SPOTIFY_CLIENT_ID', 'test-id')
    vi.stubEnv('SPOTIFY_CLIENT_SECRET', 'test-secret')
    vi.stubEnv('SPOTIFY_REDIRECT_URI', 'https://example.test/callback')
    vi.stubEnv('FRONTEND_URL', 'https://example.test')
    const config = await import('../utils/data')
    expect(config.SPOTIFY_CLIENT_ID).toBe('test-id')
    expect(config.SPOTIFY_CLIENT_SECRET).toBe('test-secret')
    expect(config.SPOTIFY_REDIRECT_URI).toBe('https://example.test/callback')
    expect(config.FRONTEND_URL).toBe('https://example.test')
    expect(config.SCOPES).toEqual(['user-top-read'])
  })
  it('defaults to loopback URLs without fabricating credentials', async () => {
    vi.resetModules()
    for (const name of ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET', 'SPOTIFY_REDIRECT_URI', 'FRONTEND_URL']) {
      vi.stubEnv(name, undefined)
    }
    const config = await import('../utils/data')
    expect(config.SPOTIFY_CLIENT_ID).toBeUndefined()
    expect(config.SPOTIFY_CLIENT_SECRET).toBeUndefined()
    expect(config.SPOTIFY_REDIRECT_URI).toBe('http://127.0.0.1:3001/api/auth/callback')
    expect(config.FRONTEND_URL).toBe('http://127.0.0.1:5173')
  })
})
