import { Router } from "express";
import { explain } from "../controllers/ai.controller";

const router = Router();

router.post("/", explain);

export default router;