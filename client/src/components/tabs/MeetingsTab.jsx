import { useState, useRef, useEffect } from "react";
import VoiceInput from "../VoiceInput";
import ConfirmModal from "../ConfirmModal";
import { createEventManual, deleteEventById, updateEventById } from "../../services/api";

function formatTime(time) {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m || "00"} ${ampm}`;
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function formatDateDisplay(dateStr) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function MeetingsTab({ meetings, setMeetings, onSend, isLoading, clarification, onAdd, onUpdate, onRemove }) {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [dateOffset, setDateOffset] = useState(0);
  const dateScrollRef = useRef(null);
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [formData, setFormData] = useState({ title: "", date: getToday(), startTime: "09:00", endTime: "10:00", description: "" });
  const [formLoading, setFormLoading] = useState(false);

  const dayMeetings = meetings.filter((m) => m.effectiveDate === selectedDate);

  const dates = Array.from({ length: 15 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + dateOffset * 15);
    return d.toISOString().split("T")[0];
  });

  // Auto-scroll date picker
  useEffect(() => {
    if (dateScrollRef.current) {
      const active = dateScrollRef.current.querySelector('[data-active="true"]');
      if (active) active.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }
  }, [selectedDate, dateOffset]);

  const resetForm = () => {
    setFormData({ title: "", date: getToday(), startTime: "09:00", endTime: "10:00", description: "" });
    setShowForm(false);
    setEditIndex(null);
  };

  const handleManualCreate = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    setFormLoading(true);
    try {
      const result = await createEventManual(formData);
      const newMeeting = {
        type: "calendar_event",
        effectiveDate: formData.date,
        payload: { title: formData.title, startTime: formData.startTime, endTime: formData.endTime, description: formData.description },
        executionResult: result,
      };
      setMeetings((prev) => [newMeeting, ...prev]);
      resetForm();
    } catch (err) {
      alert(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (globalIndex) => {
    const meeting = meetings[globalIndex];
    setFormData({
      title: meeting.payload?.title || "",
      date: meeting.effectiveDate,
      startTime: meeting.payload?.startTime || "09:00",
      endTime: meeting.payload?.endTime || "10:00",
      description: meeting.payload?.description || "",
    });
    setEditIndex(globalIndex);
    setShowForm(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (editIndex === null) return;
    setFormLoading(true);
    try {
      const meeting = meetings[editIndex];
      const eventId = meeting.executionResult?.eventId;
      if (eventId) {
        await updateEventById(eventId, formData);
      }
      setMeetings((prev) =>
        prev.map((m, i) =>
          i === editIndex
            ? { ...m, effectiveDate: formData.date, payload: { ...m.payload, title: formData.title, startTime: formData.startTime, endTime: formData.endTime, description: formData.description } }
            : m
        )
      );
      resetForm();
    } catch (err) {
      alert("Failed to update: " + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (globalIndex) => {
    setDeleteIndex(globalIndex);
  };

  const confirmDelete = async () => {
    const meeting = meetings[deleteIndex];
    if (meeting?.id) await onRemove("meetings", meeting.id);
    else setMeetings((prev) => prev.filter((_, i) => i !== deleteIndex));
    setDeleteIndex(null);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div style={{ padding: '20px 20px', borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
          <div>
            <h2 className="text-xl font-bold text-text">Meetings</h2>
            <p className="text-sm text-text-muted" style={{ marginTop: '4px' }}>{formatDateDisplay(selectedDate)}</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors"
            style={{ padding: '8px 16px' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Meeting
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
              const isToday = date === getToday();
              return (
                <button key={date} data-active={isActive} onClick={() => setSelectedDate(date)} className={`flex flex-col items-center rounded-lg transition-all flex-shrink-0 ${isActive ? "bg-primary text-white" : "bg-surface-lighter text-text-muted hover:text-text"}`} style={{ padding: '6px 8px', minWidth: '40px' }}>
                  <span className="text-[10px] font-medium uppercase">{d.toLocaleDateString("en", { weekday: "short" })}</span>
                  <span className={`text-sm font-bold ${!isActive && isToday ? "text-primary-light" : ""}`} style={{ marginTop: '1px' }}>{d.getDate()}</span>
                </button>
              );
            })}
          </div>
          <button onClick={() => setDateOffset((o) => o + 1)} className="text-text-muted hover:text-text flex-shrink-0" style={{ padding: '4px' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div style={{ padding: '20px 20px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-light)' }}>
          <h3 className="text-sm font-bold text-text" style={{ marginBottom: '14px' }}>
            {editIndex !== null ? "Edit Meeting" : "New Meeting"}
          </h3>
          <form onSubmit={editIndex !== null ? handleUpdate : handleManualCreate}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
              {/* Title */}
              <div>
                <label className="text-xs text-text-muted font-medium" style={{ display: 'block', marginBottom: '4px' }}>
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Meeting with..."
                  className="w-full bg-surface-lighter border border-border rounded-lg text-sm text-text placeholder-text-muted/50 focus:outline-none focus:border-primary/50"
                  style={{ height: '38px', padding: '0 12px' }}
                  required
                />
              </div>

              {/* Date + Time row */}
              <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: '10px' }}>
                <div>
                  <label className="text-xs text-text-muted font-medium" style={{ display: 'block', marginBottom: '4px' }}>
                    Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-surface-lighter border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary/50"
                    style={{ height: '38px', padding: '0 10px' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-text-muted font-medium" style={{ display: 'block', marginBottom: '4px' }}>
                    Start <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full bg-surface-lighter border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary/50"
                    style={{ height: '38px', padding: '0 10px' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-text-muted font-medium" style={{ display: 'block', marginBottom: '4px' }}>End</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full bg-surface-lighter border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary/50"
                    style={{ height: '38px', padding: '0 10px' }}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-text-muted font-medium" style={{ display: 'block', marginBottom: '4px' }}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add meeting notes, agenda, links..."
                  className="w-full bg-surface-lighter border border-border rounded-lg text-sm text-text placeholder-text-muted/50 focus:outline-none focus:border-primary/50 resize-none"
                  style={{ padding: '10px 12px', minHeight: '72px' }}
                />
              </div>
            </div>

            <div className="flex justify-end" style={{ gap: '8px' }}>
              <button
                type="button"
                onClick={resetForm}
                className="text-sm text-text-muted hover:text-text rounded-lg border border-border"
                style={{ padding: '7px 14px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="text-sm text-white bg-primary hover:bg-primary-dark disabled:opacity-50 rounded-lg font-medium"
                style={{ padding: '7px 14px' }}
              >
                {formLoading ? "Saving..." : editIndex !== null ? "Save Changes" : "Create Meeting"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Meetings List */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '20px 20px' }}>
        {dayMeetings.length === 0 && !showForm ? (
          <div className="flex flex-col items-center justify-center" style={{ paddingTop: '60px' }}>
            <div className="rounded-full bg-surface-lighter border border-border flex items-center justify-center" style={{ width: '56px', height: '56px', marginBottom: '16px' }}>
              <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-text-muted font-medium">No meetings on this day</p>
            <p className="text-xs text-text-muted/50" style={{ marginTop: '6px' }}>
              Click "New Meeting" or say "Meeting with team at 3pm"
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {dayMeetings
              .sort((a, b) => (a.payload?.startTime || "").localeCompare(b.payload?.startTime || ""))
              .map((meeting) => {
                const globalIndex = meetings.indexOf(meeting);
                return (
                  <div
                    key={globalIndex}
                    className="group rounded-xl border border-blue-500/20 bg-blue-500/8"
                    style={{ padding: '16px 20px' }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center" style={{ gap: '10px', marginBottom: '6px' }}>
                          <span className="text-xs font-bold text-blue-400">
                            {formatTime(meeting.payload?.startTime)}
                            {meeting.payload?.endTime && ` — ${formatTime(meeting.payload.endTime)}`}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-text">{meeting.payload?.title || "Meeting"}</p>
                        {meeting.payload?.description && (
                          <p className="text-xs text-text-muted" style={{ marginTop: '4px', lineHeight: '1.5' }}>
                            {meeting.payload.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center" style={{ gap: '6px' }}>
                        {meeting.executionResult?.link && (
                          <a
                            href={meeting.executionResult.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary-light hover:text-primary font-medium"
                          >
                            Open ↗
                          </a>
                        )}
                        {/* Edit */}
                        <button
                          onClick={() => handleEdit(globalIndex)}
                          className="opacity-100 text-text-muted hover:text-blue-400 transition-all rounded-md"
                          style={{ padding: '4px' }}
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(globalIndex)}
                          className="opacity-100 text-text-muted hover:text-red-400 transition-all rounded-md"
                          style={{ padding: '4px' }}
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      <VoiceInput onSend={onSend} isLoading={isLoading} placeholder='Say "Meeting with client tomorrow at 3pm"' clarification={clarification} />

      <ConfirmModal
        open={deleteIndex !== null}
        title="Delete Meeting"
        message="Are you sure you want to delete this meeting? This cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteIndex(null)}
      />
    </div>
  );
}

export default MeetingsTab;
