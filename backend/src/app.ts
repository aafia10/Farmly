import express, { Application, Request, Response, NextFunction } from "express";
import { corsMiddleware } from "./middleware/cors";
import { errorHandler } from "./middleware/errorHandler";
import apiRouter from "./routes";

export const app: Application = express();

// Global Middleware
app.use(corsMiddleware);
app.use(express.json({ limit: "10mb" }));
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
