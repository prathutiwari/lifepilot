import { createCalendarEvent, deleteCalendarEvent, updateCalendarEvent } from "../services/google/calendar.service.js";
import { getFirstUser } from "../services/google/auth.service.js";

// POST /api/v1/events — manually create a meeting
export const createEvent = async (req, res) => {
  try {
    const user = getFirstUser();
    if (!user) return res.status(401).json({ success: false, error: "Not authenticated" });

    const { title, date, startTime, endTime, description } = req.body;

    if (!title || !date || !startTime) {
      return res.status(400).json({ success: false, error: "title, date, and startTime are required" });
    }

    const action = {
      type: "calendar_event",
      effectiveDate: date,
      payload: { title, startTime, endTime: endTime || null, description: description || null },
    };

    const result = await createCalendarEvent(user.email, action);

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("❌ Create event error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE /api/v1/events/:eventId
export const deleteEvent = async (req, res) => {
  try {
    const user = getFirstUser();
    if (!user) return res.status(401).json({ success: false, error: "Not authenticated" });

    const { eventId } = req.params;
    await deleteCalendarEvent(user.email, eventId);

    return res.json({ success: true });
  } catch (error) {
    console.error("❌ Delete event error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH /api/v1/events/:eventId
export const updateEvent = async (req, res) => {
  try {
    const user = getFirstUser();
    if (!user) return res.status(401).json({ success: false, error: "Not authenticated" });

    const { eventId } = req.params;
    const updates = req.body;

    const result = await updateCalendarEvent(user.email, eventId, updates);

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("❌ Update event error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};
