import { getHealthStatus } from "../services/health.service.js";

export const healthCheck = (req, res) => {
  const data = getHealthStatus();

  res.status(200).json(data);
};