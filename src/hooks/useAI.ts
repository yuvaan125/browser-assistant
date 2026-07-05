import { useState } from "react";
import { explainText, summarizeText } from "../services/ai";
import type { ChatMessage } from "../types/chat";

export function useAI() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  async function explain(text: string) {
    if (!text.trim()) return;

    setLoading(true);

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: "Explain the selected text",
    };

    setMessages((prev) => [...prev, userMessage]);

    const result = await explainText(text);

    const aiMessage: ChatMessage = {
      id: Date.now() + 1,
      role: "assistant",
      content: result,
    };

    setMessages((prev) => [...prev, aiMessage]);

    setLoading(false);
  }

  async function summarize(text: string) {
    if (!text.trim()) return;

    setLoading(true);

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: "Summarize the selected text",
    };

    setMessages((prev) => [...prev, userMessage]);

    const result = await summarizeText(text);

    const aiMessage: ChatMessage = {
      id: Date.now() + 1,
      role: "assistant",
      content: result,
    };

    setMessages((prev) => [...prev, aiMessage]);

    setLoading(false);
  }

  function clearConversation() {
    setMessages([]);
  }

  return {
    messages,
    loading,
    explain,
    summarize,
    clearConversation,
  };
}