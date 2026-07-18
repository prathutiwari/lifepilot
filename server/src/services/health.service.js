export const getHealthStatus = () => {
  return {
    success: true,
    message: "LifePilot API is running.",
    timestamp: new Date().toISOString(),
  };
};