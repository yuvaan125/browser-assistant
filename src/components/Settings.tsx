import { useEffect, useState } from "react";
import {
  getApiKey,
  saveApiKey,
  removeApiKey,
} from "../services/settings";
import { signOut } from "../auth/session";

interface SettingsProps {
  onBack: () => void;
}

export default function Settings({
  onBack,
}: SettingsProps) {
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    async function load() {
      const key = await getApiKey();

      if (key) {
        setApiKey(key);
      }
    }

    load();
  }, []);

  async function handleSave() {
  console.log("Saving:", apiKey);

  await saveApiKey(apiKey);

  console.log(
    "Storage contents:",
    await chrome.storage.local.get(null)
  );

  alert("Gemini API Key saved.");
}

  async function handleDelete() {
    await removeApiKey();

    setApiKey("");

    alert("API Key deleted.");
  }

  return (
    <div>
      <button onClick={onBack}>
        ← Back
      </button>

      <h2>Settings</h2>

      <p>Gemini API Key</p>

      <input
        type="password"
        value={apiKey}
        placeholder="AIza..."
        onChange={(e) => setApiKey(e.target.value)}
        style={{
          width: "100%",
          padding: 8,
          marginTop: 8,
          marginBottom: 12,
        }}
      />

      <button onClick={handleSave}>
        Save
      </button>

      <button
        onClick={handleDelete}
        style={{ marginLeft: 10 }}
      >
        Delete
      </button>

      <button
        onClick={() => signOut()}
        style={{ marginTop: 20, display: "block" }}
      >
        Sign out
      </button>
    </div>
  );
}