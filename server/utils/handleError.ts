import type { Response } from "express";
//----------------------- Helper function - Error handling----------------------------
export const handleError = (error: unknown, res: Response, errorMessage: string) => {
  console.error(errorMessage, error);
  const details = error instanceof Error ? error.message : "Unknown error";
  res.status(500).json({ error: errorMessage, details });
};