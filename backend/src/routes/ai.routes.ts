import { Router } from "express";
import { explain, usage } from "../controllers/ai.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/", requireAuth, explain);
router.get("/usage", requireAuth, usage);

export default router;