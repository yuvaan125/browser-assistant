import { useState } from "react";
import {
  explainText,
  summarizeText,
  explainPage,
} from "../services/ai";

import type { ChatMessage } from "../types/chat";

export function useAI() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  async function runRequest(
    userPrompt: string,
    aiRequest: () => Promise<string>
  ) {
    setLoading(true);

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: userPrompt,
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const result = await aiRequest();

      const aiMessage: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: result,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } finally {
      setLoading(false);
    }
  }

  async function explain(text: string) {
    if (!text.trim()) return;

    await runRequest(
      "Explain the selected text",
      () => explainText(text)
    );
  }

  async function summarize(text: string) {
    if (!text.trim()) return;

    await runRequest(
      "Summarize the selected text",
      () => summarizeText(text)
    );
  }

  async function explainEntirePage(text: string) {
    if (!text.trim()) return;

    await runRequest(
      "Explain this webpage",
      () => explainPage(text)
    );
  }

  function clearConversation() {
    setMessages([]);
  }

  return {
    messages,
    loading,
    explain,
    summarize,
    explainEntirePage,
    clearConversation,
  };
}