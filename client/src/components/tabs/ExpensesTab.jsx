import { useState, useRef, useEffect } from "react";
import VoiceInput from "../VoiceInput";
import ConfirmModal from "../ConfirmModal";

const CATEGORIES = [
  { id: "food", label: "Food & Dining", emoji: "🍔" },
  { id: "transport", label: "Transport", emoji: "🚗" },
  { id: "shopping", label: "Shopping", emoji: "🛍️" },
  { id: "bills", label: "Bills & Utilities", emoji: "📄" },
  { id: "entertainment", label: "Entertainment", emoji: "🎬" },
  { id: "health", label: "Health", emoji: "💊" },
  { id: "education", label: "Education", emoji: "📚" },
  { id: "grocery", label: "Groceries", emoji: "🛒" },
  { id: "other", label: "Other", emoji: "📌" },
];

function ExpensesTab({ expenses, setExpenses, onSend, isLoading, clarification, onAdd, onUpdate, onRemove }) {
  const [showForm, setShowForm] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [dateOffset, setDateOffset] = useState(0);
  const dateScrollRef = useRef(null);
  const [formData, setFormData] = useState({ amount: "", category: "food", date: new Date().toISOString().split("T")[0] });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];

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

  // Filter expenses by selected date
  const dayExpenses = expenses.filter((e) => e.effectiveDate === selectedDate);
  const dayTotal = dayExpenses.reduce((sum, e) => sum + (e.payload?.amount || 0), 0);

  // Monthly total (same month as selected date)
  const selectedMonth = selectedDate.slice(0, 7);
  const monthExpenses = expenses.filter((e) => (e.effectiveDate || "").startsWith(selectedMonth));
  const monthTotal = monthExpenses.reduce((sum, e) => sum + (e.payload?.amount || 0), 0);

  const total = expenses.reduce((sum, e) => sum + (e.payload?.amount || 0), 0);

  const sanitizeNonNegativeValue = (value) => {
    if (value === "" || value === null || value === undefined) return "";
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return "";
    return Math.max(0, numericValue);
  };

  const updateExpenseField = (index, field, value) => {
    const item = expenses[index];
    const sanitizedValue = field === "amount" ? sanitizeNonNegativeValue(value) : value;
    const newPayload = { ...item.payload, [field]: sanitizedValue };
    if (field === "category") newPayload.title = getCategoryInfo(value).label;
    setExpenses((prev) => prev.map((e, i) => (i === index ? { ...e, payload: newPayload } : e)));
    if (item?.id) onUpdate("expenses", item.id, { payload: newPayload });
  };

  // Category breakdown (for selected month)
  const breakdown = monthExpenses.reduce((acc, e) => {
    const cat = e.payload?.category || "other";
    acc[cat] = (acc[cat] || 0) + (e.payload?.amount || 0);
    return acc;
  }, {});

  const resetForm = () => { setFormData({ amount: "", category: "food", date: new Date().toISOString().split("T")[0] }); setShowForm(false); };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (formData.amount === "" || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const amount = sanitizeNonNegativeValue(formData.amount);
      const cat = getCategoryInfo(formData.category);
      await onAdd("expenses", {
        type: "expense",
        effectiveDate: formData.date,
        payload: { title: cat.label, amount: Number(amount), category: formData.category },
      });
      resetForm();
    } catch (error) {
      console.error("Failed to add expense", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteExpense = (index) => setDeleteIndex(index);
  const confirmDelete = async () => {
    const item = expenses[deleteIndex];
    if (item?.id) await onRemove("expenses", item.id);
    else setExpenses((prev) => prev.filter((_, i) => i !== deleteIndex));
    setDeleteIndex(null);
  };

  const getCategoryInfo = (catId) => CATEGORIES.find((c) => c.id === catId) || CATEGORIES[CATEGORIES.length - 1];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div style={{ padding: '20px 20px', borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
          <div>
            <h2 className="text-xl font-bold text-text">Expenses</h2>
            <p className="text-sm text-text-muted" style={{ marginTop: '4px' }}>
              Today: ₹{dayTotal.toLocaleString()} · Month: ₹{monthTotal.toLocaleString()}
            </p>
          </div>
          <div className="flex items-center" style={{ gap: '8px' }}>
            {monthExpenses.length > 0 && (
              <button onClick={() => setShowBreakdown(true)} className="flex items-center gap-1 text-xs text-text-muted hover:text-amber-400 border border-border rounded-lg transition-colors" style={{ padding: '7px 12px' }}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                Monthly
              </button>
            )}
            <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors" style={{ padding: '8px 16px' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Add
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

      {showForm && (
        <div style={{ padding: '20px 20px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-light)' }}>
          <form onSubmit={handleAdd}>
            <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: '10px', marginBottom: '12px' }}>
              <div>
                <label className="text-xs text-text-muted font-medium" style={{ display: 'block', marginBottom: '4px' }}>Category <span className="text-red-400">*</span></label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full bg-surface-lighter border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary/50" style={{ height: '38px', padding: '0 10px' }}>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.emoji} {cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-text-muted font-medium" style={{ display: 'block', marginBottom: '4px' }}>Amount ₹ <span className="text-red-400">*</span></label>
                <input type="number" min="0" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: sanitizeNonNegativeValue(e.target.value) })} placeholder="500" className="w-full bg-surface-lighter border border-border rounded-lg text-sm text-text placeholder-text-muted/50 focus:outline-none focus:border-primary/50" style={{ height: '38px', padding: '0 12px' }} required autoFocus />
              </div>
              <div>
                <label className="text-xs text-text-muted font-medium" style={{ display: 'block', marginBottom: '4px' }}>Date</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full bg-surface-lighter border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary/50" style={{ height: '38px', padding: '0 10px' }} />
              </div>
            </div>
            <div className="flex justify-end" style={{ gap: '8px' }}>
              <button type="button" onClick={resetForm} disabled={isSubmitting} className="text-sm text-text-muted hover:text-text rounded-lg border border-border disabled:opacity-50 disabled:cursor-not-allowed" style={{ padding: '7px 14px' }}>Cancel</button>
              <button type="submit" disabled={isSubmitting} className="text-sm text-white bg-primary hover:bg-primary-dark rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed" style={{ padding: '7px 14px' }}>{isSubmitting ? "Adding..." : "Add Expense"}</button>
            </div>
          </form>
        </div>
      )}

      <div className="flex-1 overflow-y-auto" style={{ padding: '20px 20px' }}>
        {dayExpenses.length === 0 && !showForm ? (
          <div className="flex flex-col items-center justify-center" style={{ paddingTop: '60px' }}>
            <div className="rounded-full bg-surface-lighter border border-border flex items-center justify-center" style={{ width: '56px', height: '56px', marginBottom: '16px' }}>
              <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-sm text-text-muted font-medium">No expenses on this day</p>
            <p className="text-xs text-text-muted/50" style={{ marginTop: '6px' }}>Click "Add" or say "Spent 500 on dinner"</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {dayExpenses.map((exp) => {
              const i = expenses.indexOf(exp);
              const isEditing = editingIndex === i;
              return (
                <div key={i} className="group flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/8" style={{ padding: '14px 18px' }}>
                  <div className="flex items-center" style={{ gap: '12px' }}>
                    <span className="text-lg">{getCategoryInfo(exp.payload?.category).emoji}</span>
                    <div>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <select
                            value={exp.payload?.category || "other"}
                            onChange={(e) => updateExpenseField(i, "category", e.target.value)}
                            className="bg-transparent text-sm text-text border-b border-amber-500/30 focus:outline-none focus:border-primary"
                            style={{ padding: '1px 0' }}
                          >
                            {CATEGORIES.map((cat) => (
                              <option key={cat.id} value={cat.id}>{cat.emoji} {cat.label}</option>
                            ))}
                          </select>
                          <span className="text-sm text-text-muted">₹</span>
                          <input
                            type="number"
                            min="0"
                            value={exp.payload?.amount || ""}
                            onChange={(e) => updateExpenseField(i, "amount", e.target.value)}
                            className="bg-transparent text-sm font-bold text-amber-400 border-b border-amber-500/30 focus:outline-none focus:border-primary"
                            style={{ width: '70px', padding: '1px 0' }}
                          />
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-text">{getCategoryInfo(exp.payload?.category).label}</p>
                          <p className="text-xs text-text-muted" style={{ marginTop: '2px' }}>{exp.effectiveDate}</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center" style={{ gap: '8px' }}>
                    {!isEditing && <p className="text-sm font-bold text-amber-400">₹{exp.payload?.amount || 0}</p>}
                    {exp.executionResult?.link && <a href={exp.executionResult.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-light">Open ↗</a>}
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
                    <button onClick={() => deleteExpense(i)} className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400 transition-all" style={{ padding: '4px' }}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <VoiceInput onSend={onSend} isLoading={isLoading} placeholder='Say "Spent 300 on groceries"' clarification={clarification} />

      {/* Category Breakdown Popup */}
      {showBreakdown && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50" style={{ padding: '40px' }}>
          <div className="bg-surface-light border border-border rounded-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
              <h3 className="text-base font-bold text-text">Monthly Breakdown</h3>
              <button onClick={() => setShowBreakdown(false)} className="text-text-muted hover:text-text">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div style={{ padding: '24px 20px' }}>
              {/* Donut Chart */}
              <div className="flex items-center justify-center" style={{ marginBottom: '24px' }}>
                <div style={{ position: 'relative', width: '160px', height: '160px' }}>
                  <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                    {(() => {
                      const colors = ["#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#10b981", "#f97316", "#ec4899", "#6366f1", "#64748b"];
                      const entries = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
                      let offset = 0;
                      return entries.map(([catId, amount], idx) => {
                        const percent = monthTotal > 0 ? (amount / monthTotal) * 100 : 0;
                        const dash = percent;
                        const gap = 100 - dash;
                        const segment = (
                          <circle
                            key={catId}
                            cx="18" cy="18" r="15.9"
                            fill="none"
                            stroke={colors[idx % colors.length]}
                            strokeWidth="3.5"
                            strokeDasharray={`${dash} ${gap}`}
                            strokeDashoffset={-offset}
                            strokeLinecap="round"
                          />
                        );
                        offset += dash;
                        return segment;
                      });
                    })()}
                  </svg>
                  {/* Center total */}
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="text-xs text-text-muted">This Month</span>
                    <span className="text-lg font-bold text-amber-400">₹{monthTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(() => {
                  const colors = ["#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#10b981", "#f97316", "#ec4899", "#6366f1", "#64748b"];
                  return Object.entries(breakdown)
                    .sort((a, b) => b[1] - a[1])
                    .map(([catId, amount], idx) => {
                      const cat = getCategoryInfo(catId);
                      const percent = monthTotal > 0 ? Math.round((amount / monthTotal) * 100) : 0;
                      return (
                        <div key={catId} className="flex items-center justify-between">
                          <div className="flex items-center" style={{ gap: '8px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: colors[idx % colors.length] }} />
                            <span className="text-sm text-text">{cat.emoji} {cat.label}</span>
                          </div>
                          <span className="text-sm font-medium text-text-muted">₹{amount.toLocaleString()} <span className="text-xs">({percent}%)</span></span>
                        </div>
                      );
                    });
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={deleteIndex !== null}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteIndex(null)}
      />
    </div>
  );
}

export default ExpensesTab;
