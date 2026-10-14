import express, { Application, Request, Response, NextFunction } from "express";
import { corsMiddleware } from "./middleware/cors";
import { errorHandler } from "./middleware/errorHandler";
import apiRouter from "./routes";
import { env } from "./config/env";

export const app: Application = express();

// Global Middleware
app.use(corsMiddleware);
// Certificate uploads arrive base64-encoded (about 4/3 of the file size).
const jsonLimitMb = Math.max(10, Math.ceil(env.CERT_MAX_FILE_MB * 1.4) + 1);
app.use(express.json({ limit: `${jsonLimitMb}mb` }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Simple request logger
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Root API Landing
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Farmly REST API Engine",
    version: "1.0.0",
    docs: "/api/v1/health",
  });
});

// Mount V1 API Routes
app.use("/api/v1", apiRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} not found`,
  });
});

// Centralized Error Handler
app.use(errorHandler);
