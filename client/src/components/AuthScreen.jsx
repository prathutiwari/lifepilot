import { useState } from "react";
import { signupUser, loginUser } from "../services/api";

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login"); // "login" or "signup"
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let result;
      if (mode === "signup") {
        result = await signupUser(form.name, form.email, form.password);
      } else {
        result = await loginUser(form.email, form.password);
      }
      onAuth(result.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-surface px-6">
      {/* Logo */}
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-xl shadow-primary/25">
        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>

      <h1 className="text-4xl font-bold text-text tracking-tight" style={{ marginTop: '32px' }}>
        LifePilot
      </h1>
      <p className="text-base text-primary-light font-semibold" style={{ marginTop: '10px' }}>
        {mode === "login" ? "Welcome back" : "Create your account"}
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm" style={{ marginTop: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {mode === "signup" && (
            <div>
              <label className="text-xs text-text-muted font-medium" style={{ display: 'block', marginBottom: '4px' }}>Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
                className="w-full bg-surface-lighter border border-border rounded-lg text-sm text-text placeholder-text-muted/50 focus:outline-none focus:border-primary/50"
                style={{ height: '42px', padding: '0 14px' }}
                required
              />
            </div>
          )}
          <div>
            <label className="text-xs text-text-muted font-medium" style={{ display: 'block', marginBottom: '4px' }}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              className="w-full bg-surface-lighter border border-border rounded-lg text-sm text-text placeholder-text-muted/50 focus:outline-none focus:border-primary/50"
              style={{ height: '42px', padding: '0 14px' }}
              required
            />
          </div>
          <div>
            <label className="text-xs text-text-muted font-medium" style={{ display: 'block', marginBottom: '4px' }}>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={mode === "signup" ? "Min 6 characters" : "Enter password"}
              className="w-full bg-surface-lighter border border-border rounded-lg text-sm text-text placeholder-text-muted/50 focus:outline-none focus:border-primary/50"
              style={{ height: '42px', padding: '0 14px' }}
              required
              minLength={mode === "signup" ? 6 : undefined}
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-400" style={{ marginTop: '12px' }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
          style={{ height: '42px', marginTop: '20px' }}
        >
          {loading ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
        </button>
      </form>

      {/* Toggle */}
      <p className="text-sm text-text-muted" style={{ marginTop: '24px' }}>
        {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
        <button
          onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
          className="text-primary-light hover:text-primary font-medium"
        >
          {mode === "login" ? "Sign up" : "Login"}
        </button>
      </p>
    </div>
  );
}

export default AuthScreen;
