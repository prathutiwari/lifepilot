import express from "express";
import cors from "cors";

import healthRoutes from "./routes/health.routes.js";
import messageRoutes from "./routes/message.routes.js";
import authRoutes from "./routes/auth.routes.js";
import eventRoutes from "./routes/event.routes.js";
import userRoutes from "./routes/user.routes.js";
import activityRoutes from "./routes/activity.routes.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/events", eventRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/activities", activityRoutes);

export default app;
