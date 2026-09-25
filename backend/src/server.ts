import { app } from "./app";
import { env } from "./config/env";

const server = app.listen(env.PORT, () => {
  console.log(`====================================================`);
  console.log(`🌾 Farmly Digital Agriculture REST API Backend`);
  console.log(`📡 Server running on http://localhost:${env.PORT}`);
  console.log(`🩺 Health check: http://localhost:${env.PORT}/api/v1/health`);
  console.log(`🌐 Environment: ${env.NODE_ENV}`);
  console.log(`====================================================`);
});

// Graceful shutdown handling
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  server.close(() => {
    console.log("Farmly backend server closed.");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully...");
  server.close(() => {
    console.log("Farmly backend server closed.");
    process.exit(0);
  });
});
