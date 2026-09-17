import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import type { Request, Response } from 'express'
import { login, callback, refreshToken, getConfig, checkStatus } from '../controllers/authController'
import { SCOPES } from '../utils/data'

vi.mock('../utils/data', async importOriginal => {
  const actual = await importOriginal<typeof import('../utils/data')>()
  return {
    ...actual,
    FRONTEND_URL: 'http://127.0.0.1:5173',
    get SPOTIFY_CLIENT_ID() { return process.env.SPOTIFY_CLIENT_ID },
    get SPOTIFY_CLIENT_SECRET() { return process.env.SPOTIFY_CLIENT_SECRET },
    get SPOTIFY_REDIRECT_URI() { return process.env.SPOTIFY_REDIRECT_URI },
  }
})

const fetchMock = vi.fn()
const tokenData = {
  access_token: 'test-access', refresh_token: 'test-refresh', expires_in: 3600,
}
function response() {
  return {
    status: vi.fn().mockReturnThis(), json: vi.fn(), cookie: vi.fn(),
    clearCookie: vi.fn(), redirect: vi.fn(),
  }
}
type TestResponse = ReturnType<typeof response>
function asResponse(res: TestResponse) { return res as unknown as Response }
function request(state?: unknown, cookie?: unknown, code: unknown = 'test-code') {
  return { query: { state, code }, cookies: { spotify_auth_state: cookie } } as unknown as Request
}
function issueState() {
  const res = response()
  login({ cookies: {} } as Request, asResponse(res))
  return res.cookie.mock.calls.find(([name]) => name === 'spotify_auth_state')![1] as string
}
function refreshRequest(token: unknown = 'test-existing-refresh') {
  return { cookies: { spotify_refresh_token: token } } as unknown as Request
}
function cookieOptions(res: TestResponse, name: string) {
  return res.cookie.mock.calls.find(([cookieName]) => cookieName === name)![2]
}

