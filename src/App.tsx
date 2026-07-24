import "./App.css";
import { useEffect, useState } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import type { User } from "@supabase/supabase-js";

import AssistantView from "./components/AssistantView";
import Settings from "./components/Settings";
//import LoginScreen from "./components/LoginScreen";

import { supabase } from "./auth/auth";
import { onAuthStateChange } from "./auth/session";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<"assistant" | "settings">(
    "assistant"
  );

  useEffect(() => {
    async function initialize() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      console.log("Initial session:", session);

      if (session?.access_token) {
        await chrome.storage.local.set({
          accessToken: session.access_token,
        });

        console.log(
          "Saved access token:",
          await chrome.storage.local.get("accessToken")
        );
      }

      setUser(session?.user ?? null);
      setLoading(false);
    }

    initialize();

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

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1 className="app-title">Orbit AI</h1>
          <p className="app-subtitle">
            Your AI browser copilot
          </p>
        </div>

        {user && view === "assistant" && (
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