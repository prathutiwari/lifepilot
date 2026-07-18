import db from "../config/database.js";

// Get all activities for a user, optionally filtered by type
export const getActivities = async (userId, type = null) => {
  let sql = "SELECT * FROM activities WHERE user_id = ?";
  const args = [userId];

  if (type) {
    sql += " AND type = ?";
    args.push(type);
  }

  sql += " ORDER BY created_at DESC";

  const result = await db.execute({ sql, args });
  return result.rows.map(rowToActivity);
};

// Create a new activity
export const createActivity = async (userId, { type, effectiveDate, payload, completed = false }) => {
  const result = await db.execute({
    sql: "INSERT INTO activities (user_id, type, effective_date, payload, completed) VALUES (?, ?, ?, ?, ?)",
    args: [userId, type, effectiveDate, JSON.stringify(payload), completed ? 1 : 0],
  });
  return { id: Number(result.lastInsertRowid), type, effectiveDate, payload, completed };
};

// Update an activity
export const updateActivity = async (userId, activityId, updates) => {
  const fields = [];
  const args = [];

  if (updates.payload !== undefined) {
    fields.push("payload = ?");
    args.push(JSON.stringify(updates.payload));
  }
  if (updates.effectiveDate !== undefined) {
    fields.push("effective_date = ?");
    args.push(updates.effectiveDate);
  }
  if (updates.completed !== undefined) {
    fields.push("completed = ?");
    args.push(updates.completed ? 1 : 0);
  }

  if (fields.length === 0) return null;

  fields.push("updated_at = datetime('now')");
  args.push(activityId, userId);

  await db.execute({
    sql: `UPDATE activities SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`,
    args,
  });

  return { id: activityId, ...updates };
};

// Delete an activity
export const deleteActivity = async (userId, activityId) => {
  await db.execute({
    sql: "DELETE FROM activities WHERE id = ? AND user_id = ?",
    args: [activityId, userId],
  });
  return { id: activityId };
};

// Helper to transform DB row to activity object
function rowToActivity(row) {
  return {
    id: row.id,
    type: row.type,
    effectiveDate: row.effective_date,
    payload: JSON.parse(row.payload),
    completed: row.completed === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
