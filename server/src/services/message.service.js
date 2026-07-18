import { parseMessage, generateInsights } from "./ai.service.js";
import { executeActions } from "./action.executor.js";
import { getFirstUser } from "./google/auth.service.js";
import { getActivities } from "./activity.service.js";

export const processMessage = async (message, context = null) => {
  // Step 1: Parse the message with AI (with optional context from follow-up)
  const aiResponse = await parseMessage(message, context);

  // Step 2: If AI needs clarification, return the question
  if (aiResponse.type === "clarification") {
    return {
      type: "clarification",
      message: aiResponse.message,
      partial: aiResponse.partial,
    };
  }

  // Step 3: We have complete actions
  const actions = aiResponse.actions || aiResponse;
  const actionsArray = Array.isArray(actions) ? actions : actions.actions || [actions];

  // Step 4: Check if user is authenticated
  const user = getFirstUser();

  if (!user) {
    return {
      type: "actions",
      actions: actionsArray,
      executed: false,
      message: "Actions parsed but not executed. Please connect your Google account.",
    };
  }

  // Step 5: Execute
  const results = await executeActions(user.email, actionsArray);

  return {
    type: "actions",
    actions: actionsArray,
    executed: true,
    results,
  };
};

export const getInsights = async (userId) => {
  // Get recent activities (last 7 days)
  const allActivities = await getActivities(userId);
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split("T")[0];

  const recentActivities = allActivities
    .filter((a) => a.type !== "preference" && a.effectiveDate >= weekAgoStr)
    .slice(0, 50); // Cap to avoid token overflow

  if (recentActivities.length === 0) {
    return {
      summary: "No recent activity to analyze. Start logging your tasks, expenses, workouts, or study sessions and I'll give you personalized insights!",
      tips: [],
    };
  }

  return generateInsights(recentActivities);
};
