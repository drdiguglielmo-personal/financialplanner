import { useState, useEffect } from "react";
import { AuthService } from "./services/auth.js";
import AuthScreen from "./components/AuthScreen.jsx";
import Dashboard from "./components/Dashboard.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await AuthService.getSession();
        if (!cancelled && session) setUser(session.user);
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (checking)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          color: "var(--text2)",
        }}
      >
        <span className="loading-spin" /> Loading…
      </div>
    );

  if (!user) return <AuthScreen onLogin={setUser} />;
  return <Dashboard user={user} />;
}
