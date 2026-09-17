import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Request, Response } from 'express'
import * as controllers from '../controllers/spotifyController'
import { spotifyApiRequest } from '../utils/spotifyApiRequest'
import { HttpError } from '../utils/httpError'

vi.mock('../utils/spotifyApiRequest', () => ({ spotifyApiRequest: vi.fn() }))
const api = vi.mocked(spotifyApiRequest)
const artists = [
  { id: 'a', name: 'Artist A', genres: ['pop'], images: [{ url: 'https://example.test/a' }], popularity: 80, external_urls: { spotify: 'https://example.test/artist-a' } },
  { id: 'b', name: 'Artist B', genres: ['rock', 'pop'], images: [], popularity: 50, external_urls: { spotify: 'https://example.test/artist-b' } },
  { id: 'c', name: 'Artist C', genres: ['rock', 'jazz'], images: [], popularity: 40, external_urls: { spotify: 'https://example.test/artist-c' } },
]
const tracks = [
  { name: 'Track A', artists: [{ name: 'Artist A' }, { name: 'Artist B' }], album: { images: [{ url: 'https://example.test/cover' }] } },
  { name: 'Track B', artists: [{ name: 'Artist C' }], album: { images: [] } },
]
function request(overrides: object = {}) {
  return { accessToken: 'test-access', query: { time_range: 'medium_term', limit: '10' }, params: { id: 'me' }, ...overrides } as unknown as Request
}
function response() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn() }
}
const topControllers = [
  ['artists', controllers.getTopArtists, '/me/top/artists'],
  ['songs', controllers.getTopSongs, '/me/top/tracks'],
  ['genres', controllers.getTopGenres, '/me/top/artists'],
] as const
const allControllers = [...topControllers, ['profile', controllers.getUserProfile, '/me'] as const]
beforeEach(() => {
  api.mockReset().mockResolvedValue({ items: [] })
  vi.spyOn(console, 'error').mockImplementation(() => {})
  // Guard against accidentally bypassing the mocked Spotify boundary.
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Unexpected network call')))
})
afterEach(() => { api.mockReset(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('Spotify transformations', () => {
  it('ranks artists and preserves names, images, popularity and links', async () => {
    api.mockResolvedValue({ items: artists })
    const res = response()
    await controllers.getTopArtists(request(), res as unknown as Response)
    expect(res.json).toHaveBeenCalledWith({ time_range: 'medium_term', items: artists.map((artist, index) => ({ ...artist, rank: index + 1 })) })
  })
  it('uses an empty genre list when Spotify omits it', async () => {
    api.mockResolvedValue({ items: [{ ...artists[0], genres: undefined }] })
    const res = response()
    await controllers.getTopArtists(request(), res as unknown as Response)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ items: [expect.objectContaining({ genres: [] })] }))
  })
  it('combines track artists and uses null for missing artwork', async () => {
    api.mockResolvedValue({ items: tracks })
    const res = response()
    await controllers.getTopSongs(request(), res as unknown as Response)
    expect(res.json).toHaveBeenCalledWith({ time_range: 'medium_term', items: [
      { rank: 1, name: 'Track A', artist: ['Artist A', 'Artist B'], albumCover: 'https://example.test/cover' },
      { rank: 2, name: 'Track B', artist: ['Artist C'], albumCover: null },
    ] })
  })
  it('weights genres by artist rank, combines overlaps, sorts and limits results', async () => {
    api.mockResolvedValue({ items: artists })
    const res = response()
    await controllers.getTopGenres(request({ query: { time_range: 'short_term', limit: '2' } }), res as unknown as Response)
    expect(res.json).toHaveBeenCalledWith({ time_range: 'short_term', items: [
      { rank: 1, name: 'pop', count: 5 }, { rank: 2, name: 'rock', count: 3 },
    ] })
    expect(api).toHaveBeenCalledWith('test-access', '/me/top/artists?time_range=short_term&limit=2')
  })
  it('keeps genre defaults of 50 fetched artists and 20 returned genres', async () => {
    api.mockResolvedValue({ items: [{ ...artists[0], genres: Array.from({ length: 21 }, (_, i) => `genre-${i}`) }] })
    const res = response()
    await controllers.getTopGenres(request({ query: {} }), res as unknown as Response)
    expect(api).toHaveBeenCalledWith('test-access', '/me/top/artists?time_range=medium_term&limit=50')
    const data = res.json.mock.calls[0][0]
    expect(data.items).toHaveLength(20)
    expect(data.items[0]).toEqual({ rank: 1, name: 'genre-0', count: 1 })
    expect(data.items[19]).toEqual({ rank: 20, name: 'genre-19', count: 1 })
  })
  it.each(['me', 'some user/?'])('constructs an encoded profile endpoint for %s', async id => {
    const profile = { id, display_name: 'Test Person', images: [] }
    api.mockResolvedValue(profile)
    const res = response()
    await controllers.getUserProfile(request({ params: { id } }), res as unknown as Response)
    expect(api).toHaveBeenCalledWith('test-access', id === 'me' ? '/me' : '/users/some%20user%2F%3F')
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(profile)
  })
  it.each([undefined, '', ['me']])('rejects missing or malformed profile id (%s)', async id => {
    const res = response()
    await controllers.getUserProfile(request({ params: { id } }), res as unknown as Response)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(api).not.toHaveBeenCalled()
  })
})

