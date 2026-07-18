import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../config/database.js";
import { env } from "../config/env.js";

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

export const signup = async (name, email, password) => {
  // Check if user already exists
  const existing = await db.execute({
    sql: "SELECT id FROM users WHERE email = ?",
    args: [email],
  });

  if (existing.rows.length > 0) {
    throw new Error("An account with this email already exists");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const result = await db.execute({
    sql: "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
    args: [name, email, hashedPassword],
  });

  const user = { id: Number(result.lastInsertRowid), name, email };
  const token = generateToken(user);

  return { user, token };
};

export const login = async (email, password) => {
  // Find user
  const result = await db.execute({
    sql: "SELECT id, name, email, password, picture FROM users WHERE email = ?",
    args: [email],
  });

  if (result.rows.length === 0) {
    throw new Error("Invalid email or password");
  }

  const row = result.rows[0];

  // Check password
  const isValid = await bcrypt.compare(password, row.password);
  if (!isValid) {
    throw new Error("Invalid email or password");
  }

  const user = { id: row.id, name: row.name, email: row.email, picture: row.picture };
  const token = generateToken(user);

  return { user, token };
};

export const getProfile = async (userId) => {
  const result = await db.execute({
    sql: "SELECT id, name, email, picture, created_at FROM users WHERE id = ?",
    args: [userId],
  });

  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return { id: row.id, name: row.name, email: row.email, picture: row.picture, createdAt: row.created_at };
};

export const updateProfile = async (userId, { name, picture }) => {
  const fields = [];
  const args = [];

  if (name !== undefined) {
    fields.push("name = ?");
    args.push(name);
  }
  if (picture !== undefined) {
    fields.push("picture = ?");
    args.push(picture);
  }

  if (fields.length === 0) {
    return getProfile(userId);
  }

  args.push(userId);
  await db.execute({
    sql: `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
    args,
  });

  return getProfile(userId);
};
