import { getAuthUrl, handleCallback, getFirstUser, logoutAll } from "../services/google/auth.service.js";
import { env } from "../config/env.js";

export const googleLogin = (req, res) => {
  const url = getAuthUrl();
  res.redirect(url);
};

export const googleCallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.redirect(`${env.CLIENT_URL}?error=no_code`);
    }

    await handleCallback(code);
    res.redirect(`${env.CLIENT_URL}?auth=success`);
  } catch (error) {
    console.error("❌ OAuth callback error:", error.message);
    res.redirect(`${env.CLIENT_URL}?error=auth_failed`);
  }
};

export const getAuthStatus = (req, res) => {
  const user = getFirstUser();

  if (user) {
    return res.json({
      success: true,
      authenticated: true,
      user: user.user,
    });
  }

  return res.json({
    success: true,
    authenticated: false,
    user: null,
  });
};

export const logout = (req, res) => {
  logoutAll();
  return res.json({ success: true, message: "Logged out" });
};
