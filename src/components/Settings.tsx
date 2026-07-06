import { useEffect, useState } from "react";
import {
  getApiKey,
  saveApiKey,
  removeApiKey,
} from "../services/settings";

type Props = {
  onBack: () => void;
};

export default function Settings({ onBack }: Props) {
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
    await saveApiKey(apiKey);
    alert("API key saved.");
  }

  async function handleDelete() {
    await removeApiKey();
    setApiKey("");
    alert("API key removed.");
  }

  return (
    <>
      <button onClick={onBack}>← Back</button>

      <h2>Settings</h2>

      <p>OpenAI API Key</p>

      <input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="sk-..."
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
        style={{ marginLeft: 8 }}
        onClick={handleDelete}
      >
        Delete
      </button>
    </>
  );
}