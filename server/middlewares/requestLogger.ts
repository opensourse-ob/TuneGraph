import type { Request, Response, NextFunction } from 'express'

export function requestLogger(req: Request, _res: Response, next: NextFunction) {
  // Query strings can contain OAuth codes, state, or other sensitive values.
  console.log(req.originalUrl.split('?')[0])
  next()
}
