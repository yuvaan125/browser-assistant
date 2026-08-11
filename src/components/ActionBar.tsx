import {
  Sparkles,
  FileText,
  Globe,
  Copy,
} from "lucide-react";

import "./ActionBar.css";

interface ActionBarProps {
  selectedText: string;
  onExplain: () => void;
  onSummarize: () => void;
  onExplainPage: () => void;
}

function ActionBar({
  selectedText,
  onExplain,
  onSummarize,
  onExplainPage,
}: ActionBarProps) {
  async function handleCopy() {
    if (!selectedText) return;

    await navigator.clipboard.writeText(selectedText);
  }

  return (
    <div className="action-grid">
      <button className="btn btn-secondary" onClick={onExplain}>
        <Sparkles size={16} />
        Explain
      </button>

      <button className="btn btn-secondary" onClick={onSummarize}>
        <FileText size={16} />
        Summarize
      </button>

      <button className="btn btn-secondary" onClick={onExplainPage}>
        <Globe size={16} />
        Explain Page
      </button>

      <button
        className="btn btn-secondary"
        onClick={handleCopy}
        disabled={!selectedText}
      >
        <Copy size={16} />
        Copy
      </button>
    </div>
  );
}

export default ActionBar;