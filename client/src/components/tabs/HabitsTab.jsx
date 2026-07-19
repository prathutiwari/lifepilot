import { useState, useRef, useEffect } from "react";
import VoiceInput from "../VoiceInput";
import ConfirmModal from "../ConfirmModal";

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function HabitsTab({ habits, setHabits, onSend, isLoading, clarification, onAdd, onUpdate, onRemove }) {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [dateOffset, setDateOffset] = useState(0);
  const dateScrollRef = useRef(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHabit, setNewHabit] = useState("");
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = getToday();
  const isToday = selectedDate === today;

  // 15-day picker
  const dates = Array.from({ length: 15 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (14 - i) + dateOffset * 15);
    return d.toISOString().split("T")[0];
  });

  // Auto-scroll date picker
  useEffect(() => {
    if (dateScrollRef.current) {
      const active = dateScrollRef.current.querySelector('[data-active="true"]');
      if (active) active.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }
  }, [selectedDate, dateOffset]);

  // Get habit definitions — only show habits created on or before selected date
  const habitDefs = habits.filter((h) => h.payload?.subtype === "habit_def" && h.effectiveDate <= selectedDate);

  // Get logs for selected date
  const dayLogs = habits.filter((h) => h.effectiveDate === selectedDate && h.payload?.subtype === "habit_log");

  // Check if a habit is done for the selected date
  const isHabitDone = (habitName) => {
    return dayLogs.some((l) => l.payload?.habitName === habitName && l.payload?.done);
  };

  // Get log entry for a habit on selected date
  const getHabitLog = (habitName) => {
    return dayLogs.find((l) => l.payload?.habitName === habitName);
  };

  // Daily stats
  const completedCount = habitDefs.filter((h) => isHabitDone(h.payload?.name)).length;
  const totalHabits = habitDefs.length;
  const dailyPercent = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;

  // Monthly stats
  const selectedMonth = selectedDate.slice(0, 7);
  const allHabitDefs = habits.filter((h) => h.payload?.subtype === "habit_def");
  const monthLogs = habits.filter((h) => (h.effectiveDate || "").startsWith(selectedMonth) && h.payload?.subtype === "habit_log" && h.payload?.done);
  const daysInMonth = new Date(Number(selectedMonth.slice(0, 4)), Number(selectedMonth.slice(5, 7)), 0).getDate();
  // Only count possible days from when each habit was created
  const possibleMonthly = allHabitDefs.reduce((sum, h) => {
    const createdDay = h.effectiveDate?.startsWith(selectedMonth) ? Number(h.effectiveDate.slice(8, 10)) : 1;
    return sum + (daysInMonth - createdDay + 1);
  }, 0);
  const monthlyPercent = possibleMonthly > 0 ? Math.round((monthLogs.length / possibleMonthly) * 100) : 0;

  // Add a new habit definition
  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!newHabit.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAdd("habits", {
        type: "habit",
        effectiveDate: today,
        payload: { subtype: "habit_def", name: newHabit.trim() },
      });
      setNewHabit("");
      setShowAddForm(false);
    } catch (error) {
      console.error("Failed to add habit", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle habit done/not-done (only for today)
  const toggleHabit = async (habitName) => {
    if (!isToday) return;
    const existing = getHabitLog(habitName);
    if (existing) {
      // Toggle it
      const newPayload = { ...existing.payload, done: !existing.payload.done };
      await onUpdate("habits", existing.id, { payload: newPayload });
      setHabits((prev) => prev.map((h) => h.id === existing.id ? { ...h, payload: newPayload } : h));
    } else {
      // Create new log (mark as done)
      await onAdd("habits", {
        type: "habit",
        effectiveDate: today,
        payload: { subtype: "habit_log", habitName, done: true },
      });
    }
  };

  // Delete a habit definition
  const confirmDelete = async () => {
    const item = habits[deleteIndex];
    if (item?.id) await onRemove("habits", item.id);
    else setHabits((prev) => prev.filter((_, i) => i !== deleteIndex));
    setDeleteIndex(null);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div style={{ padding: '20px 20px', borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
          <div>
            <h2 className="text-xl font-bold text-text">Habits</h2>
            <p className="text-sm text-text-muted" style={{ marginTop: '4px' }}>
              {completedCount}/{totalHabits} done{isToday ? " today" : ""}
              {totalHabits > 0 && ` · ${dailyPercent}%`}
            </p>
          </div>
          <div className="flex items-center" style={{ gap: '8px' }}>
            {totalHabits > 0 && (
              <button onClick={() => setShowStats(true)} className="flex items-center gap-1 text-xs text-text-muted hover:text-primary-light border border-border rounded-lg transition-colors" style={{ padding: '7px 12px' }}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                Stats
              </button>
            )}
            <button onClick={() => setShowAddForm(true)} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors" style={{ padding: '8px 16px' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Add Habit
            </button>
          </div>
        </div>

        {/* Day Picker */}
        <div className="flex items-center" style={{ gap: '4px' }}>
          <button onClick={() => setDateOffset((o) => o - 1)} className="text-text-muted hover:text-text flex-shrink-0" style={{ padding: '4px' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div ref={dateScrollRef} className="flex-1 overflow-x-auto flex hide-scrollbar" style={{ gap: '4px' }}>
            {dates.map((date) => {
              const d = new Date(date + "T00:00:00");
              const isActive = date === selectedDate;
              const isCurrentDay = date === today;
              return (
                <button key={date} data-active={isActive} onClick={() => setSelectedDate(date)} className={`flex flex-col items-center rounded-lg transition-all flex-shrink-0 ${isActive ? "bg-primary text-white" : "bg-surface-lighter text-text-muted hover:text-text"}`} style={{ padding: '6px 8px', minWidth: '40px' }}>
                  <span className="text-[10px] font-medium uppercase">{d.toLocaleDateString("en", { weekday: "short" })}</span>
                  <span className={`text-sm font-bold ${!isActive && isCurrentDay ? "text-primary-light" : ""}`} style={{ marginTop: '1px' }}>{d.getDate()}</span>
                </button>
              );
            })}
          </div>
          <button onClick={() => { if (dateOffset < 0) setDateOffset((o) => o + 1); }} className={`flex-shrink-0 ${dateOffset >= 0 ? "text-text-muted/30" : "text-text-muted hover:text-text"}`} style={{ padding: '4px' }} disabled={dateOffset >= 0}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {/* Add Habit Form */}
      {showAddForm && (
        <div style={{ padding: '16px 28px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-light)' }}>
          <form onSubmit={handleAddHabit} className="flex items-center" style={{ gap: '10px' }}>
            <input type="text" value={newHabit} onChange={(e) => setNewHabit(e.target.value)} placeholder="Habit name (e.g. Read 30min, Meditate)" className="flex-1 bg-surface-lighter border border-border rounded-lg text-sm text-text placeholder-text-muted/50 focus:outline-none focus:border-primary/50" style={{ height: '38px', padding: '0 12px' }} required autoFocus />
            <button type="submit" disabled={isSubmitting} className="text-sm text-white bg-primary hover:bg-primary-dark rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed" style={{ padding: '8px 14px' }}>{isSubmitting ? "Adding..." : "Add"}</button>
            <button type="button" onClick={() => setShowAddForm(false)} disabled={isSubmitting} className="text-sm text-text-muted hover:text-text disabled:opacity-50 disabled:cursor-not-allowed" style={{ padding: '8px' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </form>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '20px 20px' }}>
        {/* Daily Progress Bar */}
        {totalHabits > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '6px' }}>
              <span className="text-xs text-text-muted">{completedCount} of {totalHabits} completed</span>
              <span className="text-xs font-bold text-primary-light">{dailyPercent}%</span>
            </div>
            <div className="w-full rounded-full overflow-hidden" style={{ height: '6px', backgroundColor: 'var(--color-surface-lighter)' }}>
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${dailyPercent}%` }} />
            </div>
          </div>
        )}

        {/* Habits List */}
        {habitDefs.length === 0 ? (
          <div className="flex flex-col items-center justify-center" style={{ paddingTop: '60px' }}>
            <div className="rounded-full bg-surface-lighter border border-border flex items-center justify-center" style={{ width: '56px', height: '56px', marginBottom: '16px' }}>
              <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-sm text-text-muted font-medium">No habits yet</p>
            <p className="text-xs text-text-muted/50" style={{ marginTop: '6px' }}>Click "Add Habit" to start tracking</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {habitDefs.map((habit) => {
              const name = habit.payload?.name;
              const done = isHabitDone(name);
              const globalIdx = habits.indexOf(habit);
              return (
                <div key={habit.id || globalIdx} className={`group flex items-center rounded-xl border transition-colors ${done ? "border-emerald-500/30 bg-emerald-500/8" : "border-border bg-surface-lighter"}`} style={{ padding: '14px 18px', gap: '14px' }}>
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleHabit(name)}
                    disabled={!isToday}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      done ? "bg-emerald-500 text-white" : isToday ? "border-2 border-border hover:border-emerald-400" : "border-2 border-border/50 opacity-50"
                    }`}
                  >
                    {done && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </button>

                  {/* Name */}
                  <span className={`flex-1 text-sm font-medium ${done ? "text-emerald-300 line-through" : "text-text"}`}>{name}</span>

                  {/* Delete (only show for today) */}
                  {isToday && (
                    <button onClick={() => setDeleteIndex(globalIdx)} className="opacity-100 text-text-muted hover:text-red-400 transition-all" style={{ padding: '4px' }}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}

                  {/* Past day indicator */}
                  {!isToday && (
                    <span className={`text-xs ${done ? "text-emerald-400" : "text-text-muted/50"}`}>
                      {done ? "✓" : "—"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <VoiceInput onSend={onSend} isLoading={isLoading} placeholder='Say "Add habit: meditate daily"' clarification={clarification} />

      {/* Monthly Stats Popup */}
      {showStats && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50" style={{ padding: '40px' }}>
          <div className="bg-surface-light border border-border rounded-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
              <h3 className="text-base font-bold text-text">Monthly Stats</h3>
              <button onClick={() => setShowStats(false)} className="text-text-muted hover:text-text">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div style={{ padding: '24px 20px' }}>
              {/* Donut Chart */}
              <div className="flex items-center justify-center" style={{ marginBottom: '20px' }}>
                <div style={{ position: 'relative', width: '140px', height: '140px' }}>
                  <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--color-border)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10b981" strokeWidth="3.5" strokeDasharray={`${monthlyPercent} ${100 - monthlyPercent}`} strokeLinecap="round" />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="text-2xl font-bold text-emerald-400">{monthlyPercent}%</span>
                    <span className="text-xs text-text-muted">this month</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text">Habits tracked</span>
                  <span className="text-sm font-medium text-text-muted">{totalHabits}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text">Completed this month</span>
                  <span className="text-sm font-medium text-emerald-400">{monthLogs.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text">Possible completions</span>
                  <span className="text-sm font-medium text-text-muted">{possibleMonthly}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text">Completion rate</span>
                  <span className="text-sm font-bold text-emerald-400">{monthlyPercent}%</span>
                </div>
              </div>

              {/* Per-habit breakdown */}
              {habitDefs.length > 0 && (
                <div style={{ marginTop: '20px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-wider" style={{ marginBottom: '10px' }}>Per Habit</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {habitDefs.map((h) => {
                      const name = h.payload?.name;
                      const doneCount = habits.filter((l) => (l.effectiveDate || "").startsWith(selectedMonth) && l.payload?.subtype === "habit_log" && l.payload?.habitName === name && l.payload?.done).length;
                      const pct = daysInMonth > 0 ? Math.round((doneCount / daysInMonth) * 100) : 0;
                      return (
                        <div key={name}>
                          <div className="flex items-center justify-between" style={{ marginBottom: '3px' }}>
                            <span className="text-xs text-text">{name}</span>
                            <span className="text-xs text-text-muted">{doneCount}/{daysInMonth} ({pct}%)</span>
                          </div>
                          <div className="w-full rounded-full overflow-hidden" style={{ height: '4px', backgroundColor: 'var(--color-surface-lighter)' }}>
                            <div className="h-full rounded-full bg-emerald-400" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={deleteIndex !== null}
        title="Delete Habit"
        message="Are you sure you want to remove this habit? History will be lost."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteIndex(null)}
      />
    </div>
  );
}

export default HabitsTab;
