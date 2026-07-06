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
  return (
    <div style={{ marginTop: "20px" }}>
      <h2>Conversation</h2>

      {messages.length === 0 && !loading && (
        <p>
          <em>No conversation yet.</em>
        </p>
      )}

      {messages.map((message) => (
        <div
          key={message.id}
          style={{
            marginBottom: "12px",
            padding: "8px",
            border: "1px solid #ddd",
            borderRadius: "6px",
          }}
        >
          <strong>
            {message.role === "user" ? "You" : "Assistant"}
          </strong>

          <p style={{ whiteSpace: "pre-wrap" }}>
            {message.content}
          </p>
        </div>
      ))}

      {loading && <p>Thinking...</p>}
    </div>
  );
}

export default Conversation;