import PageCard from "./PageCard";
import SelectedTextCard from "./SelectedTextCard";
import Conversation from "./Conversation";
import ActionBar from "./ActionBar";

import { useCurrentPage } from "../hooks/useCurrentPage";
import { useAI } from "../hooks/useAI";

export default function AssistantView() {
  const { page, loading, error } = useCurrentPage();

  const {
    messages,
    loading: aiLoading,
    explain,
    summarize,
    clearConversation,
  } = useAI();

  return (
    <>
      {loading && <p>Loading...</p>}

      {error && <p>{error}</p>}

      {page && (
        <>
          <PageCard page={page} />

          <SelectedTextCard text={page.selectedText} />

          <Conversation
            messages={messages}
            loading={aiLoading}
          />

          <ActionBar
            selectedText={page.selectedText}
            onExplain={() => explain(page.selectedText)}
            onSummarize={() => summarize(page.selectedText)}
          />

          <button
            onClick={clearConversation}
            style={{ marginTop: 12 }}
          >
            Clear Conversation
          </button>
        </>
      )}
    </>
  );
}