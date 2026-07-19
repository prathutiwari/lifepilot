import { useState, useRef, useCallback, useEffect } from "react";
import VoiceInput from "../VoiceInput";
import ConfirmModal from "../ConfirmModal";

function FormatToolbar({ onFormat }) {
  return (
    <div className="flex items-center flex-wrap border-b border-border" style={{ padding: '8px 12px', gap: '2px' }}>
      <button type="button" onClick={() => onFormat("bold")} className="text-text-muted hover:text-text hover:bg-surface-lighter rounded" style={{ padding: '4px 8px' }} title="Bold">
        <span className="text-xs font-bold">B</span>
      </button>
      <button type="button" onClick={() => onFormat("italic")} className="text-text-muted hover:text-text hover:bg-surface-lighter rounded" style={{ padding: '4px 8px' }} title="Italic">
        <span className="text-xs italic">I</span>
      </button>
      <button type="button" onClick={() => onFormat("underline")} className="text-text-muted hover:text-text hover:bg-surface-lighter rounded" style={{ padding: '4px 8px' }} title="Underline">
        <span className="text-xs underline">U</span>
      </button>
      <button type="button" onClick={() => onFormat("strikeThrough")} className="text-text-muted hover:text-text hover:bg-surface-lighter rounded" style={{ padding: '4px 8px' }} title="Strikethrough">
        <span className="text-xs line-through">S</span>
      </button>
      <div className="w-px bg-border" style={{ height: '16px', margin: '0 4px' }} />
      <button type="button" onClick={() => onFormat("formatBlock", "H2")} className="text-text-muted hover:text-text hover:bg-surface-lighter rounded" style={{ padding: '4px 8px' }} title="Heading">
        <span className="text-xs font-bold">H</span>
      </button>
      <button type="button" onClick={() => onFormat("formatBlock", "P")} className="text-text-muted hover:text-text hover:bg-surface-lighter rounded" style={{ padding: '4px 8px' }} title="Paragraph">
        <span className="text-xs">¶</span>
      </button>
      <div className="w-px bg-border" style={{ height: '16px', margin: '0 4px' }} />
      <button type="button" onClick={() => onFormat("insertUnorderedList")} className="text-text-muted hover:text-text hover:bg-surface-lighter rounded" style={{ padding: '4px 8px' }} title="Bullet List">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>
      <button type="button" onClick={() => onFormat("insertOrderedList")} className="text-text-muted hover:text-text hover:bg-surface-lighter rounded" style={{ padding: '4px 8px' }} title="Numbered List">
        <span className="text-xs">1.</span>
      </button>
      <div className="w-px bg-border" style={{ height: '16px', margin: '0 4px' }} />
      <button type="button" onClick={() => onFormat("formatBlock", "BLOCKQUOTE")} className="text-text-muted hover:text-text hover:bg-surface-lighter rounded" style={{ padding: '4px 8px' }} title="Quote">
        <span className="text-xs">&ldquo;</span>
      </button>
      <button type="button" onClick={() => onFormat("insertHorizontalRule")} className="text-text-muted hover:text-text hover:bg-surface-lighter rounded" style={{ padding: '4px 8px' }} title="Divider">
        <span className="text-xs">—</span>
      </button>
    </div>
  );
}

