import { google } from "googleapis";
import { getAuthenticatedClient } from "./auth.service.js";

export const createCalendarEvent = async (email, action) => {
  const auth = getAuthenticatedClient(email);
  if (!auth) throw new Error("User not authenticated with Google");

  const calendar = google.calendar({ version: "v3", auth });

  const { effectiveDate, payload } = action;

  const startTime = payload.startTime || payload.time || "09:00";
  const duration = parseDurationHours(payload.duration) || 1;
  const endHour = parseInt(startTime.split(":")[0]) + duration;
  const endTime = payload.endTime || `${String(endHour).padStart(2, "0")}:${startTime.split(":")[1] || "00"}`;

  let description = "";
  if (payload.description) description = payload.description;
  else if (action.type === "workout") description = `🏋️ Workout logged via LifePilot`;
  else if (action.type === "expense") description = `💰 Expense: ₹${payload.amount || ""} — logged via LifePilot`;
  else if (action.type === "study") description = `📚 Study session — logged via LifePilot`;
  else description = "Logged via LifePilot";

  if (payload.duration) description += `\nDuration: ${payload.duration}`;
  if (payload.amount) description += `\nAmount: ₹${payload.amount}`;

  const event = {
    summary: buildSummary(action),
    description,
    start: {
      dateTime: `${effectiveDate}T${startTime}:00`,
      timeZone: "Asia/Kolkata",
    },
    end: {
      dateTime: `${effectiveDate}T${endTime}:00`,
      timeZone: "Asia/Kolkata",
    },
    colorId: getColorId(action.type),
  };

  const response = await calendar.events.insert({
    calendarId: "primary",
    resource: event,
  });

  return {
    success: true,
    service: "Google Calendar",
    eventId: response.data.id,
    link: response.data.htmlLink,
    summary: response.data.summary,
  };
};

export const deleteCalendarEvent = async (email, eventId) => {
  const auth = getAuthenticatedClient(email);
  if (!auth) throw new Error("User not authenticated with Google");

  const calendar = google.calendar({ version: "v3", auth });

  await calendar.events.delete({
    calendarId: "primary",
    eventId,
  });

  return { success: true };
};

export const updateCalendarEvent = async (email, eventId, updates) => {
  const auth = getAuthenticatedClient(email);
  if (!auth) throw new Error("User not authenticated with Google");

  const calendar = google.calendar({ version: "v3", auth });

  const resource = {};
  if (updates.title) resource.summary = updates.title;
  if (updates.description !== undefined) resource.description = updates.description;
  if (updates.startTime && updates.date) {
    resource.start = { dateTime: `${updates.date}T${updates.startTime}:00`, timeZone: "Asia/Kolkata" };
  }
  if (updates.endTime && updates.date) {
    resource.end = { dateTime: `${updates.date}T${updates.endTime}:00`, timeZone: "Asia/Kolkata" };
  }

  const response = await calendar.events.patch({
    calendarId: "primary",
    eventId,
    resource,
  });

  return {
    success: true,
    service: "Google Calendar",
    eventId: response.data.id,
    link: response.data.htmlLink,
    summary: response.data.summary,
  };
};

function buildSummary(action) {
  const title = action.payload?.title || action.payload?.description || "LifePilot Event";
  const prefixes = {
    workout: "🏋️ ",
    expense: "💰 ",
    study: "📚 ",
    calendar_event: "",
    task: "✅ ",
    note: "📝 ",
  };
  return (prefixes[action.type] || "") + title;
}

function getColorId(type) {
  const colors = {
    calendar_event: "7",
    workout: "11",
    expense: "6",
    study: "3",
    task: "2",
    note: "8",
  };
  return colors[type] || "7";
}

function parseDurationHours(duration) {
  if (!duration) return null;
  const match = duration.match(/(\d+)\s*(h|hour|hours)/i);
  if (match) return parseInt(match[1]);
  const minMatch = duration.match(/(\d+)\s*(m|min|minutes)/i);
  if (minMatch) return Math.ceil(parseInt(minMatch[1]) / 60);
  return null;
}
