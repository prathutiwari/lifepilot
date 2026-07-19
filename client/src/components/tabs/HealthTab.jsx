import { useState, useRef, useEffect } from "react";
import VoiceInput from "../VoiceInput";
import ConfirmModal from "../ConfirmModal";

const DEFAULT_TARGETS = { water: 3, sleep: 8, calories: 2000 };

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function ProgressRing({ percent, color, size = 100, strokeWidth = 8, children }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-border)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.4s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {children}
      </div>
    </div>
  );
}

function HealthTab({ health, setHealth, onSend, isLoading, clarification, onAdd, onUpdate, onRemove }) {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [dateOffset, setDateOffset] = useState(0);
  const dateScrollRef = useRef(null);
  const [showSetup, setShowSetup] = useState(false);
  const [setupData, setSetupData] = useState({ water: "3", sleep: "8", calories: "2000" });
  const [activePanel, setActivePanel] = useState(null);
  const [sleepBed, setSleepBed] = useState("23:00");
  const [sleepWake, setSleepWake] = useState("07:00");
  const [calorieInput, setCalorieInput] = useState("");
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = getToday();
  const isToday = selectedDate === today;

  // 15-day strip with navigation
  const dates = Array.from({ length: 15 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (14 - i) + dateOffset * 15);
    return d.toISOString().split("T")[0];
  });

  // Get targets
  const targetEntry = health.find((h) => h.payload?.subtype === "targets");
  const targets = targetEntry?.payload?.targets || DEFAULT_TARGETS;

  // Auto-scroll date picker
  useEffect(() => {
    if (dateScrollRef.current) {
      const active = dateScrollRef.current.querySelector('[data-active="true"]');
      if (active) active.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }
  }, [selectedDate, dateOffset]);

  // Selected day's logs
  const dayLogs = health.filter((h) => h.effectiveDate === selectedDate && h.payload?.subtype === "log");
  const dayWater = dayLogs.filter((h) => h.payload?.category === "water").reduce((s, h) => s + (h.payload?.value || 0), 0);
  const daySleep = dayLogs.filter((h) => h.payload?.category === "sleep").reduce((s, h) => s + (h.payload?.value || 0), 0);
  const dayCalories = dayLogs.filter((h) => h.payload?.category === "calories").reduce((s, h) => s + (h.payload?.value || 0), 0);

  const waterPercent = targets.water > 0 ? (dayWater / targets.water) * 100 : 0;
  const sleepPercent = targets.sleep > 0 ? (daySleep / targets.sleep) * 100 : 0;
  const caloriesPercent = targets.calories > 0 ? (dayCalories / targets.calories) * 100 : 0;

  const waterMl = Math.round(dayWater * 1000);
  const targetMl = targets.water * 1000;

  const sanitizeNonNegativeValue = (value) => {
    if (value === "" || value === null || value === undefined) return "";
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return "";
    return Math.max(0, numericValue);
  };

  // Save targets
  const handleSaveTargets = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const newTargets = {
        water: Number(sanitizeNonNegativeValue(setupData.water)) || 0,
        sleep: Number(sanitizeNonNegativeValue(setupData.sleep)) || 0,
        calories: Number(sanitizeNonNegativeValue(setupData.calories)) || 0,
      };
      if (targetEntry?.id) {
        const updatedPayload = { subtype: "targets", targets: newTargets };
        await onUpdate("health", targetEntry.id, { payload: updatedPayload });
        setHealth((prev) => prev.map((h) => h.id === targetEntry.id ? { ...h, payload: updatedPayload } : h));
      } else {
        await onAdd("health", { type: "health", effectiveDate: today, payload: { subtype: "targets", targets: newTargets } });
      }
      setShowSetup(false);
    } catch (error) {
      console.error("Failed to save targets", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick add water
  const addWater = async (ml) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAdd("health", { type: "health", effectiveDate: selectedDate, payload: { subtype: "log", category: "water", value: ml / 1000, label: `${ml}ml` } });
    } catch (error) {
      console.error("Failed to log water", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add sleep
  const addSleep = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const [bH, bM] = sleepBed.split(":").map(Number);
      const [wH, wM] = sleepWake.split(":").map(Number);
      let bed = bH * 60 + bM, wake = wH * 60 + wM;
      if (wake <= bed) wake += 24 * 60;
      const hours = Math.round(((wake - bed) / 60) * 10) / 10;
      await onAdd("health", { type: "health", effectiveDate: selectedDate, payload: { subtype: "log", category: "sleep", value: hours, label: `${sleepBed} → ${sleepWake}` } });
      setActivePanel(null);
    } catch (error) {
      console.error("Failed to log sleep", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add calories
  const addCalories = async (amount) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAdd("health", { type: "health", effectiveDate: selectedDate, payload: { subtype: "log", category: "calories", value: amount, label: `${amount} kcal` } });
      setCalorieInput("");
    } catch (error) {
      console.error("Failed to log calories", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit a log entry
  const startEdit = (log) => {
    setEditingId(log.id);
    setEditValue(String(log.payload?.value || ""));
  };

  const saveEdit = async (log) => {
    const newValue = Number(sanitizeNonNegativeValue(editValue));
    if (Number.isNaN(newValue) || newValue < 0 || newValue === log.payload?.value) { setEditingId(null); return; }
    const cat = log.payload?.category;
    let label = `${newValue}`;
    if (cat === "water") label = `${Math.round(newValue * 1000)}ml`;
    else if (cat === "sleep") label = `${newValue}h`;
    else if (cat === "calories") label = `${newValue} kcal`;
    const newPayload = { ...log.payload, value: newValue, label };
    await onUpdate("health", log.id, { payload: newPayload });
    setHealth((prev) => prev.map((h) => h.id === log.id ? { ...h, payload: newPayload } : h));
    setEditingId(null);
  };

  // Delete
  const confirmDelete = async () => {
    const item = health[deleteIndex];
    if (item?.id) await onRemove("health", item.id);
    else setHealth((prev) => prev.filter((_, i) => i !== deleteIndex));
    setDeleteIndex(null);
  };

  const recentLogs = dayLogs.slice().reverse();

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div style={{ padding: '20px 20px', borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
          <div>
            <h2 className="text-xl font-bold text-text">Health</h2>
            <p className="text-sm text-text-muted" style={{ marginTop: '4px' }}>
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <button onClick={() => { setSetupData({ water: String(targets.water), sleep: String(targets.sleep), calories: String(targets.calories) }); setShowSetup(true); }} className="flex items-center gap-1 text-xs text-text-muted hover:text-primary-light border border-border rounded-lg transition-colors" style={{ padding: '7px 12px' }}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Targets
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

      {/* Targets Modal */}
      {showSetup && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50" style={{ padding: '40px' }}>
          <div className="bg-surface-light border border-border rounded-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
              <h3 className="text-base font-bold text-text">Daily Targets</h3>
              <button onClick={() => setShowSetup(false)} className="text-text-muted hover:text-text">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSaveTargets} style={{ padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label className="text-xs text-text-muted font-medium" style={{ display: 'block', marginBottom: '4px' }}>💧 Water (liters/day)</label>
                  <input type="number" step="0.5" min="0" value={setupData.water} onChange={(e) => setSetupData({ ...setupData, water: sanitizeNonNegativeValue(e.target.value) })} className="w-full bg-surface-lighter border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary/50" style={{ height: '38px', padding: '0 12px' }} required />
                </div>
                <div>
                  <label className="text-xs text-text-muted font-medium" style={{ display: 'block', marginBottom: '4px' }}>😴 Sleep (hours/day)</label>
                  <input type="number" step="0.5" min="0" value={setupData.sleep} onChange={(e) => setSetupData({ ...setupData, sleep: sanitizeNonNegativeValue(e.target.value) })} className="w-full bg-surface-lighter border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary/50" style={{ height: '38px', padding: '0 12px' }} required />
                </div>
                <div>
                  <label className="text-xs text-text-muted font-medium" style={{ display: 'block', marginBottom: '4px' }}>🍎 Calories (kcal/day)</label>
                  <input type="number" step="100" min="0" value={setupData.calories} onChange={(e) => setSetupData({ ...setupData, calories: sanitizeNonNegativeValue(e.target.value) })} className="w-full bg-surface-lighter border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary/50" style={{ height: '38px', padding: '0 12px' }} required />
                </div>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full text-sm text-white bg-primary hover:bg-primary-dark rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed" style={{ padding: '10px' }}>{isSubmitting ? "Saving..." : "Save Targets"}</button>
            </form>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '20px 20px' }}>
        {/* Progress Rings */}
        <div className="flex items-center justify-around" style={{ marginBottom: '24px' }}>
          <div className="flex flex-col items-center cursor-pointer" onClick={() => setActivePanel(activePanel === "water" ? null : "water")}>
            <ProgressRing percent={waterPercent} color="#38bdf8" size={110} strokeWidth={9}>
              <span className="text-lg">💧</span>
              <span className="text-xs font-bold text-text">{waterMl}/{targetMl}ml</span>
            </ProgressRing>
            <span className="text-xs text-text-muted font-medium" style={{ marginTop: '8px' }}>Water</span>
          </div>
          <div className="flex flex-col items-center cursor-pointer" onClick={() => setActivePanel(activePanel === "sleep" ? null : "sleep")}>
            <ProgressRing percent={sleepPercent} color="#a78bfa" size={110} strokeWidth={9}>
              <span className="text-lg">😴</span>
              <span className="text-xs font-bold text-text">{daySleep}/{targets.sleep}h</span>
            </ProgressRing>
            <span className="text-xs text-text-muted font-medium" style={{ marginTop: '8px' }}>Sleep</span>
          </div>
          <div className="flex flex-col items-center cursor-pointer" onClick={() => setActivePanel(activePanel === "calories" ? null : "calories")}>
            <ProgressRing percent={caloriesPercent} color="#34d399" size={110} strokeWidth={9}>
              <span className="text-lg">🍎</span>
              <span className="text-xs font-bold text-text">{dayCalories}/{targets.calories}</span>
            </ProgressRing>
            <span className="text-xs text-text-muted font-medium" style={{ marginTop: '8px' }}>Diet</span>
          </div>
        </div>

        {/* Water Panel */}
        {activePanel === "water" && (
          <div className="rounded-xl border border-sky-500/20 bg-sky-500/5" style={{ padding: '16px 18px', marginBottom: '20px' }}>
            <p className="text-xs text-text-muted font-medium" style={{ marginBottom: '10px' }}>💧 Add Water</p>
            <div className="flex flex-wrap" style={{ gap: '8px' }}>
              {[150, 250, 500, 750, 1000].map((ml) => (
                <button key={ml} onClick={() => addWater(ml)} disabled={isSubmitting} className="text-sm font-medium text-sky-300 bg-sky-500/10 border border-sky-500/20 rounded-lg hover:bg-sky-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" style={{ padding: '8px 14px' }}>
                  +{ml >= 1000 ? `${ml / 1000}L` : `${ml}ml`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sleep Panel */}
        {activePanel === "sleep" && (
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5" style={{ padding: '16px 18px', marginBottom: '20px' }}>
            <p className="text-xs text-text-muted font-medium" style={{ marginBottom: '10px' }}>😴 Log Sleep</p>
            <div className="flex items-center" style={{ gap: '10px', marginBottom: '12px' }}>
              <div className="flex-1">
                <label className="text-xs text-text-muted" style={{ display: 'block', marginBottom: '3px' }}>Bedtime</label>
                <input type="time" value={sleepBed} onChange={(e) => setSleepBed(e.target.value)} className="w-full bg-surface-lighter border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary/50" style={{ height: '38px', padding: '0 10px' }} />
              </div>
              <span className="text-text-muted text-sm" style={{ paddingTop: '16px' }}>→</span>
              <div className="flex-1">
                <label className="text-xs text-text-muted" style={{ display: 'block', marginBottom: '3px' }}>Wake up</label>
                <input type="time" value={sleepWake} onChange={(e) => setSleepWake(e.target.value)} className="w-full bg-surface-lighter border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary/50" style={{ height: '38px', padding: '0 10px' }} />
              </div>
              <div style={{ paddingTop: '16px' }}>
                <button onClick={addSleep} disabled={isSubmitting} className="text-sm text-white bg-violet-600 hover:bg-violet-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed" style={{ padding: '9px 14px' }}>{isSubmitting ? "Logging..." : "Log"}</button>
              </div>
            </div>
            <p className="text-xs text-text-muted">
              {(() => { const [bH, bM] = sleepBed.split(":").map(Number); const [wH, wM] = sleepWake.split(":").map(Number); let bed = bH * 60 + bM, wake = wH * 60 + wM; if (wake <= bed) wake += 24 * 60; return `= ${Math.round(((wake - bed) / 60) * 10) / 10} hours`; })()}
            </p>
          </div>
        )}

        {/* Calories Panel */}
        {activePanel === "calories" && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5" style={{ padding: '16px 18px', marginBottom: '20px' }}>
            <p className="text-xs text-text-muted font-medium" style={{ marginBottom: '10px' }}>🍎 Add Calories</p>
            <div className="flex flex-wrap" style={{ gap: '8px', marginBottom: '10px' }}>
              {[200, 300, 500, 700, 1000].map((cal) => (
                <button key={cal} onClick={() => addCalories(cal)} disabled={isSubmitting} className="text-sm font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" style={{ padding: '8px 14px' }}>
                  +{cal} kcal
                </button>
              ))}
            </div>
            <div className="flex" style={{ gap: '8px' }}>
              <input type="number" min="0" value={calorieInput} onChange={(e) => setCalorieInput(sanitizeNonNegativeValue(e.target.value))} placeholder="Custom kcal" className="flex-1 bg-surface-lighter border border-border rounded-lg text-sm text-text placeholder-text-muted/50 focus:outline-none focus:border-primary/50" style={{ height: '36px', padding: '0 12px' }} />
              <button onClick={() => { if (calorieInput) addCalories(Number(calorieInput)); }} disabled={isSubmitting} className="text-sm text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed" style={{ padding: '8px 14px' }}>{isSubmitting ? "Adding..." : "Add"}</button>
            </div>
          </div>
        )}

        {/* Day's Log */}
        {recentLogs.length > 0 && (
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider" style={{ marginBottom: '10px' }}>
              {isToday ? "Today's Log" : "Log"}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {recentLogs.map((log) => {
                const globalIdx = health.indexOf(log);
                const cat = log.payload?.category;
                const emojis = { water: "💧", sleep: "😴", calories: "🍎" };
                const isEditingThis = editingId === log.id;
                return (
                  <div key={log.id || globalIdx} className="group flex items-center justify-between rounded-lg border border-border" style={{ padding: '10px 14px' }}>
                    <div className="flex items-center" style={{ gap: '10px' }}>
                      <span>{emojis[cat] || "📌"}</span>
                      {isEditingThis ? (
                        <form onSubmit={(e) => { e.preventDefault(); saveEdit(log); }} className="flex items-center" style={{ gap: '6px' }}>
                          <input
                            type="number"
                            min="0"
                            step={cat === "calories" ? "50" : "0.1"}
                            value={editValue}
                            onChange={(e) => setEditValue(sanitizeNonNegativeValue(e.target.value))}
                            className="bg-surface-lighter border border-border rounded text-sm text-text focus:outline-none focus:border-primary/50"
                            style={{ width: '70px', height: '28px', padding: '0 8px' }}
                            autoFocus
                          />
                          <span className="text-xs text-text-muted">{cat === "water" ? "L" : cat === "sleep" ? "hrs" : "kcal"}</span>
                          <button type="submit" className="text-xs text-emerald-400 hover:text-emerald-300 font-medium">Save</button>
                          <button type="button" onClick={() => setEditingId(null)} className="text-xs text-text-muted hover:text-text">Cancel</button>
                        </form>
                      ) : (
                        <span className="text-sm text-text font-medium">{log.payload?.label || `${log.payload?.value}`}</span>
                      )}
                    </div>
                    {!isEditingThis && (
                      <div className="flex items-center" style={{ gap: '4px' }}>
                        <button onClick={() => startEdit(log)} className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-primary-light transition-all" style={{ padding: '4px' }}>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => setDeleteIndex(globalIdx)} className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400 transition-all" style={{ padding: '4px' }}>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {recentLogs.length === 0 && !activePanel && (
          <div className="flex flex-col items-center" style={{ paddingTop: '20px' }}>
            <p className="text-sm text-text-muted">{isToday ? "Tap a ring above to log water, sleep, or diet" : "No entries for this day"}</p>
          </div>
        )}
      </div>

      <VoiceInput onSend={onSend} isLoading={isLoading} placeholder='Say "Drank 500ml water" or "Slept 7 hours"' clarification={clarification} />

      <ConfirmModal
        open={deleteIndex !== null}
        title="Delete Entry"
        message="Are you sure you want to remove this log entry?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteIndex(null)}
      />
    </div>
  );
}

export default HealthTab;
