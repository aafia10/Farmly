import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      error: err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
    });
    return;
  }

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "An unexpected server error occurred",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
}
