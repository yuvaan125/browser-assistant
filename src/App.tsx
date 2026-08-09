import "./App.css";
import { useEffect, useState } from "react";
import { Settings as SettingsIcon } from "lucide-react";

import AssistantView from "./components/AssistantView";
import Settings from "./components/Settings";
import LoginScreen from "./components/LoginScreen";

import { getCurrentUser, onAuthStateChange, type OrbitUser } from "./auth/session";

export default function App() {
  const [user, setUser] = useState<OrbitUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<"assistant" | "settings">(
    "assistant"
  );

  useEffect(() => {
    getCurrentUser().then((user) => {
      setUser(user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title-group">
          <img
            src="/icons/icon48.png"
            alt="Orbit AI"
            className="app-logo"
          />
          <div>
            <h1 className="app-title">Orbit AI</h1>
            <p className="app-subtitle">
              Your AI browser copilot
            </p>
          </div>
        </div>

        {view === "assistant" && (
          <button
            className="icon-button"
            onClick={() => setView("settings")}
            aria-label="Open Settings"
          >
            <SettingsIcon size={18} />
          </button>
        )}
      </header>

      {view === "assistant" ? (
  <AssistantView />
) : (
  <Settings onBack={() => setView("assistant")} />
)}
    </div>
  );
}