function NotesTab({ notes, setNotes, onSend, isLoading, clarification, onAdd, onUpdate, onRemove }) {
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [openIndex, setOpenIndex] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const editorRef = useRef(null);
  const createEditorRef = useRef(null);

  const updateNoteField = (index, field, value) => {
    const note = notes[index];
    const newPayload = { ...note.payload, [field]: value };
    setNotes((prev) => prev.map((n, i) => (i === index ? { ...n, payload: newPayload } : n)));
    if (note?.id) onUpdate("notes", note.id, { payload: newPayload });
  };

  const resetForm = () => { setFormTitle(""); setShowForm(false); };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formTitle.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const content = createEditorRef.current?.innerHTML || "";
      await onAdd("notes", {
        type: "note",
        effectiveDate: new Date().toISOString().split("T")[0],
        payload: { title: formTitle, content },
      });
      resetForm();
    } catch (error) {
      console.error("Failed to add note", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteNote = (index) => setDeleteIndex(index);
  const confirmDelete = async () => {
    const item = notes[deleteIndex];
    if (item?.id) await onRemove("notes", item.id);
    else setNotes((prev) => prev.filter((_, i) => i !== deleteIndex));
    setDeleteIndex(null);
    if (openIndex === deleteIndex) { setOpenIndex(null); setIsEditing(false); }
  };

  // Format command for any contentEditable
  const execFormat = useCallback((command, value = null) => {
    document.execCommand(command, false, value);
  }, []);

  // Load content into popup editor when switching to edit mode
  useEffect(() => {
    if (isEditing && openIndex !== null && editorRef.current) {
      editorRef.current.innerHTML = notes[openIndex]?.payload?.content || "";
      editorRef.current.focus();
    }
  }, [isEditing, openIndex]);

  const saveAndCloseEditor = () => {
    if (isEditing && openIndex !== null && editorRef.current) {
      updateNoteField(openIndex, "content", editorRef.current.innerHTML);
    }
    setIsEditing(false);
  };

  const closePopup = () => {
    if (isEditing && editorRef.current) {
      updateNoteField(openIndex, "content", editorRef.current.innerHTML);
    }
    setOpenIndex(null);
    setIsEditing(false);
  };

  const openNote = notes[openIndex] || null;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div style={{ padding: '20px 20px', borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-text">Notes</h2>
            <p className="text-sm text-text-muted" style={{ marginTop: '4px' }}>{notes.length} note{notes.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors" style={{ padding: '8px 16px' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            New Note
          </button>
        </div>
      </div>

      {/* Create Form with rich editor */}
      {showForm && (
        <div style={{ padding: '20px 20px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-light)' }}>
          <form onSubmit={handleAdd}>
            <div style={{ marginBottom: '10px' }}>
              <label className="text-xs text-text-muted font-medium" style={{ display: 'block', marginBottom: '4px' }}>Title <span className="text-red-400">*</span></label>
              <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Note title..." className="w-full bg-surface-lighter border border-border rounded-lg text-sm text-text placeholder-text-muted/50 focus:outline-none focus:border-primary/50" style={{ height: '38px', padding: '0 12px' }} required autoFocus />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label className="text-xs text-text-muted font-medium" style={{ display: 'block', marginBottom: '4px' }}>Content</label>
              <div className="rounded-lg border border-border overflow-hidden">
                <FormatToolbar onFormat={(cmd, val) => { document.execCommand(cmd, false, val); createEditorRef.current?.focus(); }} />
                <div
                  ref={createEditorRef}
                  contentEditable
                  className="text-sm text-text focus:outline-none note-editor"
                  style={{ padding: '12px', minHeight: '100px', lineHeight: '1.6' }}
                  data-placeholder="Write your note..."
                />
              </div>
            </div>
            <div className="flex justify-end" style={{ gap: '8px' }}>
              <button type="button" onClick={resetForm} disabled={isSubmitting} className="text-sm text-text-muted hover:text-text rounded-lg border border-border disabled:opacity-50 disabled:cursor-not-allowed" style={{ padding: '7px 14px' }}>Cancel</button>
              <button type="submit" disabled={isSubmitting} className="text-sm text-white bg-primary hover:bg-primary-dark rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed" style={{ padding: '7px 14px' }}>{isSubmitting ? "Saving..." : "Save Note"}</button>
            </div>
          </form>
        </div>
      )}

      {/* Notes Grid */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '20px 20px' }}>
        {notes.length === 0 && !showForm ? (
          <div className="flex flex-col items-center justify-center" style={{ paddingTop: '60px' }}>
            <div className="rounded-full bg-surface-lighter border border-border flex items-center justify-center" style={{ width: '56px', height: '56px', marginBottom: '16px' }}>
              <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </div>
            <p className="text-sm text-text-muted font-medium">No notes yet</p>
            <p className="text-xs text-text-muted/50" style={{ marginTop: '6px' }}>Say &ldquo;Note: remember to call mom&rdquo;</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '10px' }}>
            {notes.map((note, i) => (
              <div
                key={i}
                className="group rounded-xl border border-border bg-surface-lighter cursor-pointer hover:border-primary/30 transition-colors relative"
                style={{ padding: '14px 18px' }}
                onClick={() => { setOpenIndex(i); setIsEditing(false); }}
              >
                <p className="text-sm font-medium text-text">{note.payload?.title || "Untitled"}</p>
                <p className="text-xs text-text-muted/50" style={{ marginTop: '6px' }}>{note.effectiveDate}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteNote(i); }}
                  className="absolute top-3 right-3 opacity-100 text-text-muted hover:text-red-400 transition-all"
                  style={{ padding: '2px' }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <VoiceInput onSend={onSend} isLoading={isLoading} placeholder='Say "Note: API deadline is next Friday"' clarification={clarification} />

      {/* Note View/Edit Popup */}
      {openIndex !== null && openNote && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50" style={{ padding: '30px' }}>
          <div className="bg-surface-light border border-border rounded-2xl w-full max-w-lg flex flex-col overflow-hidden" style={{ maxHeight: '80vh' }}>
            {/* Popup Header */}
            <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
              {isEditing ? (
                <input
                  type="text"
                  value={openNote.payload?.title || ""}
                  onChange={(e) => updateNoteField(openIndex, "title", e.target.value)}
                  placeholder="Note title..."
                  className="flex-1 bg-transparent text-base font-bold text-text focus:outline-none"
                  style={{ padding: '0', marginRight: '12px' }}
                />
              ) : (
                <h3 className="flex-1 text-base font-bold text-text" style={{ marginRight: '12px' }}>{openNote.payload?.title || "Untitled"}</h3>
              )}
              <div className="flex items-center" style={{ gap: '6px' }}>
                <span className="text-xs text-text-muted">{openNote.effectiveDate}</span>
                {isEditing ? (
                  <button onClick={saveAndCloseEditor} className="text-xs text-emerald-400 hover:text-emerald-300 font-medium border border-emerald-500/30 rounded-lg transition-colors" style={{ padding: '5px 10px' }}>
                    Done
                  </button>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="text-xs text-primary-light hover:text-primary font-medium border border-primary/30 rounded-lg transition-colors" style={{ padding: '5px 10px' }}>
                    Edit
                  </button>
                )}
                <button onClick={closePopup} className="text-text-muted hover:text-text" style={{ padding: '4px' }}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Edit mode: toolbar + editor */}
            {isEditing && (
              <>
                <FormatToolbar onFormat={(cmd, val) => { document.execCommand(cmd, false, val); editorRef.current?.focus(); }} />
                <div
                  ref={editorRef}
                  contentEditable
                  className="flex-1 overflow-y-auto text-sm text-text focus:outline-none note-editor"
                  style={{ padding: '16px 20px', minHeight: '200px', lineHeight: '1.7' }}
                  onBlur={() => { if (openIndex !== null && editorRef.current) updateNoteField(openIndex, "content", editorRef.current.innerHTML); }}
                  data-placeholder="Start writing..."
                />
              </>
            )}

            {/* View mode: rendered content */}
            {!isEditing && (
              <div className="flex-1 overflow-y-auto" style={{ padding: '16px 20px', minHeight: '200px' }}>
                {openNote.payload?.content ? (
                  <div
                    className="text-sm text-text note-editor"
                    style={{ lineHeight: '1.7' }}
                    dangerouslySetInnerHTML={{ __html: openNote.payload.content }}
                  />
                ) : (
                  <p className="text-sm text-text-muted/50 italic">No content yet. Click &ldquo;Edit&rdquo; to start writing.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        open={deleteIndex !== null}
        title="Delete Note"
        message="Are you sure you want to delete this note? This cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteIndex(null)}
      />
    </div>
  );
}

export default NotesTab;
