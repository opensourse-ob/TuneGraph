import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import type { Express } from 'express'

vi.mock('../utils/data', () => ({
  SCOPES: ['user-top-read'], SPOTIFY_CLIENT_ID: 'test-client-id',
  SPOTIFY_CLIENT_SECRET: 'test-client-secret',
  SPOTIFY_REDIRECT_URI: 'http://127.0.0.1:3001/api/auth/callback',
  FRONTEND_URL: 'http://127.0.0.1:5173',
}))
let app: Express
const fetchMock = vi.fn()
beforeAll(async () => {
  vi.stubEnv('FRONTEND_URL', 'http://127.0.0.1:5173')
  app = (await import('../app')).default
})
afterAll(() => vi.unstubAllEnvs())
beforeEach(() => {
  fetchMock.mockReset().mockRejectedValue(new Error('Unexpected network call'))
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => { fetchMock.mockReset(); vi.unstubAllGlobals(); vi.restoreAllMocks() })
function upstream(data: unknown) {
  fetchMock.mockResolvedValue(new Response(JSON.stringify(data), { status: 200 }))
}
const protectedRoutes = ['/top-artists', '/top-songs', '/top-genres', '/users/me']

describe('configured Express application', () => {
  it('keeps the API root health response', async () => {
    const res = await request(app).get('/')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ message: 'Welcome to TuneGraph API' })
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it.each([false, true])('auth status reports cookie presence (%s)', async loggedIn => {
    const req = request(app).get('/api/auth/status')
    if (loggedIn) req.set('Cookie', 'spotify_access_token=test-access')
    const res = await req
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ authenticated: loggedIn })
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('auth configuration never returns credentials', async () => {
    const res = await request(app).get('/api/auth/config')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      redirect_uri: 'http://127.0.0.1:3001/api/auth/callback', frontend_url: 'http://127.0.0.1:5173',
      client_id_configured: true, client_secret_configured: true,
    })
    expect(res.text).not.toContain('test-client-secret')
  })
  it.each(protectedRoutes)('protects %s before contacting Spotify', async path => {
    const res = await request(app).get(`/api/spotify${path}`)
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'Unauthorized' })
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('parses cookies and transforms a mocked artist request through real middleware and helpers', async () => {
    const artist = { id: 'a', name: 'Artist A', genres: ['pop'], images: [], popularity: 80, external_urls: { spotify: 'https://example.test/a' } }
    upstream({ items: [artist] })
    const res = await request(app).get('/api/spotify/top-artists?time_range=long_term&limit=1')
      .set('Cookie', 'spotify_access_token=test-access')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ time_range: 'long_term', items: [{ ...artist, rank: 1 }] })
    expect(fetchMock).toHaveBeenCalledWith('https://api.spotify.com/v1/me/top/artists?time_range=long_term&limit=1', {
      headers: { Authorization: 'Bearer test-access', 'Content-Type': 'application/json' },
    })
  })
  it.each([
    ['/top-songs', { items: [{ name: 'Song', artists: [{ name: 'Artist' }], album: { images: [] } }] }, { time_range: 'medium_term', items: [{ rank: 1, name: 'Song', artist: ['Artist'], albumCover: null }] }],
    ['/top-genres', { items: [{ genres: ['pop'] }] }, { time_range: 'medium_term', items: [{ rank: 1, name: 'pop', count: 1 }] }],
    ['/users/me', { id: 'me', display_name: 'Person', images: [] }, { id: 'me', display_name: 'Person', images: [] }],
    ['/users/person', { id: 'person', display_name: 'Person', images: [] }, { id: 'person', display_name: 'Person', images: [] }],
  ])('routes %s to its controller', async (path, data, expected) => {
    upstream(data)
    const res = await request(app).get(`/api/spotify${path}`).set('Cookie', 'spotify_access_token=test-access')
    expect(res.status).toBe(200)
    expect(res.body).toEqual(expected)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
  it.each(['limit=51', 'time_range=invalid', 'limit=10&limit=20', 'limit%5Bx%5D=10'])('rejects query %s', async query => {
    const res = await request(app).get(`/api/spotify/top-artists?${query}`).set('Cookie', 'spotify_access_token=test-access')
    expect(res.status).toBe(400)
    expect(res.body).not.toHaveProperty('details')
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it.each([401, 429, 503])('sanitizes Spotify HTTP %i through the whole request path', async status => {
    fetchMock.mockResolvedValue(new Response('private-upstream-test-access', { status }))
    const res = await request(app).get('/api/spotify/top-songs').set('Cookie', 'spotify_access_token=test-access')
    expect(res.status).toBe(status === 503 ? 502 : status)
    expect(res.body).toEqual({ error: 'Failed to fetch top songs' })
    expect(res.text).not.toContain('private-upstream')
    expect(JSON.stringify([vi.mocked(console.log).mock.calls, vi.mocked(console.error).mock.calls])).not.toContain('test-access')
  })
  it('keeps CORS credential support for the configured frontend', async () => {
    const res = await request(app).options('/api/spotify/top-artists')
      .set('Origin', 'http://127.0.0.1:5173').set('Access-Control-Request-Method', 'GET')
    expect(res.status).toBe(204)
    expect(res.headers['access-control-allow-origin']).toBe('http://127.0.0.1:5173')
    expect(res.headers['access-control-allow-credentials']).toBe('true')
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('rejects missing callback state without logging query values', async () => {
    const res = await request(app).get('/api/auth/callback?code=private-code')
    expect(res.status).toBe(403)
    expect(vi.mocked(console.log)).toHaveBeenCalledWith('/api/auth/callback')
    expect(JSON.stringify([vi.mocked(console.log).mock.calls, vi.mocked(console.error).mock.calls])).not.toContain('private-code')
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('parses refresh cookies and routes refresh without exposing replacement tokens', async () => {
    upstream({ access_token: 'test-new-access', expires_in: 3600 })
    const res = await request(app).post('/api/auth/refresh').set('Cookie', 'spotify_refresh_token=test-refresh')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ success: true, expires_in: 3600 })
    expect(res.headers['set-cookie']).toEqual([expect.stringContaining('spotify_access_token=test-new-access')])
    expect(res.text).not.toContain('test-new-access')
    expect(fetchMock.mock.calls[0][1].body.get('grant_type')).toBe('refresh_token')
  })
  it('routes missing refresh credentials to the controller', async () => {
    const res = await request(app).post('/api/auth/refresh')
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'Refresh token is required' })
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('handles malformed JSON using the existing global error handler', async () => {
    const res = await request(app).post('/api/auth/refresh').set('Content-Type', 'application/json').send('{"private-token":')
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ err: 'An error occurred' })
    expect(res.text).not.toContain('private-token')
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('returns 404 for an unknown route', async () => {
    const res = await request(app).get('/api/not-a-route')
    expect(res.status).toBe(404)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
