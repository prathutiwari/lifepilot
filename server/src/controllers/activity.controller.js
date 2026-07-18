import { getActivities, createActivity, updateActivity, deleteActivity } from "../services/activity.service.js";

export const listActivities = async (req, res) => {
  try {
    const { type } = req.query;
    const activities = await getActivities(req.user.id, type || null);
    return res.json({ success: true, data: activities });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const addActivity = async (req, res) => {
  try {
    const { type, effectiveDate, payload, completed } = req.body;

    if (!type || !effectiveDate || !payload) {
      return res.status(400).json({ success: false, error: "type, effectiveDate, and payload are required" });
    }

    const activity = await createActivity(req.user.id, { type, effectiveDate, payload, completed });
    return res.status(201).json({ success: true, data: activity });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const editActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const result = await updateActivity(req.user.id, Number(id), updates);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const removeActivity = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteActivity(req.user.id, Number(id));
    return res.json({ success: true, message: "Deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
