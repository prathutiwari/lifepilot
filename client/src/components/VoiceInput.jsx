import { useState, useEffect } from "react";
import useSpeechRecognition from "../hooks/useSpeechRecognition";

function VoiceInput({ onSend, isLoading, placeholder, clarification }) {
  const [message, setMessage] = useState("");
  const { isListening, transcript, startListening, stopListening } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) setMessage(transcript);
  }, [transcript]);

  useEffect(() => {
    if (!isListening && transcript) {
      const trimmed = transcript.trim();
      if (trimmed) {
        onSend(trimmed);
        setMessage("");
      }
    }
  }, [isListening]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setMessage("");
  };

  return (
    <div className="flex-shrink-0 border-t border-border bg-surface-light" style={{ padding: '12px 10px' }}>
      {/* Clarification message from AI */}
      {clarification && (
        <div
          className="flex items-start gap-2 rounded-lg bg-primary/10 border border-primary/20"
          style={{ padding: '10px 14px', marginBottom: '10px' }}
        >
          <svg className="w-4 h-4 text-primary-light flex-shrink-0" style={{ marginTop: '1px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-primary-light">{clarification.message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center" style={{ gap: '10px' }}>
        <button
          type="button"
          onClick={isListening ? stopListening : startListening}
          disabled={isLoading}
          className={`flex-shrink-0 flex items-center justify-center rounded-full transition-all ${
            isListening
              ? "bg-red-500 text-white shadow-lg shadow-red-500/25 animate-pulse"
              : "bg-surface-lighter border border-border text-text-muted hover:text-text hover:border-text-muted/40"
          }`}
          style={{ width: '40px', height: '40px' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>

        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={clarification ? "Answer the question above..." : (isListening ? "Listening..." : placeholder)}
          disabled={isLoading}
          className={`flex-1 bg-surface-lighter border rounded-lg text-sm text-text placeholder-text-muted/50 focus:outline-none focus:border-primary/50 disabled:opacity-50 transition-colors ${
            clarification ? "border-primary/30" : "border-border"
          }`}
          style={{ height: '40px', padding: '0 14px' }}
          autoFocus={!!clarification}
        />

        <button
          type="submit"
          disabled={isLoading || !message.trim()}
          className="flex-shrink-0 rounded-full bg-primary hover:bg-primary-dark disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
          style={{ width: '40px', height: '40px' }}
        >
          {isLoading ? (
            <div className="flex" style={{ gap: '2px' }}>
              <span className="typing-dot rounded-full bg-white" style={{ width: '4px', height: '4px' }} />
              <span className="typing-dot rounded-full bg-white" style={{ width: '4px', height: '4px' }} />
              <span className="typing-dot rounded-full bg-white" style={{ width: '4px', height: '4px' }} />
            </div>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </form>

      {isListening && (
        <p className="text-center text-xs text-red-400 animate-pulse" style={{ marginTop: '6px' }}>
          🎙️ Listening...
        </p>
      )}
    </div>
  );
}

export default VoiceInput;
