import "./App.css";
import { useState } from "react";

import AssistantView from "./components/AssistantView";
import Settings from "./components/Settings";

export default function App() {
  const [view, setView] = useState<"assistant" | "settings">("assistant");

  return (
    <div className="app">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 22,
          }}
        >
          Browser Assistant
        </h1>

        {view === "assistant" && (
          <button onClick={() => setView("settings")}>
            ⚙️
          </button>
        )}
      </div>

      {view === "assistant" ? (
        <AssistantView />
      ) : (
        <Settings onBack={() => setView("assistant")} />
      )}
    </div>
  );
}