beforeEach(() => {
  vi.stubEnv('SPOTIFY_CLIENT_ID', 'test-client-id')
  vi.stubEnv('SPOTIFY_CLIENT_SECRET', 'test-client-secret')
  vi.stubEnv('SPOTIFY_REDIRECT_URI', 'http://127.0.0.1:3001/api/auth/callback')
  vi.stubEnv('NODE_ENV', 'test')
  fetchMock.mockReset().mockResolvedValue({ ok: true, json: async () => tokenData })
  // Every network call, including an unexpected one, is intercepted.
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'log').mockImplementation(() => {})
})
afterEach(() => {
  fetchMock.mockReset()
  vi.useRealTimers()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('login', () => {
  it('requires configured client ID and redirect URI', () => {
    for (const key of ['SPOTIFY_CLIENT_ID', 'SPOTIFY_REDIRECT_URI']) {
      vi.stubEnv(key, '')
      const res = response()
      login({} as Request, asResponse(res))
      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.redirect).not.toHaveBeenCalled()
      vi.stubEnv(key, 'test-config')
    }
  })
  it('requests only top-item scope and binds a crypto state to the cookie', () => {
    const res = response()
    login({} as Request, asResponse(res))
    const url = new URL(res.redirect.mock.calls[0][0])
    expect(url.origin + url.pathname).toBe('https://accounts.spotify.com/authorize')
    expect(url.searchParams.get('response_type')).toBe('code')
    expect(url.searchParams.get('client_id')).toBe('test-client-id')
    expect(url.searchParams.get('redirect_uri')).toBe('http://127.0.0.1:3001/api/auth/callback')
    expect(SCOPES).toEqual(['user-top-read'])
    expect(url.searchParams.get('scope')).toBe('user-top-read')
    const state = url.searchParams.get('state')
    expect(state).toMatch(/^[a-f0-9]{64}$/)
    expect(res.cookie).toHaveBeenCalledWith('spotify_auth_state', state,
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', maxAge: 600000 }))
    expect(issueState()).not.toBe(state)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('callback state', () => {
  it.each([
    ['missing query', undefined, 'issued'],
    ['missing cookie', 'issued', undefined],
    ['both missing', undefined, undefined],
    ['mismatch', 'wrong', 'issued'],
    ['unknown state', 'unknown', 'unknown'],
    ['empty strings', '', ''],
    ['query array', ['issued'], 'issued'],
    ['cookie object', 'issued', {}],
  ])('rejects %s before token exchange', async (_label, query, cookie) => {
    const issued = issueState()
    const res = response()
    await callback(request(query === 'issued' ? issued : query,
      cookie === 'issued' ? issued : cookie), asResponse(res))
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.clearCookie).toHaveBeenCalledWith('spotify_auth_state')
    expect(res.cookie).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('rejects an expired state even if the browser keeps its cookie', async () => {
    vi.useFakeTimers()
    const state = issueState()
    vi.advanceTimersByTime(600000)
    const res = response()
    await callback(request(state, state), asResponse(res))
    expect(res.status).toHaveBeenCalledWith(403)
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('invalidates the browser state after a rejected callback', async () => {
    const state = issueState()
    await callback(request('wrong', state), asResponse(response()))
    const retry = response()
    await callback(request(state, state), asResponse(retry))
    expect(retry.status).toHaveBeenCalledWith(403)
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('invalidates a previous state when the same browser starts login again', async () => {
    const state = issueState()
    login({ cookies: { spotify_auth_state: state } } as unknown as Request, asResponse(response()))
    const res = response()
    await callback(request(state, state), asResponse(res))
    expect(res.status).toHaveBeenCalledWith(403)
  })
  it('accepts matching issued state, sets token cookies, and rejects reuse', async () => {
    const state = issueState()
    const res = response()
    await callback(request(state, state), asResponse(res))
    expect(res.redirect).toHaveBeenCalledWith('http://127.0.0.1:5173?auth=success')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('https://accounts.spotify.com/api/token')
    expect(options.body.get('grant_type')).toBe('authorization_code')
    expect(options.body.get('code')).toBe('test-code')
    expect(cookieOptions(res, 'spotify_access_token').maxAge).toBe(3600000)
    expect(cookieOptions(res, 'spotify_refresh_token').maxAge).toBe(30 * 24 * 60 * 60 * 1000)
    expect(cookieOptions(res, 'spotify_refresh_token').maxAge)
      .toBeGreaterThan(cookieOptions(res, 'spotify_access_token').maxAge)
    const retry = response()
    await callback(request(state, state), asResponse(retry))
    expect(retry.status).toHaveBeenCalledWith(403)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
  it('consumes state before an unfinished token exchange can be replayed', async () => {
    const state = issueState()
    let finish!: (value: unknown) => void
    fetchMock.mockReturnValue(new Promise(resolve => { finish = resolve }))
    const first = callback(request(state, state), asResponse(response()))
    const retry = response()
    await callback(request(state, state), asResponse(retry))
    expect(retry.status).toHaveBeenCalledWith(403)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    finish({ ok: true, json: async () => tokenData })
    await first
  })
  it('handles authorization denial only after validating and consuming state', async () => {
    const state = issueState()
    const req = request(state, state)
    req.query.error = 'access_denied'
    const res = response()
    await callback(req, asResponse(res))
    expect(res.redirect).toHaveBeenCalledWith('http://127.0.0.1:5173?error=access_denied')
    expect(fetchMock).not.toHaveBeenCalled()
    const retry = response()
    await callback(request(state, state), asResponse(retry))
    expect(retry.status).toHaveBeenCalledWith(403)
  })
  it('returns 400 for missing code after valid state', async () => {
    const state = issueState(), res = response()
    await callback(request(state, state, ''), asResponse(res))
    expect(res.status).toHaveBeenCalledWith(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('does not create or inherit a refresh cookie when authorization returns none', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ access_token: 'test-access', expires_in: 3600 }) })
    const state = issueState(), res = response()
    await callback(request(state, state), asResponse(res))
    expect(res.clearCookie).toHaveBeenCalledWith('spotify_refresh_token')
    expect(res.cookie.mock.calls.map(([name]) => name)).toEqual(['spotify_access_token'])
  })
})

describe('refresh lifecycle', () => {
  it.each([undefined, '', {}])('returns 400 for a missing or malformed refresh cookie (%s)', async token => {
    const res = response()
    const req = { cookies: { spotify_refresh_token: token } } as unknown as Request
    await refreshToken(req, asResponse(res))
    expect(res.status).toHaveBeenCalledWith(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('rotates only the returned refresh token with a longer cookie lifetime', async () => {
    const res = response()
    await refreshToken(refreshRequest(), asResponse(res))
    expect(fetchMock.mock.calls[0][1].body.get('refresh_token')).toBe('test-existing-refresh')
    expect(res.cookie).toHaveBeenCalledWith('spotify_refresh_token', 'test-refresh',
      expect.objectContaining({ maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'lax' }))
    expect(cookieOptions(res, 'spotify_refresh_token').maxAge)
      .toBeGreaterThan(cookieOptions(res, 'spotify_access_token').maxAge)
    expect(cookieOptions(res, 'spotify_access_token').maxAge).toBe(3600000)
    expect(res.json).toHaveBeenCalledWith({ success: true, expires_in: 3600 })
  })
  it('retains the existing refresh cookie when Spotify returns no replacement', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ access_token: 'test-new-access', expires_in: 1800 }) })
    const res = response()
    await refreshToken(refreshRequest(), asResponse(res))
    expect(res.cookie.mock.calls.map(([name]) => name)).toEqual(['spotify_access_token'])
    expect(res.clearCookie).not.toHaveBeenCalled()
    expect(cookieOptions(res, 'spotify_access_token').maxAge).toBe(1800000)
  })
  it('returns 401 and clears tokens when Spotify rejects the refresh grant', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 400,
      json: async () => ({ error: 'invalid_grant', error_description: 'sensitive-test-value' }) })
    const res = response()
    await refreshToken(refreshRequest(), asResponse(res))
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.clearCookie).toHaveBeenCalledWith('spotify_access_token')
    expect(res.clearCookie).toHaveBeenCalledWith('spotify_refresh_token')
    expect(res.cookie).not.toHaveBeenCalled()
    expect(JSON.stringify([vi.mocked(console.error).mock.calls, res.json.mock.calls]))
      .not.toContain('sensitive-test-value')
  })
})

describe('safe failures and cookie security', () => {
  it.each(['callback', 'refresh'])('returns 500 for missing credentials in %s', async action => {
    const state = issueState(), res = response()
    vi.stubEnv('SPOTIFY_CLIENT_SECRET', '')
    if (action === 'callback') await callback(request(state, state), asResponse(res))
    else await refreshToken(refreshRequest(), asResponse(res))
    expect(res.status).toHaveBeenCalledWith(500)
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it.each(['callback', 'refresh'])('does not expose upstream error bodies in %s', async action => {
    const text = vi.fn(async () => 'sensitive-test-value')
    fetchMock.mockResolvedValue({ ok: false, status: 503, text })
    const state = issueState(), res = response()
    if (action === 'callback') await callback(request(state, state), asResponse(res))
    else await refreshToken(refreshRequest(), asResponse(res))
    expect(res.status).toHaveBeenCalledWith(500)
    expect(text).not.toHaveBeenCalled()
    expect(JSON.stringify([vi.mocked(console.error).mock.calls, res.json.mock.calls]))
      .not.toContain('sensitive-test-value')
  })
  it.each(['callback', 'refresh'])('does not expose exception contents in %s', async action => {
    fetchMock.mockRejectedValue(new Error('sensitive-test-value'))
    const state = issueState(), res = response()
    if (action === 'callback') await callback(request(state, state), asResponse(res))
    else await refreshToken(refreshRequest(), asResponse(res))
    expect(res.status).toHaveBeenCalledWith(500)
    expect(JSON.stringify([vi.mocked(console.error).mock.calls, res.json.mock.calls]))
      .not.toContain('sensitive-test-value')
  })
  it.each(['callback', 'refresh'])('rejects malformed token responses in %s', async action => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ access_token: 'test-access' }) })
    const state = issueState(), res = response()
    if (action === 'callback') await callback(request(state, state), asResponse(res))
    else await refreshToken(refreshRequest(), asResponse(res))
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.cookie).not.toHaveBeenCalled()
  })
  it('sets secure token cookies in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const state = issueState(), res = response()
    await callback(request(state, state), asResponse(res))
    for (const name of ['spotify_access_token', 'spotify_refresh_token']) {
      expect(cookieOptions(res, name)).toMatchObject({ httpOnly: true, secure: true, sameSite: 'lax' })
    }
  })
})


