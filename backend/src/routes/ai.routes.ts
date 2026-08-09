import { Router } from "express";
import { explain } from "../controllers/ai.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/", requireAuth, explain);

export default router;