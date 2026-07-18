import dotenv from "dotenv";
import app from "./app.js";
import { env } from "./config/env.js";
import { initDatabase } from "./config/database.js";

dotenv.config();

const start = async () => {
  await initDatabase();
  app.listen(env.PORT, () => {
    console.log(`🚀 Server running on ${env.PORT}`);
  });
};

start().catch((err) => {
  console.error("❌ Failed to start server:", err.message);
  process.exit(1);
});