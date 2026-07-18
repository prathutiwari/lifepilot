import { useState, useEffect, useRef } from "react";
import { fetchInsights } from "../services/api";

function AiInsights() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState(null);
  const panelRef = useRef(null);

  const loadInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchInsights();
      setInsights(data);
    } catch (err) {
      setError("Couldn't load insights right now");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const lastFetch = localStorage.getItem("lifepilot_insights_date");
    const cachedInsights = localStorage.getItem("lifepilot_insights");
    const today = new Date().toISOString().split("T")[0];

    if (lastFetch === today && cachedInsights) {
      try {
        setInsights(JSON.parse(cachedInsights));
      } catch {
        loadInsights();
      }
    } else {
      loadInsights();
    }
  }, []);

  useEffect(() => {
    if (insights) {
      const today = new Date().toISOString().split("T")[0];
      localStorage.setItem("lifepilot_insights_date", today);
      localStorage.setItem("lifepilot_insights", JSON.stringify(insights));
    }
  }, [insights]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <>
      {/* Floating AI button — fixed position */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`fixed z-50 flex items-center justify-center rounded-full shadow-lg transition-all ${
          open
            ? "bg-primary text-white shadow-primary/30"
            : "bg-gradient-to-br from-primary to-purple-600 text-white shadow-primary/25 hover:shadow-primary/40 hover:scale-105"
        }`}
        style={{
          width: '44px',
          height: '44px',
          bottom: '150px',
          right: '16px',
        }}
        title="AI Insights"
      >
        {loading ? (
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
        )}
      </button>

      {/* Insights panel */}
      {open && (
        <div
          ref={panelRef}
          className="fixed z-50 bg-surface-light border border-border rounded-2xl shadow-2xl"
          style={{
            bottom: '132px',
            right: '16px',
            width: 'min(340px, calc(100vw - 32px))',
            maxHeight: '70vh',
            overflow: 'auto',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border" style={{ padding: '12px 16px' }}>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              <span className="text-sm font-semibold text-text">AI Insights</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={loadInsights}
                disabled={loading}
                className="text-text-muted/60 hover:text-primary transition-colors"
                style={{ padding: '4px' }}
                title="Refresh"
              >
                <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-text-muted/60 hover:text-text-muted transition-colors"
                style={{ padding: '4px' }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '14px 16px' }}>
            {loading && !insights && (
              <div className="animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="h-3 w-full bg-primary/10 rounded" />
                <div className="h-3 w-3/4 bg-primary/10 rounded" />
                <div className="h-3 w-1/2 bg-primary/10 rounded" />
              </div>
            )}

            {error && !insights && (
              <p className="text-sm text-text-muted">{error}</p>
            )}

            {insights && (
              <>
                <p className="text-sm text-text leading-relaxed">{insights.summary}</p>

                {insights.tips && insights.tips.length > 0 && (
                  <>
                    <button
                      onClick={() => setExpanded((e) => !e)}
                      className="text-xs text-primary hover:text-primary-light transition-colors font-medium"
                      style={{ marginTop: '12px' }}
                    >
                      {expanded ? "Hide tips" : `${insights.tips.length} tips for you`}
                      <svg className={`inline-block w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`} style={{ marginLeft: '4px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {expanded && (
                      <ul style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {insights.tips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-text-muted leading-relaxed">
                            <span className="text-primary font-bold flex-shrink-0" style={{ marginTop: '1px' }}>•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default AiInsights;
