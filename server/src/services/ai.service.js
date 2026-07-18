import OpenAI from "openai";
import { env } from "../config/env.js";
import { buildCommandPrompt } from "../prompts/command.prompt.js";
import { retry } from "../utils/retry.js";

const client = new OpenAI({
  apiKey: env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export const parseMessage = async (message, context = null) => {
  let prompt = buildCommandPrompt(message);

  // If there's context from a previous clarification, include it
  if (context) {
    prompt += `\n\nPrevious context (partial data already collected):\n${JSON.stringify(context)}\n\nThe user is responding to a follow-up question. Merge their answer with the partial data and return complete actions.`;
  }

  const response = await retry(() =>
    client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a JSON-only response engine. Never include markdown, explanations, or anything other than valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0,
    })
  );

  const text = response.choices[0].message.content;
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  return JSON.parse(cleaned);
};

export const generateInsights = async (activities) => {
  const today = new Date().toISOString().split("T")[0];

  // Summarize activities by type for the prompt
  const summary = {};
  activities.forEach((a) => {
    if (!summary[a.type]) summary[a.type] = [];
    summary[a.type].push({ date: a.effectiveDate, completed: a.completed, ...a.payload });
  });

  const prompt = `You are a personal life coach AI for LifePilot app. Analyze the user's recent week of activity data and provide a brief, motivating daily insight.

Today's date: ${today}

User's recent activities (last 7 days):
${JSON.stringify(summary, null, 2)}

Respond with ONLY valid JSON in this format:
{
  "summary": "A 1-2 sentence personalized insight about their week (motivating, specific to their data)",
  "tips": ["tip 1", "tip 2", "tip 3"]
}

Rules:
- summary should be encouraging and reference specific data (amounts spent, tasks completed, workouts done, etc.)
- tips should be 3 short actionable suggestions based on their patterns
- Keep it warm, concise, and personal
- If they have expenses, mention spending patterns
- If they have workouts, mention consistency or volume
- If they have tasks, mention completion rate
- If they have study sessions, mention their dedication
- Be specific with numbers when possible

Return ONLY valid JSON.`;

  const response = await retry(() =>
    client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a JSON-only response engine. Never include markdown, explanations, or anything other than valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    })
  );

  const text = response.choices[0].message.content;
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  return JSON.parse(cleaned);
};
