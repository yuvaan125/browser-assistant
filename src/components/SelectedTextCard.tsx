import { Quote } from "lucide-react";
import "./SelectedTextCard.css";

interface SelectedTextCardProps {
  text: string;
}

function SelectedTextCard({ text }: SelectedTextCardProps) {
  return (
    <div className="card">
      <div className="selected-header">
        <span className="card-heading">
          <Quote size={15} />
          Selected Text
        </span>
      </div>

      {text ? (
        <>
          <div className="selected-content">
            {text}
          </div>

          <p className="selected-count">
            {text.length} characters selected
          </p>
        </>
      ) : (
        <div className="selected-empty">
          Select text on any webpage to explain or summarize it.
        </div>
      )}
    </div>
  );
}

export default SelectedTextCard;