for (const [name, controller, endpoint] of topControllers) {
  describe(`${name} query handling`, () => {
    it.each(['short_term', 'medium_term', 'long_term'])('forwards supported range %s with a validated limit', async range => {
      const res = response()
      await controller(request({ query: { time_range: range, limit: '50' } }), res as unknown as Response)
      expect(api).toHaveBeenCalledWith('test-access', `${endpoint}?time_range=${range}&limit=50`)
      expect(res.json).toHaveBeenCalledWith({ time_range: range, items: [] })
    })
    it('applies endpoint defaults when query parameters are omitted', async () => {
      const res = response()
      await controller(request({ query: {} }), res as unknown as Response)
      expect(api).toHaveBeenCalledWith('test-access', `${endpoint}?time_range=medium_term&limit=${name === 'genres' ? '50' : '20'}`)
    })
    it.each([
      { time_range: 'invalid' }, { time_range: ['short_term', 'long_term'] },
      { limit: '0' }, { limit: '51' }, { limit: '1.5' }, { limit: '10&offset=1' }, { limit: ['10', '20'] },
    ])('rejects invalid query %j before Spotify is called', async query => {
      const res = response()
      await controller(request({ query }), res as unknown as Response)
      expect(res.status).toHaveBeenCalledWith(400)
      expect(api).not.toHaveBeenCalled()
    })
    it.each([null, {}, { items: {} }])('rejects malformed upstream item containers (%j)', async data => {
      api.mockResolvedValue(data)
      const res = response()
      await controller(request(), res as unknown as Response)
      expect(res.status).toHaveBeenCalledWith(502)
      expect(res.json).toHaveBeenCalledWith({ error: `Failed to fetch top ${name}` })
    })
  })
}
for (const [name, controller] of allControllers) {
  describe(`${name} failures`, () => {
    it('rejects missing authentication without contacting Spotify', async () => {
      const res = response()
      await controller(request({ accessToken: undefined }), res as unknown as Response)
      expect(res.status).toHaveBeenCalledWith(401)
      expect(api).not.toHaveBeenCalled()
    })
    it.each([401, 429, 502])('maps upstream %i without exposing tokens or details', async status => {
      api.mockRejectedValue(new HttpError(status, 'private-upstream-test-access'))
      const res = response()
      await controller(request(), res as unknown as Response)
      expect(res.status).toHaveBeenCalledWith(status)
      expect(res.json).toHaveBeenCalledWith({ error: name === 'profile' ? 'Failed to fetch user profile' : `Failed to fetch top ${name}` })
      expect(JSON.stringify([res.json.mock.calls, vi.mocked(console.error).mock.calls])).not.toContain('private-upstream')
      expect(JSON.stringify([res.json.mock.calls, vi.mocked(console.error).mock.calls])).not.toContain('test-access')
    })
    it('sanitizes unexpected failures', async () => {
      api.mockRejectedValue(new Error('private-upstream-test-access'))
      const res = response()
      await controller(request(), res as unknown as Response)
      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json.mock.calls[0][0]).not.toHaveProperty('details')
      expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain('private-upstream')
    })
  })
}
