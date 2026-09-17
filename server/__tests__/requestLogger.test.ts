import { afterEach, expect, it, vi } from 'vitest'
import type { Request, Response } from 'express'
import { requestLogger } from '../middlewares/requestLogger'

afterEach(() => vi.restoreAllMocks())

it('logs the callback path without codes, state, tokens, or cookies', () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {})
  const next = vi.fn()
  requestLogger({
    originalUrl: '/api/auth/callback?code=test-code&state=test-state&access_token=test-access',
    cookies: { spotify_refresh_token: 'test-refresh' },
  } as unknown as Request, {} as Response, next)
  expect(log).toHaveBeenCalledExactlyOnceWith('/api/auth/callback')
  expect(next).toHaveBeenCalledExactlyOnceWith()
})
