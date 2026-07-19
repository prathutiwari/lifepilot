import { useState, useEffect, useRef } from "react";
import VoiceInput from "../VoiceInput";
import ConfirmModal from "../ConfirmModal";
import { EXERCISE_LIBRARY, MUSCLE_GROUPS } from "../../data/exercises";

function WorkoutsTab({ workouts, setWorkouts, onSend, isLoading, clarification, onAdd, onUpdate, onRemove }) {
  const [activeWorkout, setActiveWorkout] = useState(null); // current session
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMuscle, setFilterMuscle] = useState("");
  const [restTimer, setRestTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef(null);
  const [workoutStartTime, setWorkoutStartTime] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null); // index of workout being edited
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateOffset, setDateOffset] = useState(0);
  const dateScrollRef = useRef(null);

  const today = new Date().toISOString().split("T")[0];
  const dates = Array.from({ length: 15 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (14 - i) + dateOffset * 15);
    return d.toISOString().split("T")[0];
  });
  const dayWorkouts = workouts.filter((w) => w.effectiveDate === selectedDate);

  // Auto-scroll date picker
  useEffect(() => {
    if (dateScrollRef.current) {
      const active = dateScrollRef.current.querySelector('[data-active="true"]');
      if (active) active.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }
  }, [selectedDate, dateOffset]);

  // Rest timer
  useEffect(() => {
    if (timerRunning && restTimer > 0) {
      timerRef.current = setTimeout(() => setRestTimer((t) => t - 1), 1000);
    } else if (restTimer === 0 && timerRunning) {
      setTimerRunning(false);
    }
    return () => clearTimeout(timerRef.current);
  }, [restTimer, timerRunning]);

  const startRestTimer = (seconds = 90) => {
    setRestTimer(seconds);
    setTimerRunning(true);
  };

  const formatTimer = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // Start workout
  const startWorkout = () => {
    setActiveWorkout({ title: "", description: null, exercises: [] });
    setWorkoutStartTime(Date.now());
  };

  // Add exercise to active workout
  const addExercise = (exercise) => {
    setActiveWorkout((prev) => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        { ...exercise, sets: [{ weight: "", reps: "", completed: false }] },
      ],
    }));
    setShowExercisePicker(false);
    setSearchQuery("");
    setFilterMuscle("");
  };

  // Add a set to an exercise
  const addSet = (exIndex) => {
    setActiveWorkout((prev) => {
      const exercises = prev.exercises.map((ex, i) => {
        if (i !== exIndex) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        return { ...ex, sets: [...ex.sets, { weight: lastSet?.weight || "", reps: lastSet?.reps || "", completed: false }] };
      });
      return { ...prev, exercises };
    });
  };

  // Update set data
  const updateSet = (exIndex, setIndex, field, value) => {
    setActiveWorkout((prev) => {
      const exercises = prev.exercises.map((ex, i) => {
        if (i !== exIndex) return ex;
        const sets = ex.sets.map((s, si) => (si === setIndex ? { ...s, [field]: value } : s));
        return { ...ex, sets };
      });
      return { ...prev, exercises };
    });
  };

  // Complete a set
  const completeSet = (exIndex, setIndex) => {
    setActiveWorkout((prev) => {
      const exercises = prev.exercises.map((ex, i) => {
        if (i !== exIndex) return ex;
        const sets = ex.sets.map((s, si) => (si === setIndex ? { ...s, completed: !s.completed } : s));
        return { ...ex, sets };
      });
      return { ...prev, exercises };
    });
    startRestTimer(90);
  };

  // Delete a set
  const deleteSet = (exIndex, setIndex) => {
    setActiveWorkout((prev) => {
      const exercises = prev.exercises
        .map((ex, i) => {
          if (i !== exIndex) return ex;
          return { ...ex, sets: ex.sets.filter((_, si) => si !== setIndex) };
        })
        .filter((ex) => ex.sets.length > 0);
      return { ...prev, exercises };
    });
  };

  // Finish workout
  const finishWorkout = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const duration = Math.round((Date.now() - workoutStartTime) / 60000);
      const totalVolume = activeWorkout.exercises.reduce((sum, ex) => {
        return sum + ex.sets.reduce((s, set) => {
          if (set.weight && set.reps) return s + (Number(set.weight) || 0) * (Number(set.reps) || 0);
          return s;
        }, 0);
      }, 0);

      await onAdd("workouts", {
        type: "workout",
        effectiveDate: new Date().toISOString().split("T")[0],
        payload: {
          title: activeWorkout.title?.trim() || "Workout Session",
          description: activeWorkout.description?.trim() || "",
          duration: `${duration} min`,
          exercises: activeWorkout.exercises.map((ex) => ({
            name: ex.name,
            muscle: ex.muscle,
            sets: ex.sets.filter((s) => s.weight || s.reps),
          })).filter((ex) => ex.sets.length > 0),
          totalVolume,
        },
      });
      setActiveWorkout(null);
      setWorkoutStartTime(null);
      setTimerRunning(false);
      setRestTimer(0);
    } catch (error) {
      console.error("Failed to save workout", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel workout
  const cancelWorkout = () => {
    if (confirm("Discard this workout?")) {
      setActiveWorkout(null);
      setWorkoutStartTime(null);
    }
  };

  // --- Editing saved workouts (title & description only) ---
  const updateWorkoutField = (index, field, value) => {
    const item = workouts[index];
    const newPayload = { ...item.payload, [field]: value };
    setWorkouts((prev) => prev.map((w, i) => (i === index ? { ...w, payload: newPayload } : w)));
    if (item?.id) onUpdate("workouts", item.id, { payload: newPayload });
  };

  // Filter exercises
  const filteredExercises = EXERCISE_LIBRARY.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscle = !filterMuscle || ex.muscle === filterMuscle;
    return matchesSearch && matchesMuscle;
  });

  // If no active workout, show history + start button
  if (!activeWorkout) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div style={{ padding: '20px 20px', borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
            <div>
              <h2 className="text-xl font-bold text-text">Workouts</h2>
              <p className="text-sm text-text-muted" style={{ marginTop: '4px' }}>
                {dayWorkouts.length} session{dayWorkouts.length !== 1 ? "s" : ""} today
                {dayWorkouts.length > 0 && ` · ${dayWorkouts.reduce((sum, w) => { const m = (w.payload?.duration || "").match(/(\d+)/); return sum + (m ? parseInt(m[1]) : 0); }, 0)}m`}
                {workouts.length > 0 && ` · ${workouts.length} total`}
              </p>
            </div>
            <button onClick={startWorkout} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors" style={{ padding: '10px 20px' }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Start
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

        <div className="flex-1 overflow-y-auto" style={{ padding: '20px 20px' }}>
          {dayWorkouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center" style={{ paddingTop: '60px' }}>
              <div className="rounded-full bg-surface-lighter border border-border flex items-center justify-center" style={{ width: '64px', height: '64px', marginBottom: '16px' }}>
                <svg className="w-7 h-7 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              </div>
              <p className="text-base text-text-muted font-medium">No workouts on this day</p>
              <p className="text-sm text-text-muted/50" style={{ marginTop: '6px' }}>Tap "Start Workout" to begin logging exercises</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {dayWorkouts.map((w) => {
                const i = workouts.indexOf(w);
                const isEditing = editingIndex === i;
                return (
                  <div key={i} className="group rounded-xl border border-rose-500/20 bg-rose-500/8" style={{ padding: '16px 20px' }}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Title */}
                        {isEditing ? (
                          <input
                            type="text"
                            value={w.payload?.title || ""}
                            onChange={(e) => updateWorkoutField(i, "title", e.target.value)}
                            placeholder="Workout title"
                            className="w-full bg-transparent text-sm font-semibold text-text border-b border-rose-500/30 focus:outline-none focus:border-primary"
                            style={{ padding: '2px 0' }}
                            autoFocus
                          />
                        ) : (
                          <p className="text-sm font-semibold text-text">{w.payload?.title || "Workout"}</p>
                        )}

                        {/* Description */}
                        {isEditing ? (
                          <textarea
                            value={w.payload?.description || ""}
                            onChange={(e) => updateWorkoutField(i, "description", e.target.value)}
                            placeholder="Add notes or description..."
                            className="w-full bg-transparent text-xs text-text-muted border-b border-rose-500/20 focus:outline-none focus:border-primary resize-none"
                            style={{ padding: '4px 0', marginTop: '4px', minHeight: '28px' }}
                          />
                        ) : (
                          w.payload?.description && (
                            <p className="text-xs text-text-muted/70" style={{ marginTop: '3px' }}>{w.payload.description}</p>
                          )
                        )}

                        {/* Duration & Stats */}
                        <div className="flex items-center" style={{ gap: '12px', marginTop: '6px' }}>
                          {w.payload?.duration && <span className="text-xs text-text-muted">⏱ {w.payload.duration}</span>}
                          {w.payload?.totalVolume > 0 && <span className="text-xs text-text-muted">🏋️ {w.payload.totalVolume.toLocaleString()} kg vol</span>}
                          <span className="text-xs text-text-muted">{w.effectiveDate}</span>
                        </div>

                        {/* Exercise tags (always read-only) */}
                        {w.payload?.exercises && (
                          <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {w.payload.exercises.map((ex, j) => (
                              <div key={j}>
                                <span className="text-xs font-medium text-rose-300">{ex.name}</span>
                                {ex.sets && ex.sets.length > 0 && (
                                  <div className="flex flex-wrap" style={{ gap: '4px', marginTop: '3px' }}>
                                    {ex.sets.map((set, si) => (
                                      <span key={si} className="text-xs bg-rose-500/15 text-rose-300/80 rounded-md" style={{ padding: '1px 6px' }}>
                                        {set.weight || 0}kg × {set.reps || 0}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center flex-shrink-0" style={{ gap: '4px', marginLeft: '8px' }}>
                        <button
                          onClick={() => setEditingIndex(isEditing ? null : i)}
                          className={`text-text-muted hover:text-primary-light transition-all ${isEditing ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                          style={{ padding: '4px' }}
                          title={isEditing ? "Done" : "Edit title & notes"}
                        >
                          {isEditing ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          )}
                        </button>
                        <button onClick={() => { setEditingIndex(null); setDeleteIndex(i); }} className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400 transition-all" style={{ padding: '4px' }}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <VoiceInput onSend={onSend} isLoading={isLoading} placeholder='Say "Did bench press 80kg 3 sets of 10"' clarification={clarification} />

        <ConfirmModal
          open={deleteIndex !== null}
          title="Delete Workout"
          message="Are you sure you want to delete this workout? This cannot be undone."
          onConfirm={async () => { const item = workouts[deleteIndex]; if (item?.id) await onRemove("workouts", item.id); else setWorkouts((prev) => prev.filter((_, idx) => idx !== deleteIndex)); setDeleteIndex(null); }}
          onCancel={() => setDeleteIndex(null)}
        />
      </div>
    );
  }

  // Active Workout Session
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Active Workout Header */}
      <div className="bg-rose-500/10 border-b border-rose-500/20" style={{ padding: '14px 28px' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center" style={{ gap: '12px' }}>
            <div className="w-3 h-3 rounded-full bg-rose-400 animate-pulse" />
            <span className="text-sm font-bold text-text">Workout in Progress</span>
            <span className="text-xs text-text-muted">
              {workoutStartTime && `${Math.round((Date.now() - workoutStartTime) / 60000)} min`}
            </span>
          </div>
          <div className="flex items-center" style={{ gap: '8px' }}>
            <button onClick={cancelWorkout} className="text-xs text-text-muted hover:text-red-400 border border-border rounded-lg" style={{ padding: '6px 12px' }}>Discard</button>
            <button onClick={finishWorkout} disabled={isSubmitting} className="text-xs text-white bg-emerald-600 hover:bg-emerald-700 font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed" style={{ padding: '6px 12px' }}>{isSubmitting ? "Saving..." : "Finish Workout ✓"}</button>
          </div>
        </div>

        {/* Rest Timer */}
        {timerRunning && (
          <div className="flex items-center justify-center" style={{ marginTop: '10px', gap: '10px' }}>
            <span className="text-xs text-text-muted">Rest</span>
            <span className="text-lg font-bold text-rose-400 font-mono">{formatTimer(restTimer)}</span>
            <button onClick={() => { setTimerRunning(false); setRestTimer(0); }} className="text-xs text-text-muted hover:text-text" style={{ padding: '2px 8px' }}>Skip</button>
          </div>
        )}
      </div>

      {/* Exercise List */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '20px 20px' }}>
        {/* Workout Title & Description (HEAVY-style) */}
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            value={activeWorkout.title}
            onChange={(e) => setActiveWorkout((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Workout Name"
            className="w-full bg-transparent text-lg font-bold text-text placeholder-text-muted/40 focus:outline-none"
            style={{ padding: '0' }}
          />
          {activeWorkout.description !== null ? (
            <textarea
              value={activeWorkout.description}
              onChange={(e) => setActiveWorkout((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Add a description or notes..."
              className="w-full bg-transparent text-sm text-text-muted placeholder-text-muted/40 focus:outline-none resize-none"
              style={{ padding: '0', marginTop: '6px', minHeight: '28px' }}
            />
          ) : (
            <button
              onClick={() => setActiveWorkout((prev) => ({ ...prev, description: "" }))}
              className="text-xs text-text-muted/50 hover:text-primary-light transition-colors"
              style={{ marginTop: '6px' }}
            >
              + Add description
            </button>
          )}
        </div>

        {activeWorkout.exercises.length === 0 ? (
          <div className="flex flex-col items-center" style={{ paddingTop: '40px' }}>
            <p className="text-sm text-text-muted">Add your first exercise to get started</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {activeWorkout.exercises.map((exercise, exIndex) => (
              <div key={exIndex}>
                {/* Exercise Name */}
                <div className="flex items-center justify-between" style={{ marginBottom: '10px' }}>
                  <div>
                    <p className="text-sm font-bold text-text">{exercise.name}</p>
                    <p className="text-xs text-text-muted">{exercise.muscle} • {exercise.equipment}</p>
                  </div>
                </div>

                {/* Sets Table */}
                <div className="rounded-lg border border-border overflow-hidden">
                  {/* Header */}
                  <div className="grid bg-surface-lighter text-xs font-bold text-text-muted uppercase" style={{ gridTemplateColumns: '50px 1fr 1fr 1fr 44px', padding: '8px 12px' }}>
                    <span>Set</span>
                    <span>Previous</span>
                    <span>Kg</span>
                    <span>Reps</span>
                    <span />
                  </div>

                  {/* Sets */}
                  {exercise.sets.map((set, setIndex) => (
                    <div
                      key={setIndex}
                      className={`grid items-center border-t border-border ${set.completed ? "bg-emerald-500/8" : ""}`}
                      style={{ gridTemplateColumns: '50px 1fr 1fr 1fr 44px', padding: '6px 12px' }}
                    >
                      <span className="text-xs font-bold text-text-muted">{setIndex + 1}</span>
                      <span className="text-xs text-text-muted/50">—</span>
                      <input
                        type="number"
                        value={set.weight}
                        onChange={(e) => updateSet(exIndex, setIndex, "weight", e.target.value)}
                        placeholder="0"
                        className="w-full bg-transparent text-sm text-text font-medium focus:outline-none"
                        style={{ maxWidth: '60px' }}
                      />
                      <input
                        type="number"
                        value={set.reps}
                        onChange={(e) => updateSet(exIndex, setIndex, "reps", e.target.value)}
                        placeholder="0"
                        className="w-full bg-transparent text-sm text-text font-medium focus:outline-none"
                        style={{ maxWidth: '60px' }}
                      />
                      <div className="flex items-center" style={{ gap: '4px' }}>
                        <button
                          onClick={() => completeSet(exIndex, setIndex)}
                          className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                            set.completed ? "bg-emerald-500 text-white" : "border border-border text-text-muted hover:border-emerald-400"
                          }`}
                        >
                          {set.completed && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        </button>
                        <button onClick={() => deleteSet(exIndex, setIndex)} className="text-text-muted/30 hover:text-red-400 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Set Button */}
                <button
                  onClick={() => addSet(exIndex)}
                  className="w-full text-xs text-text-muted hover:text-primary-light border border-border border-dashed rounded-lg hover:border-primary/30 transition-colors"
                  style={{ padding: '8px', marginTop: '6px' }}
                >
                  + Add Set
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Exercise Button */}
        <button
          onClick={() => setShowExercisePicker(true)}
          className="w-full text-sm font-medium text-primary-light border border-primary/30 border-dashed rounded-xl hover:bg-primary/5 transition-colors"
          style={{ padding: '14px', marginTop: '20px' }}
        >
          + Add Exercise
        </button>
      </div>

      {/* Exercise Picker Modal */}
      {showExercisePicker && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50" style={{ padding: '40px' }}>
          <div className="bg-surface-light border border-border rounded-2xl w-full max-w-md max-h-[70vh] flex flex-col overflow-hidden">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
                <h3 className="text-base font-bold text-text">Add Exercise</h3>
                <button onClick={() => setShowExercisePicker(false)} className="text-text-muted hover:text-text">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search exercises..."
                className="w-full bg-surface-lighter border border-border rounded-lg text-sm text-text placeholder-text-muted/50 focus:outline-none focus:border-primary/50"
                style={{ height: '36px', padding: '0 12px', marginBottom: '10px' }}
                autoFocus
              />
              <div className="flex flex-wrap" style={{ gap: '4px' }}>
                <button
                  onClick={() => setFilterMuscle("")}
                  className={`text-xs rounded-md transition-colors ${!filterMuscle ? "bg-primary text-white" : "bg-surface-lighter text-text-muted hover:text-text"}`}
                  style={{ padding: '4px 10px' }}
                >All</button>
                {MUSCLE_GROUPS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setFilterMuscle(m)}
                    className={`text-xs rounded-md transition-colors ${filterMuscle === m ? "bg-primary text-white" : "bg-surface-lighter text-text-muted hover:text-text"}`}
                    style={{ padding: '4px 10px' }}
                  >{m}</button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto" style={{ padding: '8px' }}>
              {filteredExercises.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => addExercise(ex)}
                  className="w-full flex items-center text-left rounded-lg hover:bg-surface-lighter transition-colors"
                  style={{ padding: '10px 12px', gap: '12px' }}
                >
                  <div className="w-8 h-8 rounded-lg bg-rose-500/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-rose-400">{ex.muscle[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text">{ex.name}</p>
                    <p className="text-xs text-text-muted">{ex.muscle} • {ex.equipment}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <VoiceInput onSend={onSend} isLoading={isLoading} placeholder='Say "Add bench press 80kg 3 sets of 8"' clarification={clarification} />
    </div>
  );
}

export default WorkoutsTab;
