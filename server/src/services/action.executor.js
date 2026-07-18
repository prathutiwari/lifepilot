import { createCalendarEvent } from "./google/calendar.service.js";
import { createTask } from "./google/tasks.service.js";

// ALL action types now go to Google Calendar so user can see them
const executors = {
  calendar_event: createCalendarEvent,
  task: createTask,
  workout: createCalendarEvent,
  expense: createCalendarEvent,
  study: createCalendarEvent,
  note: createCalendarEvent,
};

export const executeActions = async (email, actions) => {
  const results = [];

  for (const action of actions) {
    const executor = executors[action.type];

    if (!executor) {
      results.push({
        action: action.type,
        success: false,
        error: `Unknown action type: ${action.type}`,
      });
      continue;
    }

    try {
      const result = await executor(email, action);
      results.push({ action: action.type, ...result });
    } catch (error) {
      results.push({
        action: action.type,
        success: false,
        error: error.message,
      });
    }
  }

  return results;
};
