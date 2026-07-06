import { Globe, BookOpen, Clock } from "lucide-react";
import type { PageInfo } from "../types/page";
import "./PageCard.css";

interface PageCardProps {
  page: PageInfo;
}

function PageCard({ page }: PageCardProps) {
  const hostname = new URL(page.url).hostname;

  return (
    <div className="card page-card">
      <div className="page-card-header">
        <div className="page-card-icon">
          <Globe size={20} />
        </div>

        <div>
          <h3>Current Page</h3>
          <p className="page-title">{page.title}</p>
          <a
            href={page.url}
            target="_blank"
            rel="noreferrer"
            className="page-url"
          >
            {hostname}
          </a>
        </div>
      </div>

      <div className="page-stats">
        <div className="stat">
          <BookOpen size={16} />
          <span>{page.wordCount} words</span>
        </div>

        <div className="stat">
          <Clock size={16} />
          <span>{page.readingTime} min read</span>
        </div>
      </div>
    </div>
  );
}

export default PageCard;