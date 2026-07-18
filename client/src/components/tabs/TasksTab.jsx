import { useState } from "react";
import VoiceInput from "../VoiceInput";
import ConfirmModal from "../ConfirmModal";

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function TasksTab({ tasks, setTasks, onSend, isLoading, clarification, onAdd, onUpdate, onRemove }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: "", dueDate: "", priority: "medium", notes: "" });
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);

  const resetForm = () => {
    setFormData({ title: "", dueDate: "", priority: "medium", notes: "" });
    setShowForm(false);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    await onAdd("tasks", {
      type: "task",
      effectiveDate: formData.dueDate || getToday(),
      payload: {
        title: formData.title,
        priority: formData.priority,
        notes: formData.notes,
      },
      completed: false,
    });
    resetForm();
  };

  const toggleComplete = (index) => {
    const task = tasks[index];
    const newVal = !task.completed;
    setTasks((prev) => prev.map((t, i) => (i === index ? { ...t, completed: newVal } : t)));
    if (task?.id) onUpdate("tasks", task.id, { completed: newVal });
  };

  const deleteTask = (index) => setDeleteIndex(index);
  const confirmDelete = async () => {
    const item = tasks[deleteIndex];
    if (item?.id) await onRemove("tasks", item.id);
    else setTasks((prev) => prev.filter((_, i) => i !== deleteIndex));
    setDeleteIndex(null);
  };

  const updateTaskField = (index, field, value) => {
    const task = tasks[index];
    const newPayload = { ...task.payload, [field]: value };
    setTasks((prev) => prev.map((t, i) => (i === index ? { ...t, payload: newPayload } : t)));
    if (task?.id) onUpdate("tasks", task.id, { payload: newPayload });
  };

  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  const priorityColors = {
    high: "text-red-400 bg-red-500/10 border-red-500/20",
    medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    low: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div style={{ padding: '20px 20px', borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-text">Tasks</h2>
            <p className="text-sm text-text-muted" style={{ marginTop: '4px' }}>
              {pendingTasks.length} pending · {completedTasks.length} completed
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors"
            style={{ padding: '8px 16px' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Task
          </button>
        </div>
      </div>

      {/* Add Task Form */}
      {showForm && (
        <div style={{ padding: '20px 20px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-light)' }}>
          <h3 className="text-sm font-bold text-text" style={{ marginBottom: '14px' }}>New Task</h3>
          <form onSubmit={handleAddTask}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
              {/* Title */}
              <div>
                <label className="text-xs text-text-muted font-medium" style={{ display: 'block', marginBottom: '4px' }}>
                  Task title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="What needs to be done?"
                  className="w-full bg-surface-lighter border border-border rounded-lg text-sm text-text placeholder-text-muted/50 focus:outline-none focus:border-primary/50"
                  style={{ height: '38px', padding: '0 12px' }}
                  required
                  autoFocus
                />
              </div>

              {/* Due Date + Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '10px' }}>
                <div>
                  <label className="text-xs text-text-muted font-medium" style={{ display: 'block', marginBottom: '4px' }}>Due date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full bg-surface-lighter border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary/50"
                    style={{ height: '38px', padding: '0 10px' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-text-muted font-medium" style={{ display: 'block', marginBottom: '4px' }}>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full bg-surface-lighter border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary/50"
                    style={{ height: '38px', padding: '0 10px' }}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs text-text-muted font-medium" style={{ display: 'block', marginBottom: '4px' }}>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional details..."
                  className="w-full bg-surface-lighter border border-border rounded-lg text-sm text-text placeholder-text-muted/50 focus:outline-none focus:border-primary/50 resize-none"
                  style={{ padding: '10px 12px', minHeight: '60px' }}
                />
              </div>
            </div>

            <div className="flex justify-end" style={{ gap: '8px' }}>
              <button type="button" onClick={resetForm} className="text-sm text-text-muted hover:text-text rounded-lg border border-border" style={{ padding: '7px 14px' }}>
                Cancel
              </button>
              <button type="submit" className="text-sm text-white bg-primary hover:bg-primary-dark rounded-lg font-medium" style={{ padding: '7px 14px' }}>
                Add Task
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Task List */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '20px 20px' }}>
        {tasks.length === 0 && !showForm ? (
          <div className="flex flex-col items-center justify-center" style={{ paddingTop: '60px' }}>
            <div className="rounded-full bg-surface-lighter border border-border flex items-center justify-center" style={{ width: '56px', height: '56px', marginBottom: '16px' }}>
              <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-text-muted font-medium">No tasks yet</p>
            <p className="text-xs text-text-muted/50" style={{ marginTop: '6px' }}>Click "Add Task" or say "Remind me to buy groceries"</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* Pending Tasks */}
            {pendingTasks.length > 0 && (
              <>
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider" style={{ marginBottom: '8px' }}>
                  Pending ({pendingTasks.length})
                </p>
                {pendingTasks.map((task) => {
                  const index = tasks.indexOf(task);
                  const pColor = priorityColors[task.payload?.priority] || priorityColors.medium;
                  const isEditing = editingIndex === index;
                  return (
                    <div
                      key={index}
                      className={`group flex items-center rounded-xl border ${pColor}`}
                      style={{ padding: '12px 16px', gap: '12px' }}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleComplete(index)}
                        className="w-5 h-5 rounded-full border-2 border-current flex-shrink-0 flex items-center justify-center hover:bg-white/10 transition-colors"
                        style={{ opacity: 0.6 }}
                      />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <>
                            <input
                              type="text"
                              value={task.payload?.title || ""}
                              onChange={(e) => updateTaskField(index, "title", e.target.value)}
                              className="w-full bg-transparent text-sm font-medium text-text border-b border-current/30 focus:outline-none focus:border-primary"
                              style={{ padding: '2px 0' }}
                              autoFocus
                            />
                            <div className="flex items-center" style={{ gap: '8px', marginTop: '4px' }}>
                              <select
                                value={task.payload?.priority || "medium"}
                                onChange={(e) => updateTaskField(index, "priority", e.target.value)}
                                className="bg-transparent text-xs text-text-muted border-b border-current/20 focus:outline-none focus:border-primary"
                                style={{ padding: '1px 0' }}
                              >
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                              </select>
                            </div>
                            <input
                              type="text"
                              value={task.payload?.notes || ""}
                              onChange={(e) => updateTaskField(index, "notes", e.target.value)}
                              placeholder="Add notes..."
                              className="w-full bg-transparent text-xs text-text-muted border-b border-current/20 focus:outline-none focus:border-primary"
                              style={{ padding: '2px 0', marginTop: '4px' }}
                            />
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-medium text-text">{task.payload?.title || "Task"}</p>
                            <div className="flex items-center" style={{ gap: '8px', marginTop: '3px' }}>
                              {task.effectiveDate && <span className="text-xs text-text-muted">{task.effectiveDate}</span>}
                              {task.payload?.priority && (
                                <span className="text-xs capitalize text-text-muted">• {task.payload.priority}</span>
                              )}
                            </div>
                            {task.payload?.notes && (
                              <p className="text-xs text-text-muted/70" style={{ marginTop: '4px' }}>{task.payload.notes}</p>
                            )}
                          </>
                        )}
                      </div>

                      {/* Edit + Delete */}
                      <div className="flex items-center flex-shrink-0" style={{ gap: '2px' }}>
                        <button
                          onClick={() => setEditingIndex(isEditing ? null : index)}
                          className={`text-text-muted hover:text-primary-light transition-all ${isEditing ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                          style={{ padding: '4px' }}
                        >
                          {isEditing ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          )}
                        </button>
                        <button
                          onClick={() => deleteTask(index)}
                          className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400 transition-all flex-shrink-0"
                          style={{ padding: '4px' }}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <>
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider" style={{ marginTop: '20px', marginBottom: '8px' }}>
                  Completed ({completedTasks.length})
                </p>
                {completedTasks.map((task) => {
                  const index = tasks.indexOf(task);
                  return (
                    <div
                      key={index}
                      className="group flex items-center rounded-xl border border-border bg-surface-lighter/30"
                      style={{ padding: '12px 16px', gap: '12px', opacity: 0.6 }}
                    >
                      <button
                        onClick={() => toggleComplete(index)}
                        className="w-5 h-5 rounded-full bg-emerald-500 flex-shrink-0 flex items-center justify-center"
                      >
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <p className="text-sm text-text-muted line-through flex-1">{task.payload?.title || "Task"}</p>
                      <button
                        onClick={() => deleteTask(index)}
                        className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400 transition-all flex-shrink-0"
                        style={{ padding: '4px' }}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>

      <VoiceInput onSend={onSend} isLoading={isLoading} placeholder='Say "Remind me to buy groceries tomorrow"' clarification={clarification} />

      <ConfirmModal
        open={deleteIndex !== null}
        title="Delete Task"
        message="Are you sure you want to delete this task? This cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteIndex(null)}
      />
    </div>
  );
}

export default TasksTab;
