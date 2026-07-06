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
      <button onClick={onExplain}>
        <Sparkles size={18} />
        Explain
      </button>

      <button onClick={onSummarize}>
        <FileText size={18} />
        Summarize
      </button>

      <button onClick={onExplainPage}>
        <Globe size={18} />
        Explain Page
      </button>

      <button onClick={handleCopy}>
        <Copy size={18} />
        Copy
      </button>
    </div>
  );
}

export default ActionBar;