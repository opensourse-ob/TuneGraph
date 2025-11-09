import type { Request } from "express";
// Helper function - grabs query params
//grab params from request. everything after ? is query
//to avoid repetetiv code
export const getQueryParams = (req: Request) => ({
  timeRange: req.query.time_range as string,
  limit: req.query.limit as string,
});