describe('authentication status and debug configuration', () => {
  it.each([undefined, {}, { spotify_access_token: '' }, { spotify_access_token: 'test-access' }])(
    'reports cookie presence without contacting Spotify (%s)', cookies => {
      const res = response()
      checkStatus({ cookies } as Request, asResponse(res))
      expect(res.json).toHaveBeenCalledWith({ authenticated: Boolean(cookies?.spotify_access_token) })
      expect(fetchMock).not.toHaveBeenCalled()
    })
  it('returns only configuration status and public URLs', () => {
    const res = response()
    getConfig({} as Request, asResponse(res))
    expect(res.json).toHaveBeenCalledWith({
      redirect_uri: 'http://127.0.0.1:3001/api/auth/callback',
      frontend_url: 'http://127.0.0.1:5173',
      client_id_configured: true, client_secret_configured: true,
    })
    expect(JSON.stringify(res.json.mock.calls)).not.toContain('test-client-secret')
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('reports missing credential configuration as booleans', () => {
    vi.stubEnv('SPOTIFY_CLIENT_ID', '')
    vi.stubEnv('SPOTIFY_CLIENT_SECRET', '')
    const res = response()
    getConfig({} as Request, asResponse(res))
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      client_id_configured: false, client_secret_configured: false,
    }))
  })
})
