import { useState } from "react";
import { runAction } from "../services/orbit";

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
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          error instanceof Error ? error.message : String(error),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  async function explain(text: string) {
    if (!text.trim()) return;

    await runRequest("Explain the selected text", () =>
      runAction("explain", { selectedText: text })
    );
  }

  async function summarize(text: string) {
    if (!text.trim()) return;

    await runRequest("Summarize the selected text", () =>
      runAction("summarize", { selectedText: text })
    );
  }

  async function explainEntirePage() {
    await runRequest("Explain this webpage", () =>
      runAction("explainPage")
    );
  }

  async function ask(question: string) {
    if (!question.trim()) return;

    await runRequest(question, () =>
      runAction("ask", { question })
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
    ask,
    clearConversation,
  };
}
