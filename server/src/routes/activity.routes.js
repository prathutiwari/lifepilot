import express from "express";
import { listActivities, addActivity, editActivity, removeActivity } from "../controllers/activity.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// All activity routes require authentication
router.use(authenticate);

// GET /api/v1/activities?type=expense
router.get("/", listActivities);

// POST /api/v1/activities
router.post("/", addActivity);

// PATCH /api/v1/activities/:id
router.patch("/:id", editActivity);

// DELETE /api/v1/activities/:id
router.delete("/:id", removeActivity);

export default router;
