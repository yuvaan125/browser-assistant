import PageCard from "./PageCard";
import SelectedTextCard from "./SelectedTextCard";
import Conversation from "./Conversation";
import ActionBar from "./ActionBar";
import ChatInput from "./ChatInput";

import { useCurrentPage } from "../hooks/useCurrentPage";
import { useAI } from "../hooks/useAI";

export default function AssistantView() {
  const { page, loading, error } = useCurrentPage();

  const {
    messages,
    loading: aiLoading,
    explain,
    summarize,
    explainEntirePage,
    ask,
    clearConversation,
  } = useAI();

  if (loading) {
    return <p className="app-loading">Loading page...</p>;
  }

  if (error) {
    return <p className="app-error">{error}</p>;
  }

  if (!page) return null;

  return (
    <>
      <PageCard page={page} />

      <SelectedTextCard text={page.selectedText} />

      <ActionBar
        selectedText={page.selectedText}
        onExplain={() => explain(page.selectedText)}
        onSummarize={() => summarize(page.selectedText)}
        onExplainPage={() => explainEntirePage()}
      />

      <Conversation
        messages={messages}
        loading={aiLoading}
        onClear={clearConversation}
      />

      <ChatInput loading={aiLoading} onSend={(message) => ask(message)} />
    </>
  );
}
