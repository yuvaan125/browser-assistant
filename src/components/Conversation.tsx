import { Bot, Copy, Sparkles, Trash2, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { ChatMessage } from "../types/chat";

import "./Conversation.css";

interface ConversationProps {
  messages: ChatMessage[];
  loading: boolean;
  onClear: () => void;
}

function Conversation({
  messages,
  loading,
  onClear,
}: ConversationProps) {

  async function copyMessage(text: string) {
    await navigator.clipboard.writeText(text);
  }

  return (
    <div className="card conversation-card">
      <div className="conversation-header">
        <span className="card-heading">
          <Sparkles size={15} />
          Conversation
        </span>

        {messages.length > 0 && (
          <button
            className="btn-icon btn-icon-sm"
            onClick={onClear}
            aria-label="Clear conversation"
            title="Clear conversation"
          >
            <Trash2 size={14} />
          </button>
        )}
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
                className="btn-icon btn-icon-sm"
                onClick={() => copyMessage(message.content)}
                aria-label="Copy response"
              >
                <Copy size={14} />
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