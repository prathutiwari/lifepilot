import { getGoogleAuthUrl } from "../services/api";

function ConnectScreen() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-surface px-6">
      {/* Logo */}
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-xl shadow-primary/25">
        <svg
          className="w-12 h-12 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>

      {/* Title */}
      <h1 className="text-5xl font-bold text-text tracking-tight" style={{ marginTop: '40px' }}>
        LifePilot
      </h1>

      {/* Tagline */}
      <p className="text-xl text-primary-light font-semibold" style={{ marginTop: '16px' }}>
        Talk Once. Everything Gets Done.
      </p>

      {/* Description */}
      <p className="text-text-muted text-center max-w-md text-base leading-relaxed" style={{ marginTop: '20px' }}>
        One sentence. Multiple actions. Your calendar, tasks, expenses — all managed through natural conversation.
      </p>

      {/* Connect Button */}
      <a
        href={getGoogleAuthUrl()}
        style={{ marginTop: '48px', padding: '16px 32px' }}
        className="flex items-center gap-3 rounded-full bg-white text-gray-800 font-semibold text-base shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 hover:scale-105 transition-all duration-200 no-underline"
      >
        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Connect with Google
      </a>

      {/* Disclaimer */}
      <p className="text-xs text-text-muted/50 text-center max-w-xs leading-relaxed" style={{ marginTop: '32px' }}>
        We'll access your Calendar and Tasks to create events and reminders automatically.
      </p>
    </div>
  );
}

export default ConnectScreen;
