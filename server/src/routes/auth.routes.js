import express from "express";
import { googleLogin, googleCallback, getAuthStatus, logout } from "../controllers/auth.controller.js";

const router = express.Router();

// GET /api/v1/auth/google — redirects to Google consent screen
router.get("/google", googleLogin);

// GET /api/v1/auth/google/callback — handles OAuth callback
router.get("/google/callback", googleCallback);

// GET /api/v1/auth/status — check if user is authenticated
router.get("/status", getAuthStatus);

// POST /api/v1/auth/logout — clear session
router.post("/logout", logout);

export default router;
