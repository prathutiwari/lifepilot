import { google } from "googleapis";
import { getAuthenticatedClient } from "./auth.service.js";

export const createTask = async (email, action) => {
  const auth = getAuthenticatedClient(email);
  if (!auth) throw new Error("User not authenticated with Google");

  const tasks = google.tasks({ version: "v1", auth });

  const { effectiveDate, payload } = action;

  const task = {
    title: payload.description || payload.title || "LifePilot Task",
    notes: payload.notes || `Created by LifePilot on ${new Date().toISOString().split("T")[0]}`,
  };

  if (effectiveDate) {
    task.due = `${effectiveDate}T00:00:00.000Z`;
  }

  // Get the default task list
  const taskLists = await tasks.tasklists.list();
  const defaultList = taskLists.data.items?.[0];

  if (!defaultList) {
    throw new Error("No task list found in Google Tasks");
  }

  const response = await tasks.tasks.insert({
    tasklist: defaultList.id,
    resource: task,
  });

  return {
    success: true,
    service: "Google Tasks",
    taskId: response.data.id,
    title: response.data.title,
    due: response.data.due,
  };
};
