import { useState } from "react";
import { Send } from "lucide-react";

import "./ChatInput.css";

interface ChatInputProps {
  loading: boolean;
  onSend: (message: string) => void;
}

export default function ChatInput({
  loading,
  onSend,
}: ChatInputProps) {
  const [text, setText] = useState("");

  function handleSubmit() {
    const message = text.trim();

    if (!message) return;

    onSend(message);
    setText("");
  }

  return (
    <div className="chat-input">
      <input
        value={text}
        placeholder="Ask Orbit AI..."
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSubmit();
          }
        }}
      />

      <button
        type="button"
        disabled={loading}
        onClick={handleSubmit}
      >
        <Send size={18} />
      </button>
    </div>
  );
}