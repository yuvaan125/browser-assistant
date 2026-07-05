import { useEffect, useState } from "react";
import { getCurrentTab } from "./services/chrome";

function App() {
  const [tab, setTab] = useState<chrome.tabs.Tab | null>(null);

  useEffect(() => {
    async function loadTab() {
      const currentTab = await getCurrentTab();
      setTab(currentTab);
    }

    loadTab();
  }, []);

  return (
    <div style={{ padding: "16px", width: "350px" }}>
      <h2>Current Tab</h2>

      {tab ? (
        <>
          <p>
            <strong>Title:</strong>
            <br />
            {tab.title}
          </p>

          <p>
            <strong>URL:</strong>
            <br />
            {tab.url}
          </p>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

export default App;