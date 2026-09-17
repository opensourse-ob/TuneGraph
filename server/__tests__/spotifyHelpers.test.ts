import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Request, Response as ExpressResponse } from 'express'
import { spotifyApiRequest } from '../utils/spotifyApiRequest'
import { getQueryParams } from '../utils/getQueryParams'
import { handleError } from '../utils/handleError'
import { HttpError } from '../utils/httpError'

const fetchMock = vi.fn()
beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock); vi.spyOn(console, 'error').mockImplementation(() => {}) })
afterEach(() => { fetchMock.mockReset(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe('Spotify HTTP boundary', () => {
  it('builds Bearer authorization and parses JSON without logging the token', async () => {
    const data = { items: [] }
    fetchMock.mockResolvedValue(new Response(JSON.stringify(data)))
    expect(await spotifyApiRequest('test-private-token', '/me/top/artists?time_range=long_term&limit=1')).toEqual(data)
    expect(fetchMock).toHaveBeenCalledWith('https://api.spotify.com/v1/me/top/artists?time_range=long_term&limit=1', {
      headers: { Authorization: 'Bearer test-private-token', 'Content-Type': 'application/json' },
    })
    expect(console.error).not.toHaveBeenCalled()
  })
  it.each([undefined, '', {}, ['token']])('rejects malformed tokens before fetch (%s)', async token => {
    await expect(spotifyApiRequest(token as string, '/me')).rejects.toMatchObject({ status: 401 })
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it.each([[401, 401], [429, 429], [400, 502], [403, 502], [500, 502], [503, 502]])(
    'maps Spotify HTTP %i to %i without reading sensitive bodies', async (upstreamStatus, status) => {
      const text = vi.fn(async () => 'test-private-token upstream detail')
      const json = vi.fn(async () => ({ token: 'test-private-token' }))
      fetchMock.mockResolvedValue({ ok: false, status: upstreamStatus, text, json })
      await expect(spotifyApiRequest('test-private-token', '/me')).rejects.toMatchObject({ status, message: 'Spotify request failed' })
      expect(text).not.toHaveBeenCalled(); expect(json).not.toHaveBeenCalled()
    })
  it('sanitizes network exceptions', async () => {
    fetchMock.mockRejectedValue(new Error('test-private-token connection detail'))
    await expect(spotifyApiRequest('test-private-token', '/me')).rejects.toMatchObject({ status: 502, message: 'Spotify request failed' })
  })
  it.each(['not-json', 'null', '[]', '42', '"private-token"'])('rejects invalid JSON responses (%s)', async body => {
    fetchMock.mockResolvedValue(new Response(body))
    await expect(spotifyApiRequest('test-private-token', '/me')).rejects.toMatchObject({ status: 502, message: 'Invalid Spotify response' })
  })
})

describe('query validation', () => {
  it('defaults only missing parameters, leaving endpoint-specific limits to controllers', () => {
    expect(getQueryParams({ query: {} } as Request)).toEqual({ timeRange: 'medium_term', limit: undefined })
  })
  it('rejects unsupported query keys rather than silently applying defaults', () => {
    expect(() => getQueryParams({ query: { 'limit[x]': '10' } } as unknown as Request)).toThrow(HttpError)
  })
  it.each(['short_term', 'medium_term', 'long_term'])('supports %s and limit 1', timeRange => {
    expect(getQueryParams({ query: { time_range: timeRange, limit: '1' } } as unknown as Request)).toEqual({ timeRange, limit: '1' })
  })
  it.each(['', '-1', '0', '01', '51', '1.1', '1e1', ' 10', '10&offset=1', ['10'], { value: '10' }])(
    'rejects invalid limits (%s)', limit => {
      expect(() => getQueryParams({ query: { limit } } as unknown as Request)).toThrow(HttpError)
    })
  it.each(['', 'recent', ['short_term'], { value: 'short_term' }])('rejects invalid ranges (%s)', time_range => {
    expect(() => getQueryParams({ query: { time_range } } as unknown as Request)).toThrow(HttpError)
  })
})

describe('sanitized error mapping', () => {
  it.each([400, 401, 429, 502])('uses declared status %i without exposing exception messages', status => {
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() }
    handleError(new HttpError(status, 'private-token'), res as unknown as ExpressResponse, 'Failed to fetch music')
    expect(res.status).toHaveBeenCalledWith(status)
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch music' })
    expect(console.error).toHaveBeenCalledWith('Failed to fetch music', { status })
  })
  it.each([new Error('private-token'), 'private-token', null, { status: 401, message: 'private-token' }])(
    'does not trust arbitrary exceptions or status properties (%s)', error => {
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() }
      handleError(error, res as unknown as ExpressResponse, 'Failed to fetch music')
      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch music' })
      expect(console.error).toHaveBeenCalledWith('Failed to fetch music', { status: 500 })
    })
})
