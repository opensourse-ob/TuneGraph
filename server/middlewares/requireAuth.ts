import type { Request, Response, NextFunction } from "express";

// Middleware to check if user is authenticated
//------------------------------get access token for future request-------------------
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const accessToken = req.cookies?.spotify_access_token;
  if (!accessToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  (req as any).accessToken = accessToken;
  next();
};