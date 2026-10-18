import cors from "cors";
import { env } from "../config/env";

export const corsMiddleware = cors({
  origin: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  // Let browsers reuse a preflight for 2 hours instead of sending OPTIONS before every API call.
  maxAge: 7200,
});
