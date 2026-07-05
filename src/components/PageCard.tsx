import type { PageInfo } from "../types/page";

interface PageCardProps {
  page: PageInfo;
}

function PageCard({ page }: PageCardProps) {
  return (
    <div>
      <h2>Current Page</h2>

      <p>
        <strong>Title:</strong>
        <br />
        {page.title}
      </p>

      <p>
        <strong>URL:</strong>
        <br />
        {page.url}
      </p>

      <p>
        <strong>Words:</strong> {page.wordCount}
      </p>

      <p>
        <strong>Characters:</strong> {page.characterCount}
      </p>

      <p>
        <strong>Reading Time:</strong> {page.readingTime} min
      </p>
    </div>
  );
}

export default PageCard;