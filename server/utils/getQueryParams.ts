import type { Request } from 'express'
import { HttpError } from './httpError'

export const getQueryParams = (req: Request) => {
  if (Object.keys(req.query).some(key => !['time_range', 'limit'].includes(key))) {
    throw new HttpError(400, 'Unsupported query parameter')
  }
  const timeRange = req.query.time_range ?? 'medium_term'
  const limit = req.query.limit
  if (typeof timeRange !== 'string' || !['short_term', 'medium_term', 'long_term'].includes(timeRange)) {
    throw new HttpError(400, 'Invalid time_range')
  }
  if (limit !== undefined && (typeof limit !== 'string' || !/^[1-9]\d*$/.test(limit)
    || Number(limit) > 50)) {
    throw new HttpError(400, 'Invalid limit')
  }
  return { timeRange, limit: limit as string | undefined }
}
