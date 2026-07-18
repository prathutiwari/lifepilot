import { signup, login, getProfile, updateProfile } from "../services/auth.service.js";

export const signupUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: "Password must be at least 6 characters" });
    }

    const result = await signup(name, email, password);

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required" });
    }

    const result = await login(email, password);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(401).json({ success: false, error: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await getProfile(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const updateMe = async (req, res) => {
  try {
    const { name, picture } = req.body;

    if (!name && picture === undefined) {
      return res.status(400).json({ success: false, error: "Nothing to update" });
    }

    if (name !== undefined && name.trim().length === 0) {
      return res.status(400).json({ success: false, error: "Name cannot be empty" });
    }

    const user = await updateProfile(req.user.id, { name: name?.trim(), picture });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
