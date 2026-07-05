interface ActionBarProps {
  selectedText: string;
  onExplain: () => void;
  onSummarize: () => void;
}

function ActionBar({
  selectedText,
  onExplain,
  onSummarize,
}: ActionBarProps) {
  async function handleCopy() {
    if (!selectedText) return;

    await navigator.clipboard.writeText(selectedText);
    alert("Selected text copied!");
  }

  return (
    <div style={{ marginTop: "20px" }}>
      <button onClick={onExplain}>Explain</button>

      <button
        onClick={onSummarize}
        style={{ marginLeft: "8px" }}
      >
        Summarize
      </button>

      <button
        onClick={handleCopy}
        style={{ marginLeft: "8px" }}
      >
        Copy
      </button>
    </div>
  );
}

export default ActionBar;