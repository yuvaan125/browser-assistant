// ======================================
// Orbit AI Content Script
// ======================================

let orbitButton = null;
let orbitMenu = null;
let currentSelection = "";

// ======================================
// Floating Orbit Button
// ======================================

function createOrbitButton() {
  if (orbitButton) return;

  orbitButton = document.createElement("button");

  orbitButton.id = "orbit-ai-button";
  orbitButton.innerHTML = "✨";

  Object.assign(orbitButton.style, {
    position: "absolute",
    width: "38px",
    height: "38px",
    borderRadius: "9999px",
    border: "none",
    background: "#7C3AED",
    color: "#fff",
    cursor: "pointer",
    display: "none",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    boxShadow: "0 8px 24px rgba(0,0,0,.2)",
    transition: "all .15s ease",
    zIndex: "2147483647",
  });

  orbitButton.addEventListener("mouseenter", () => {
    orbitButton.style.transform = "scale(1.08)";
  });

  orbitButton.addEventListener("mouseleave", () => {
    orbitButton.style.transform = "scale(1)";
  });

  orbitButton.addEventListener("click", (event) => {
    event.stopPropagation();

    const selectedText =
      window.getSelection()?.toString().trim() ?? "";

    console.log("Orbit AI Selected Text:", selectedText);

    orbitButton.addEventListener("click", (event) => {
  event.stopPropagation();

  const rect = orbitButton.getBoundingClientRect();

  orbitMenu.style.left =
    `${rect.left + window.scrollX}px`;

  orbitMenu.style.top =
    `${rect.bottom + window.scrollY + 8}px`;

  orbitMenu.style.display = "block";
});
  });

  document.body.appendChild(orbitButton);
}

createOrbitButton();
createOrbitMenu();
styleMenuItems();
// ======================================
// Selection Detection
// ======================================

function updateFloatingButton() {
  const selection = window.getSelection();

  if (!selection) {
    orbitButton.style.display = "none";
    return;
  }

  const text = selection.toString().trim();
  currentSelection = text;

  if (!text) {
    orbitButton.style.display = "none";
    return;
  }

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  orbitButton.style.left =
    `${rect.right + window.scrollX + 8}px`;

  orbitButton.style.top =
    `${rect.top + window.scrollY - 10}px`;

  orbitButton.style.display = "flex";
}

document.addEventListener("mouseup", () => {
  setTimeout(updateFloatingButton, 10);
});

document.addEventListener("keyup", () => {
  setTimeout(updateFloatingButton, 10);
});

document.addEventListener("mousedown", (event) => {
  if (
    orbitButton &&
    !orbitButton.contains(event.target)
  ) {
    orbitButton.style.display = "none";
  }
});

function createOrbitMenu() {
  if (orbitMenu) return;

  orbitMenu = document.createElement("div");

  Object.assign(orbitMenu.style, {
    position: "absolute",
    width: "220px",
    background: "#ffffff",
    borderRadius: "14px",
    boxShadow: "0 12px 32px rgba(0,0,0,.18)",
    border: "1px solid #ececec",
    display: "none",
    overflow: "hidden",
    fontFamily: "Inter, Arial, sans-serif",
    zIndex: "2147483647",
  });

  orbitMenu.innerHTML = `
      <div style="
          padding:14px;
          font-weight:600;
          border-bottom:1px solid #eee;
      ">
          ✨ Orbit AI
      </div>

      <div class="orbit-item">📖 Explain</div>
      <div class="orbit-item">📝 Summarize</div>
      <div class="orbit-item">🌍 Translate</div>
      <div class="orbit-item">💬 Ask Orbit</div>
  `;

  document.body.appendChild(orbitMenu);
}

function styleMenuItems() {
  document.querySelectorAll(".orbit-item").forEach((item) => {
    Object.assign(item.style, {
      padding: "12px 14px",
      cursor: "pointer",
      transition: "background .15s",
      userSelect: "none",
    });

    // Hover effect
    item.addEventListener("mouseenter", () => {
      item.style.background = "#f5f3ff";
    });

    item.addEventListener("mouseleave", () => {
      item.style.background = "#ffffff";
    });

    // Click action
    item.addEventListener("click", () => {
      const action = item.textContent.trim();

      showLoading();

      // Fake AI response for now
      setTimeout(() => {
        showResponse(
          `Action: ${action}\n\nSelected Text:\n\n"${currentSelection}"\n\nNext sprint this will be replaced by Gemini.`
        );
      }, 1000);
    });
  });
}

function showLoading() {
  orbitMenu.innerHTML = `
    <div style="
      padding:16px;
      font-weight:600;
      border-bottom:1px solid #eee;
    ">
      ✨ Orbit AI
    </div>

    <div style="
      padding:24px;
      text-align:center;
      color:#666;
      font-size:14px;
    ">
      Thinking...
    </div>
  `;
}

function showResponse(text) {
  orbitMenu.innerHTML = `
    <div style="
      padding:16px;
      font-weight:600;
      border-bottom:1px solid #eee;
    ">
      ✨ Orbit AI
    </div>

    <div style="
      padding:16px;
      font-size:14px;
      line-height:1.6;
      max-height:300px;
      overflow:auto;
    ">
      ${text}
    </div>

    <div style="
      display:flex;
      justify-content:flex-end;
      gap:8px;
      padding:12px;
      border-top:1px solid #eee;
    ">
      <button id="orbit-close">
        Close
      </button>
    </div>
  `;

  document
    .getElementById("orbit-close")
    ?.addEventListener("click", () => {
      orbitMenu.style.display = "none";
    });
}
// ======================================
// Messaging
// ======================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_PAGE_INFO") {
    const text = document.body.innerText;

    const words = text
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    sendResponse({
      title: document.title,
      url: window.location.href,
      selectedText: window.getSelection()?.toString() || "",
      pageText: text,
      wordCount: words.length,
      characterCount: text.length,
      readingTime: Math.max(1, Math.ceil(words.length / 200)),
    });
  }

  return true;
});

document.addEventListener("click", (event) => {
  if (
    orbitMenu &&
    !orbitMenu.contains(event.target) &&
    !orbitButton.contains(event.target)
  ) {
    orbitMenu.style.display = "none";
  }
});