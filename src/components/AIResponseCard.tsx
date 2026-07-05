interface AIResponseCardProps {
  loading: boolean;
  response: string;
}

function AIResponseCard({
  loading,
  response,
}: AIResponseCardProps) {
  return (
    <div style={{ marginTop: "20px" }}>
      <h2>AI Response</h2>

      {loading && <p>Thinking...</p>}

      {!loading && !response && (
        <p>
          <em>No response yet.</em>
        </p>
      )}

      {!loading && response && (
        <p style={{ whiteSpace: "pre-wrap" }}>
          {response}
        </p>
      )}
    </div>
  );
}

export default AIResponseCard;