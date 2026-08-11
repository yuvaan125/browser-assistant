import express from "express";
import cors from "cors";

// Imported first so a missing variable fails with a clear message before any
// SDK is constructed with undefined config.
import { allowedOrigins } from "./config/env";

import aiRoutes from "./routes/ai.routes";
import healthRoutes from "./routes/health.routes";
import { rateLimit } from "./middleware/rateLimit.middleware";

const app = express();

// Render (and most hosts) terminate TLS at a proxy, so req.ip is the proxy's
// address unless we trust the forwarding header. The rate limiter keys on
// req.ip, so without this every request shares one bucket.
app.set("trust proxy", 1);

/**
 * CORS is a browser-enforced mechanism — it does nothing to a direct HTTP
 * client, so requireAuth remains the actual security boundary. Restricting
 * origins just prevents arbitrary sites from making credentialed calls.
 * Unset (local dev) stays permissive.
 */
app.use(
  cors(
    allowedOrigins?.length
      ? { origin: allowedOrigins }
      : {}
  )
);

app.use(express.json({ limit: "1mb" }));

app.use(rateLimit);

app.use("/health", healthRoutes);
app.use("/ai", aiRoutes);

export default app;
