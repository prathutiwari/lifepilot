import express from "express";
import { processUserMessage, getUserInsights } from "../controllers/message.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", processUserMessage);
router.get("/insights", authenticate, getUserInsights);

export default router;