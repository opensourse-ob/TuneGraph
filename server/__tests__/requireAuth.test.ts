import { describe, it, expect, vi } from 'vitest'
import type { Request, Response } from 'express'
import { requireAuth } from '../middlewares/requireAuth'

describe('requireAuth', () => {
  it.each([undefined, {}, { spotify_access_token: '' }, { spotify_access_token: [] }, { spotify_access_token: {} }, { spotify_access_token: 123 }, { spotify_access_token: true }])('rejects missing access cookies (%s)', cookies => {
    const req = { cookies } as Request
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() }
    const next = vi.fn()
    requireAuth(req, res as unknown as Response, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' })
    expect(next).not.toHaveBeenCalled()
    expect(req).not.toHaveProperty('accessToken')
  })
  it('attaches the access token and delegates exactly once', () => {
    const req = { cookies: { spotify_access_token: 'test-access' } } as Request
    const res = { status: vi.fn(), json: vi.fn() }
    const next = vi.fn()
    requireAuth(req, res as unknown as Response, next)
    expect(req).toHaveProperty('accessToken', 'test-access')
    expect(next).toHaveBeenCalledExactlyOnceWith()
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })
})
