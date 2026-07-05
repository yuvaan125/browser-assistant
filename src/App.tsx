import "./App.css";

import PageCard from "./components/PageCard";
import SelectedTextCard from "./components/SelectedTextCard";
import Conversation from "./components/Conversation";
import ActionBar from "./components/ActionBar";

import { useCurrentPage } from "./hooks/useCurrentPage";
import { useAI } from "./hooks/useAI";


function App() {
  const { page, loading, error } = useCurrentPage();

  const {
  messages,
  loading: aiLoading,
  explain,
  summarize,
  clearConversation,
} = useAI();

  return (
    <div className="app">
      <h1>Browser Assistant</h1>

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
  style={{ marginTop: "12px" }}
>
  Clear Conversation
</button>
        </>
      )}
    </div>
  );
}
export default App;