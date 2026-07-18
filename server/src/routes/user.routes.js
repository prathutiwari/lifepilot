import express from "express";
import { signupUser, loginUser, getMe, updateMe } from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// POST /api/v1/user/signup
router.post("/signup", signupUser);

// POST /api/v1/user/login
router.post("/login", loginUser);

// GET /api/v1/user/me — get current user profile (requires token)
router.get("/me", authenticate, getMe);

// PUT /api/v1/user/me — update current user profile (requires token)
router.put("/me", authenticate, updateMe);

export default router;
