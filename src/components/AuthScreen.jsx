import { useState } from "react";
import { AuthService } from "../services/auth.js";

export default function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const result =
        mode === "login"
          ? await AuthService.login(form.email, form.password)
          : await AuthService.register(form.name, form.email, form.password);
      onLogin(result.user);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">💸</div>
          <div className="auth-logo-text">SmartBudget</div>
        </div>

        <div className="auth-title">{mode === "login" ? "Welcome back" : "Get started"}</div>
        <div className="auth-sub">
          {mode === "login" ? "Log in to your financial dashboard" : "Create your account — it's free"}
        </div>

        {error && <div className="error-msg">⚠️ {error}</div>}

        {mode === "register" && (
          <div className="field">
            <label>Full Name</label>
            <input
              placeholder="Alex Johnson"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              onKeyDown={handleKey}
            />
          </div>
        )}

        <div className="field">
          <label>Email</label>
          <input
            type="email"
            placeholder="you@email.com"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            onKeyDown={handleKey}
          />
        </div>

        <div className="field">
          <label>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            onKeyDown={handleKey}
          />
        </div>

        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading && <span className="loading-spin" />}
          {mode === "login" ? "Sign In" : "Create Account"}
        </button>

        <div className="auth-toggle">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
