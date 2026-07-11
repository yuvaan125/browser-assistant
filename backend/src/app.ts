import testRoutes from "./routes/test.routes";
import express from "express";
import cors from "cors";


const app = express();

import aiRoutes from "./routes/ai.routes";

import authRoutes from "./routes/auth.routes";

app.use("/test", testRoutes);


app.use(cors());

app.use(express.json());

app.use("/auth", authRoutes);

app.use("/ai", aiRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "Orbit Backend",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

export default app;