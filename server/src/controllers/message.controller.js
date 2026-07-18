import { processMessage, getInsights } from "../services/message.service.js";

export const processUserMessage = async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Message is required",
      });
    }

    const result = await processMessage(message, context || null);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("❌ Error processing message:", error.message);
    console.error(error.stack);

    return res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};

export const getUserInsights = async (req, res) => {
  try {
    const result = await getInsights(req.user.id);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("❌ Error generating insights:", error.message);

    return res.status(500).json({
      success: false,
      error: error.message || "Failed to generate insights",
    });
  }
};
