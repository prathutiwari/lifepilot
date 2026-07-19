import { useState, useEffect, useRef } from "react";
import VoiceInput from "../VoiceInput";
import ConfirmModal from "../ConfirmModal";

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDurationLabel(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function StudyTab({ studies, setStudies, onSend, isLoading, clarification, onAdd, onUpdate, onRemove }) {
  // Active session state
  const [activeSession, setActiveSession] = useState(null); // { subject, targetMinutes }
  const [elapsed, setElapsed] = useState(0); // seconds
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  // UI state
  const [showStartForm, setShowStartForm] = useState(false);
  const [startFormData, setStartFormData] = useState({ subject: "", targetMinutes: "" });
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateOffset, setDateOffset] = useState(0);
  const dateScrollRef = useRef(null);

  const dates = Array.from({ length: 15 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (14 - i) + dateOffset * 15);
    return d.toISOString().split("T")[0];
  });
  const dayStudies = studies.filter((s) => s.effectiveDate === selectedDate);

  // Auto-scroll date picker to show selected date
  useEffect(() => {
    if (dateScrollRef.current) {
      const active = dateScrollRef.current.querySelector('[data-active="true"]');
      if (active) active.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }
  }, [selectedDate, dateOffset]);

  // Timer logic
  useEffect(() => {
    if (activeSession && !isPaused) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [activeSession, isPaused]);

  // Stats
  const today = new Date().toISOString().split("T")[0];
  const todayMinutes = studies
    .filter((s) => s.effectiveDate === today)
    .reduce((sum, s) => sum + (s.payload?.durationSeconds ? Math.round(s.payload.durationSeconds / 60) : 0), 0);
  const dayMinutes = dayStudies.reduce((sum, s) => sum + (s.payload?.durationSeconds ? Math.round(s.payload.durationSeconds / 60) : 0), 0);
  const totalMinutes = studies.reduce((sum, s) => sum + (s.payload?.durationSeconds ? Math.round(s.payload.durationSeconds / 60) : 0), 0);

  const updateStudyField = (index, field, value) => {
    const item = studies[index];
    const newPayload = { ...item.payload, [field]: value };
    setStudies((prev) => prev.map((s, i) => (i === index ? { ...s, payload: newPayload } : s)));
    if (item?.id) onUpdate("study", item.id, { payload: newPayload });
  };

  // Start session
  const startSession = (e) => {
    e.preventDefault();
    if (!startFormData.subject.trim()) return;
    setActiveSession({
      subject: startFormData.subject,
      targetMinutes: startFormData.targetMinutes ? Number(startFormData.targetMinutes) : null,
    });
    setElapsed(0);
    setIsPaused(false);
    setShowStartForm(false);
    setStartFormData({ subject: "", targetMinutes: "" });
  };

  // Finish session
  const finishSession = async () => {
    if (!activeSession || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAdd("study", {
        type: "study",
        effectiveDate: today,
        payload: {
          title: activeSession.subject,
          duration: formatDurationLabel(elapsed),
          durationSeconds: elapsed,
          targetMinutes: activeSession.targetMinutes,
        },
      });
      setActiveSession(null);
      setElapsed(0);
      clearInterval(timerRef.current);
    } catch (error) {
      console.error("Failed to save study session", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Discard session
  const discardSession = () => {
    if (confirm("Discard this study session?")) {
      setActiveSession(null);
      setElapsed(0);
      clearInterval(timerRef.current);
    }
  };

  const deleteStudy = (index) => setDeleteIndex(index);
  const confirmDelete = async () => {
    const item = studies[deleteIndex];
    if (item?.id) await onRemove("study", item.id);
    else setStudies((prev) => prev.filter((_, i) => i !== deleteIndex));
    setDeleteIndex(null);
  };

  // Progress percentage for target
  const progress = activeSession?.targetMinutes
    ? Math.min((elapsed / (activeSession.targetMinutes * 60)) * 100, 100)
    : null;

  // If there's an active session, show the timer view
  if (activeSession) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        {/* Timer Header */}
        <div className="bg-violet-500/10 border-b border-violet-500/20" style={{ padding: '14px 28px' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center" style={{ gap: '12px' }}>
              <div className={`w-3 h-3 rounded-full ${isPaused ? "bg-amber-400" : "bg-violet-400 animate-pulse"}`} />
              <span className="text-sm font-bold text-text">{isPaused ? "Paused" : "Studying"}</span>
              <span className="text-xs text-text-muted">{activeSession.subject}</span>
            </div>
            <div className="flex items-center" style={{ gap: '8px' }}>
              <button onClick={discardSession} className="text-xs text-text-muted hover:text-red-400 border border-border rounded-lg" style={{ padding: '6px 12px' }}>Discard</button>
              <button onClick={finishSession} disabled={isSubmitting} className="text-xs text-white bg-emerald-600 hover:bg-emerald-700 font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed" style={{ padding: '6px 12px' }}>{isSubmitting ? "Saving..." : "Finish Session ✓"}</button>
            </div>
          </div>
        </div>

        {/* Timer Display */}
        <div className="flex-1 flex flex-col items-center justify-center" style={{ padding: '40px 28px' }}>
          {/* Progress Ring (if target set) */}
          <div style={{ position: 'relative', width: '200px', height: '200px', marginBottom: '30px' }}>
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              {/* Background circle */}
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--color-border)" strokeWidth="2" />
              {/* Progress circle */}
              <circle
                cx="18" cy="18" r="15.9"
                fill="none"
                stroke={progress !== null && progress >= 100 ? "#10b981" : "#8b5cf6"}
                strokeWidth="2.5"
                strokeDasharray={`${progress !== null ? progress : (elapsed % 60) / 60 * 100} 100`}
                strokeLinecap="round"
              />
            </svg>
            {/* Center content */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span className="text-3xl font-bold text-text font-mono">{formatTime(elapsed)}</span>
              {activeSession.targetMinutes && (
                <span className="text-xs text-text-muted" style={{ marginTop: '6px' }}>
                  Target: {activeSession.targetMinutes} min
                </span>
              )}
            </div>
          </div>

          {/* Subject */}
          <p className="text-lg font-semibold text-text">{activeSession.subject}</p>
          {progress !== null && progress >= 100 && (
            <p className="text-sm text-emerald-400 font-medium" style={{ marginTop: '8px' }}>Target reached!</p>
          )}

          {/* Pause/Resume Button */}
          <button
            onClick={() => setIsPaused((p) => !p)}
            className={`flex items-center gap-2 rounded-full font-medium transition-colors ${
              isPaused ? "bg-violet-600 hover:bg-violet-700 text-white" : "bg-surface-lighter hover:bg-surface-lighter/80 text-text border border-border"
            }`}
            style={{ padding: '12px 28px', marginTop: '30px' }}
          >
            {isPaused ? (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
                Resume
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6" /></svg>
                Pause
              </>
            )}
          </button>
        </div>

        <VoiceInput onSend={onSend} isLoading={isLoading} placeholder='Say "Studied Node.js for 1 hour"' clarification={clarification} />
      </div>
    );
  }

  // History view (no active session)
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div style={{ padding: '20px 20px', borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
          <div>
            <h2 className="text-xl font-bold text-text">Study</h2>
            <p className="text-sm text-text-muted" style={{ marginTop: '4px' }}>
              {dayStudies.length} session{dayStudies.length !== 1 ? "s" : ""}
              {dayMinutes > 0 && ` · ${dayMinutes}m`}
              {studies.length > 0 && ` · ${studies.length} total (${Math.round(totalMinutes / 60)}h)`}
            </p>
          </div>
          <button onClick={() => { setShowStartForm(true); setStartFormData({ subject: "", targetMinutes: "" }); }} className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-xs sm:text-sm font-medium rounded-lg transition-colors" style={{ padding: '8px 14px' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Start Session
          </button>
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

      {/* Start Session Form */}
      {showStartForm && (
        <div style={{ padding: '20px 20px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-light)' }}>
          <form onSubmit={startSession}>
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '10px', marginBottom: '12px' }}>
              <div>
                <label className="text-xs text-text-muted font-medium" style={{ display: 'block', marginBottom: '4px' }}>Subject <span className="text-red-400">*</span></label>
                <input type="text" value={startFormData.subject} onChange={(e) => setStartFormData({ ...startFormData, subject: e.target.value })} placeholder="React, Node.js, Math..." className="w-full bg-surface-lighter border border-border rounded-lg text-sm text-text placeholder-text-muted/50 focus:outline-none focus:border-primary/50" style={{ height: '38px', padding: '0 12px' }} required autoFocus />
              </div>
              <div>
                <label className="text-xs text-text-muted font-medium" style={{ display: 'block', marginBottom: '4px' }}>Target (min) <span className="text-text-muted/50">optional</span></label>
                <input type="number" value={startFormData.targetMinutes} onChange={(e) => setStartFormData({ ...startFormData, targetMinutes: e.target.value })} placeholder="45" className="w-full bg-surface-lighter border border-border rounded-lg text-sm text-text placeholder-text-muted/50 focus:outline-none focus:border-primary/50" style={{ height: '38px', padding: '0 12px' }} />
              </div>
            </div>
            <div className="flex justify-end" style={{ gap: '8px' }}>
              <button type="button" onClick={() => setShowStartForm(false)} className="text-sm text-text-muted hover:text-text rounded-lg border border-border" style={{ padding: '7px 14px' }}>Cancel</button>
              <button type="submit" className="text-sm text-white bg-violet-600 hover:bg-violet-700 rounded-lg font-medium" style={{ padding: '7px 14px' }}>Start Timer</button>
            </div>
          </form>
        </div>
      )}

      {/* Session History */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '20px 20px' }}>
        {dayStudies.length === 0 && !showStartForm ? (
          <div className="flex flex-col items-center justify-center" style={{ paddingTop: '60px' }}>
            <div className="rounded-full bg-surface-lighter border border-border flex items-center justify-center" style={{ width: '64px', height: '64px', marginBottom: '16px' }}>
              <svg className="w-7 h-7 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            <p className="text-base text-text-muted font-medium">No study sessions on this day</p>
            <p className="text-sm text-text-muted/50" style={{ marginTop: '6px' }}>Click "Start Session" to begin the timer</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {dayStudies.map((s) => {
              const i = studies.indexOf(s);
              const isEditing = editingIndex === i;
              const targetHit = s.payload?.targetMinutes && s.payload?.durationSeconds >= s.payload.targetMinutes * 60;
              return (
                <div key={i} className="group flex items-center justify-between rounded-xl border border-violet-500/20 bg-violet-500/8" style={{ padding: '14px 18px' }}>
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={s.payload?.title || ""}
                          onChange={(e) => updateStudyField(i, "title", e.target.value)}
                          placeholder="Subject"
                          className="flex-1 bg-transparent text-sm font-medium text-text border-b border-violet-500/30 focus:outline-none focus:border-primary"
                          style={{ padding: '2px 0' }}
                          autoFocus
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center" style={{ gap: '8px' }}>
                          <p className="text-sm font-medium text-text">{s.payload?.title || "Study"}</p>
                          {targetHit && <span className="text-xs text-emerald-400">✓ target</span>}
                        </div>
                        <div className="flex items-center" style={{ gap: '8px', marginTop: '3px' }}>
                          <span className="text-xs text-violet-400 font-medium">⏱ {s.payload?.duration || "—"}</span>
                          {s.payload?.targetMinutes && (
                            <span className="text-xs text-text-muted">/ {s.payload.targetMinutes}m goal</span>
                          )}
                          <span className="text-xs text-text-muted">{s.effectiveDate}</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center" style={{ gap: '6px' }}>
                    <button
                      onClick={() => setEditingIndex(isEditing ? null : i)}
                      className={`text-text-muted hover:text-primary-light transition-all ${isEditing ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                      style={{ padding: '4px' }}
                    >
                      {isEditing ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      )}
                    </button>
                    <button onClick={() => deleteStudy(i)} className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400 transition-all" style={{ padding: '4px' }}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <VoiceInput onSend={onSend} isLoading={isLoading} placeholder='Say "Studied Node.js for 1 hour"' clarification={clarification} />

      <ConfirmModal
        open={deleteIndex !== null}
        title="Delete Study Session"
        message="Are you sure you want to delete this study session? This cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteIndex(null)}
      />
    </div>
  );
}

export default StudyTab;
