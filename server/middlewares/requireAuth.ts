import type { Request, Response, NextFunction } from 'express'
import { HttpError } from '../utils/httpError'

export type AuthenticatedRequest = Request & { accessToken?: string }

export function getAccessToken(req: Request): string {
  const token = (req as AuthenticatedRequest).accessToken
  if (typeof token !== 'string' || !token) throw new HttpError(401, 'Unauthorized')
  return token
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const accessToken = req.cookies?.spotify_access_token
  if (typeof accessToken !== 'string' || !accessToken) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  ;(req as AuthenticatedRequest).accessToken = accessToken
  next()
}
