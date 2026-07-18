function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50" style={{ padding: '40px' }}>
      <div className="bg-surface-light border border-border rounded-2xl w-full max-w-xs overflow-hidden">
        <div style={{ padding: '20px 20px 0' }}>
          <h3 className="text-sm font-bold text-text">{title || "Confirm Delete"}</h3>
          <p className="text-xs text-text-muted" style={{ marginTop: '8px', lineHeight: '1.5' }}>
            {message || "Are you sure you want to delete this? This action cannot be undone."}
          </p>
        </div>
        <div className="flex justify-end" style={{ padding: '16px 20px', gap: '8px' }}>
          <button
            onClick={onCancel}
            className="text-sm text-text-muted hover:text-text rounded-lg border border-border transition-colors"
            style={{ padding: '7px 14px' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg font-medium transition-colors"
            style={{ padding: '7px 14px' }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
