import "./App.css";
import { useState } from "react";
import { Settings as SettingsIcon } from "lucide-react";

import AssistantView from "./components/AssistantView";
import Settings from "./components/Settings";

export default function App() {
  const [view, setView] = useState<"assistant" | "settings">("assistant");

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1 className="app-title">Orbit AI</h1>
          <p className="app-subtitle">
            Your AI browser copilot
          </p>
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