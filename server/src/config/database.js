import { createClient } from "@libsql/client";
import { env } from "./env.js";

const db = createClient({
  url: env.TURSO_DATABASE_URL,
  authToken: env.TURSO_AUTH_TOKEN,
});

export const initDatabase = async () => {
  await db.batch([
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      picture TEXT DEFAULT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    // Activities table (stores all types: meetings, tasks, expenses, workouts, notes, study)
    `CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      effective_date TEXT NOT NULL,
      payload TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    // Index for fast lookups
    `CREATE INDEX IF NOT EXISTS idx_activities_user_type ON activities(user_id, type)`,
  ]);
  console.log("✅ Database tables initialized");
};

export default db;
