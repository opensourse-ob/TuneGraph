import type { Response } from 'express'
import { HttpError } from './httpError'

export const handleError = (error: unknown, res: Response, errorMessage: string) => {
  const status = error instanceof HttpError ? error.status : 500
  // Never log or return arbitrary upstream messages, bodies, or exception objects.
  console.error(errorMessage, { status })
  res.status(status).json({ error: errorMessage })
}
