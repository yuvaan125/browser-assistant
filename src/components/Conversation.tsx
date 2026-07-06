import { Bot, Copy, Sparkles, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { ChatMessage } from "../types/chat";

import "./Conversation.css";

interface ConversationProps {
  messages: ChatMessage[];
  loading: boolean;
}

function Conversation({
  messages,
  loading,
}: ConversationProps) {

  async function copyMessage(text: string) {
    await navigator.clipboard.writeText(text);
  }

  return (
    <div className="card conversation-card">
      <div className="conversation-header">
        <Sparkles size={18} />
        <h3>Conversation</h3>
      </div>

      {messages.length === 0 && !loading && (
        <div className="conversation-empty">
          <Bot size={28} />
          <p>
            Select text or click <strong>Explain Page</strong> to
            start chatting with Orbit AI.
          </p>
        </div>
      )}

      {messages.map((message) => (
        <div
          key={message.id}
          className={`message ${
            message.role === "user"
              ? "user-message"
              : "assistant-message"
          }`}
        >
          <div className="message-header">

            <div className="message-title">

              {message.role === "user" ? (
                <>
                  <User size={16} />
                  <span>You</span>
                </>
              ) : (
                <>
                  <Bot size={16} />
                  <span>Orbit AI</span>
                </>
              )}

            </div>

            {message.role === "assistant" && (
              <button
                className="copy-button"
                onClick={() => copyMessage(message.content)}
              >
                <Copy size={15} />
              </button>
            )}

          </div>

          <div className="message-content markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>

        </div>
      ))}

      {loading && (
        <div className="thinking">
          <Bot size={18} />
          <span>Thinking...</span>
        </div>
      )}
    </div>
  );
}

export default Conversation;