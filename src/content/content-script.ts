// ======================================
// Orbit AI Content Script
// ======================================

import { buildContext } from "../context/contextBuilder";
import type { OrbitAction } from "../context/types";

// ======================================
// Global State
// ======================================

let orbitButton: HTMLButtonElement | null = null;
let orbitMenu: HTMLDivElement | null = null;

let currentSelection = "";
let currentSelectionRange: Range | null = null;
let currentResponse = "";
let currentAction = "";
let loadingInterval: ReturnType<typeof setInterval> | null = null;

// ======================================
// Utility Functions
// ======================================

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}

function stopLoadingAnimation() {
  if (loadingInterval) {
    clearInterval(loadingInterval);
    loadingInterval = null;
  }
}

// ======================================
// Floating Button
// ======================================

function createOrbitButton() {
  if (orbitButton) return;

  orbitButton = document.createElement("button");

  orbitButton.id = "orbit-ai-button";

  orbitButton.innerHTML = `<img src="${chrome.runtime.getURL(
    "icons/icon48.png"
  )}" alt="Orbit AI" style="width:100%;height:100%;display:block;pointer-events:none;" />`;

  Object.assign(orbitButton.style, {
    position: "absolute",

    width: "42px",
    height: "42px",

    padding: "0",

    display: "none",

    alignItems: "center",
    justifyContent: "center",

    borderRadius: "50%",

    border: "none",

    background: "transparent",

    cursor: "pointer",

    boxShadow: "0 12px 32px rgba(109,40,217,.45)",

    transition: "transform .18s ease, box-shadow .18s ease",

    zIndex: "2147483647",
  });

  orbitButton.addEventListener("mouseenter", () => {
    orbitButton!.style.transform = "translateY(-2px) scale(1.08)";
    orbitButton!.style.boxShadow = "0 18px 40px rgba(109,40,217,.55)";
  });

  orbitButton.addEventListener("mouseleave", () => {
    orbitButton!.style.transform = "translateY(0) scale(1)";
    orbitButton!.style.boxShadow = "0 12px 32px rgba(109,40,217,.45)";
  });

  orbitButton.addEventListener("click", (e) => {
    e.stopPropagation();

    positionMenuBelowButton();
    renderMainMenu();
    showMenu();
  });

  document.body.appendChild(orbitButton);
}

// ======================================
// Popup
// ======================================

function createOrbitMenu() {
  if (orbitMenu) return;

  orbitMenu = document.createElement("div");

  Object.assign(orbitMenu.style, {
    position: "absolute",

    width: "300px",

    background: "#fff",

    borderRadius: "16px",

    border: "1px solid #ECECEC",

    boxShadow: "0 10px 32px rgba(15,23,42,.12)",

    overflow: "hidden",

    display: "none",

    opacity: "0",

    transform: "scale(.95)",

    transition: "opacity .18s ease, transform .18s ease",

    fontFamily: "Inter,system-ui,sans-serif",

    zIndex: "2147483647",
  });

  document.body.appendChild(orbitMenu);
}

// ======================================
// Popup Visibility
// ======================================

function showMenu() {
  if (!orbitMenu) return;

  orbitMenu.style.display = "block";

  requestAnimationFrame(() => {
    orbitMenu!.style.opacity = "1";
    orbitMenu!.style.transform = "scale(1)";
  });
}

function hideMenu() {
  if (!orbitMenu) return;

  orbitMenu.style.opacity = "0";
  orbitMenu.style.transform = "scale(.95)";

  setTimeout(() => {
    orbitMenu!.style.display = "none";
  }, 180);
}

// ======================================
// Shared Components
// ======================================

function getHeader() {
  return `
    <div style="
      padding:14px 16px;
      border-bottom:1px solid #ECECEC;
      background:#FFFFFF;
    ">

      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin-bottom:4px;
      ">

        <div style="
          font-size:16px;
          font-weight:600;
          color:#111827;
        ">
          Orbit AI
        </div>

        <div style="
          font-size:11px;
          font-weight:600;
          color:#7C3AED;
          background:#F3E8FF;
          padding:4px 8px;
          border-radius:999px;
        ">
          Beta
        </div>

      </div>

      <div style="
        font-size:12px;
        color:#6B7280;
      ">
        Select an action
      </div>

    </div>
  `;
}

function getFooter() {
  return `

    <div style="
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:12px;
      padding:16px;
      border-top:1px solid #F3F4F6;
      background:#FFFFFF;
    ">

      <button id="orbit-back">
        ← Back
      </button>

      <button id="orbit-copy">
        📋 Copy
      </button>

      <button id="orbit-close">
        ✕ Close
      </button>

    </div>

  `;
}

function getLoadingDots() {
  return `
    <div class="orbit-dot"></div>
    <div class="orbit-dot"></div>
    <div class="orbit-dot"></div>
  `;
}

// ======================================
// Render Functions
// ======================================

function renderMainMenu() {
  stopLoadingAnimation();

  if (!orbitMenu) return;

  orbitMenu.innerHTML = `

    ${getHeader()}

    <div style="
      padding:14px;
      display:flex;
      flex-direction:column;
      gap:8px;
    ">

      <div class="orbit-item" data-action="explain">

        <div>

          <div class="orbit-title">
            Explain
          </div>

          <div class="orbit-description">
            Understand selected text
          </div>

        </div>

        <div class="orbit-arrow">›</div>

      </div>

      <div class="orbit-item" data-action="summarize">

        <div>

          <div class="orbit-title">
            Summarize
          </div>

          <div class="orbit-description">
            Create a concise summary
          </div>

        </div>

        <div class="orbit-arrow">›</div>

      </div>

      <div class="orbit-item" data-action="translate">

        <div>

          <div class="orbit-title">
            Translate
          </div>

          <div class="orbit-description">
            Translate into English
          </div>

        </div>

        <div class="orbit-arrow">›</div>

      </div>

      <div class="orbit-item" data-action="ask">

        <div>

          <div class="orbit-title">
            Ask
          </div>

          <div class="orbit-description">
            Ask anything about this page
          </div>

        </div>

        <div class="orbit-arrow">›</div>

      </div>

    </div>

  `;

  bindMenuItems();
}

function renderLoading() {
  stopLoadingAnimation();

  if (!orbitMenu) return;

  orbitMenu.innerHTML = `

    ${getHeader()}

    <div style="
      padding:26px;
      text-align:center;
    ">

      <div style="
        font-size:15px;
        font-weight:600;
        color:#333;
        margin-bottom:18px;
      ">
        Orbit AI is thinking...
      </div>

      <div style="
        display:flex;
        justify-content:center;
        gap:10px;
      ">

        ${getLoadingDots()}

      </div>

    </div>

  `;

  const dots = orbitMenu.querySelectorAll<HTMLDivElement>(".orbit-dot");

  dots.forEach((dot) => {
    Object.assign(dot.style, {
      width: "10px",

      height: "10px",

      borderRadius: "50%",

      background: "#8B5CF6",

      opacity: ".3",

      transition: "opacity .25s ease",
    });
  });

  let active = 0;

  loadingInterval = setInterval(() => {
    if (!orbitMenu || !document.body.contains(orbitMenu)) {
      stopLoadingAnimation();
      return;
    }

    if (!orbitMenu.querySelector(".orbit-dot")) {
      stopLoadingAnimation();
      return;
    }

    dots.forEach((dot) => (dot.style.opacity = ".3"));

    if (dots[active]) dots[active].style.opacity = "1";

    active++;

    if (active >= dots.length) active = 0;
  }, 260);
}

function renderResponse(text: string) {
  stopLoadingAnimation();

  if (!orbitMenu) return;

  currentResponse = text;

  orbitMenu.innerHTML = `

    ${getHeader()}

    <div style="
      padding:18px;
      margin:16px;
      background:#FAFAFA;
      border-radius:14px;
      font-size:14px;
      line-height:1.7;
      color:#333;
      max-height:320px;
      overflow:auto;
      white-space:pre-wrap;
    ">

      ${escapeHtml(text)}

    </div>

    ${getFooter()}

  `;

  bindFooterButtons();
}

// ======================================
// Event Binding
// ======================================

function bindMenuItems() {
  if (!orbitMenu) return;

  orbitMenu.querySelectorAll<HTMLDivElement>(".orbit-item").forEach((item) => {
    // Card styling
    Object.assign(item.style, {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "11px 14px",
      border: "1px solid #ECECEC",
      borderRadius: "10px",
      background: "#FFFFFF",
      cursor: "pointer",
      transition: "all .18s ease",
      userSelect: "none",
    });

    // Title
    const title = item.querySelector<HTMLDivElement>(".orbit-title");

    if (title) {
      Object.assign(title.style, {
        fontSize: "13px",
        fontWeight: "600",
        color: "#111827",
      });
    }

    // Description
    const description = item.querySelector<HTMLDivElement>(
      ".orbit-description"
    );

    if (description) {
      Object.assign(description.style, {
        marginTop: "3px",
        fontSize: "11px",
        color: "#6B7280",
        lineHeight: "1.4",
      });
    }

    // Arrow
    const arrow = item.querySelector<HTMLDivElement>(".orbit-arrow");

    if (arrow) {
      Object.assign(arrow.style, {
        color: "#9CA3AF",
        fontSize: "20px",
        fontWeight: "400",
        transition: "transform .18s ease",
      });
    }

    // Hover In
    item.addEventListener("mouseenter", () => {
      item.style.background = "#FAF7FF";
      item.style.borderColor = "#DDD6FE";
      item.style.transform = "translateY(-1px)";
      item.style.boxShadow = "0 6px 18px rgba(124,58,237,.08)";

      if (arrow) {
        arrow.style.transform = "translateX(4px)";
      }
    });

    // Hover Out
    item.addEventListener("mouseleave", () => {
      item.style.background = "#FFFFFF";
      item.style.borderColor = "#ECECEC";
      item.style.transform = "translateY(0)";
      item.style.boxShadow = "none";

      if (arrow) {
        arrow.style.transform = "translateX(0)";
      }
    });

    // Click
    item.addEventListener("click", () => {
      currentAction = item.dataset.action ?? "";

      renderLoading();

      handleOrbitAction(currentAction);
    });
  });
}

function bindFooterButtons() {
  if (!orbitMenu) return;

  const backBtn = orbitMenu.querySelector<HTMLButtonElement>("#orbit-back");
  const copyBtn = orbitMenu.querySelector<HTMLButtonElement>("#orbit-copy");
  const closeBtn = orbitMenu.querySelector<HTMLButtonElement>("#orbit-close");

  const buttons = [backBtn, copyBtn, closeBtn].filter(
    (btn): btn is HTMLButtonElement => Boolean(btn)
  );

  buttons.forEach((btn) => {
    Object.assign(btn.style, {
      flex: "1",

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      gap: "8px",

      padding: "12px 16px",

      border: "1px solid #E5E7EB",

      borderRadius: "14px",

      background: "#FFFFFF",

      color: "#374151",

      fontSize: "14px",

      fontWeight: "500",

      cursor: "pointer",

      transition: "all .18s ease",

      outline: "none",
    });
  });

  // Back Button
  if (backBtn) {
    Object.assign(backBtn.style, {
      color: "#6D28D9",

      borderColor: "#E9D5FF",

      background: "#FFFFFF",
    });
  }

  // Copy Button
  if (copyBtn) {
    Object.assign(copyBtn.style, {
      color: "#6D28D9",

      borderColor: "#DDD6FE",

      background: "#FAF7FF",
    });
  }

  // Close Button
  if (closeBtn) {
    Object.assign(closeBtn.style, {
      color: "#DC2626",

      borderColor: "#FECACA",

      background: "#FEF2F2",
    });
  }

  buttons.forEach((btn) => {
    btn.addEventListener("mouseenter", () => {
      btn.style.transform = "translateY(-1px)";
      btn.style.boxShadow = "0 6px 16px rgba(0,0,0,.08)";
    });

    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "translateY(0)";
      btn.style.boxShadow = "none";
    });
  });

  backBtn?.addEventListener("click", () => {
    renderMainMenu();
  });

  closeBtn?.addEventListener("click", () => {
    hideMenu();
  });

  copyBtn?.addEventListener("click", async () => {
    await navigator.clipboard.writeText(currentResponse);

    copyBtn.innerHTML = "✅ Copied";

    setTimeout(() => {
      copyBtn.innerHTML = "📋 Copy";
    }, 1200);
  });
}

// ======================================
// Action Handlers
// ======================================

async function handleOrbitAction(action: string) {
  if (!currentSelection.trim()) {
    renderResponse("Please select some text first.");
    return;
  }

  console.log("Sending action:", action);
  console.log("Selection:", currentSelection);

  const context = buildContext(action as OrbitAction, {
    selectedText: currentSelection,
    question: action === "ask" ? currentSelection : undefined,
    selectionRange: currentSelectionRange,
  });

  console.log(
    "Orbit context size: raw page =",
    document.body.innerText.length,
    "chars, retrieved context =",
    JSON.stringify(context).length,
    "chars"
  );

  chrome.runtime.sendMessage(
    {
      type: "ORBIT_ACTION",

      action,

      selectedText: currentSelection,

      pageTitle: document.title,

      pageUrl: window.location.href,

      context,
    },

    (response) => {
      if (chrome.runtime.lastError) {
        renderResponse("Unable to communicate with the extension.");
        return;
      }

      if (!response) {
        renderResponse("No response received.");
        return;
      }

      if (!response.success) {
        renderResponse(response.error || "Something went wrong.");
        return;
      }

      renderResponse(response.result);
    }
  );
}

// ======================================
// Selection Handlings
// ======================================

function updateFloatingButton() {
  if (!orbitButton) return;

  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    orbitButton.style.display = "none";
    return;
  }

  const text = selection.toString().trim();

  currentSelection = text;
  currentSelectionRange = text ? selection.getRangeAt(0).cloneRange() : null;

  if (!text) {
    orbitButton.style.display = "none";
    return;
  }

  const rect = selection.getRangeAt(0).getBoundingClientRect();

  orbitButton.style.left = `${rect.right + window.scrollX + 8}px`;

  orbitButton.style.top = `${rect.top + window.scrollY - 10}px`;

  orbitButton.style.display = "flex";
}

document.addEventListener("mouseup", () => {
  setTimeout(updateFloatingButton, 10);
});

document.addEventListener("keyup", () => {
  setTimeout(updateFloatingButton, 10);
});

// Hide button when clicking elsewhere

document.addEventListener("mousedown", (event) => {
  if (orbitButton && !orbitButton.contains(event.target as Node)) {
    orbitButton.style.display = "none";
  }
});

// Hide popup when clicking outside
//
// NOTE: registered on the CAPTURE phase, not bubble.
// Menu buttons (Back, menu items) replace orbitMenu.innerHTML
// in their own click handler. If this listener ran on bubble
// (after that handler already ran), event.target would already
// be a detached node removed from the DOM, so
// orbitMenu.contains(event.target) would wrongly return false
// and immediately hideMenu() right after Back/menu-item swapped
// the content in. Capture runs first, while the DOM is still
// intact, so containment is checked correctly.

document.addEventListener(
  "click",
  (event) => {
    if (
      orbitMenu &&
      orbitMenu.style.display === "block" &&
      !orbitMenu.contains(event.target as Node) &&
      !orbitButton?.contains(event.target as Node)
    ) {
      hideMenu();
    }
  },
  true
);

// ======================================
// Popup Positioning
// ======================================

function positionMenuBelowButton() {
  if (!orbitButton || !orbitMenu) return;

  const rect = orbitButton.getBoundingClientRect();

  orbitMenu.style.left = `${rect.left + window.scrollX}px`;

  orbitMenu.style.top = `${rect.bottom + window.scrollY + 8}px`;
}

function repositionMenu() {
  if (!orbitMenu || orbitMenu.style.display !== "block" || !orbitButton) {
    return;
  }

  positionMenuBelowButton();
}

window.addEventListener(
  "scroll",
  () => {
    repositionMenu();
  },
  true
);

window.addEventListener("resize", () => {
  repositionMenu();
});

// ======================================
// Chrome Messaging
// ======================================

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "GET_PAGE_INFO") {
    const pageText = document.body.innerText;

    const words = pageText.trim().split(/\s+/).filter(Boolean);

    sendResponse({
      title: document.title,

      url: window.location.href,

      selectedText: window.getSelection()?.toString() || "",

      pageText,

      wordCount: words.length,

      characterCount: pageText.length,

      readingTime: Math.max(1, Math.ceil(words.length / 200)),
    });
  }

  // Lets the popup build page context without duplicating the pipeline —
  // the content script is the only place with DOM access and the live
  // selection range that "explain" anchors to.
  if (message.type === "BUILD_CONTEXT") {
    const selection = window.getSelection();

    const selectedText =
      selection?.toString().trim() || currentSelection;

    const selectionRange =
      selection && selection.rangeCount > 0 && selection.toString().trim()
        ? selection.getRangeAt(0).cloneRange()
        : currentSelectionRange;

    sendResponse(
      buildContext(message.action as OrbitAction, {
        selectedText,
        question: message.question,
        selectionRange,
      })
    );
  }

  return true;
});

// ======================================
// Initialization
// ======================================

function initOrbitAI() {
  createOrbitButton();
  createOrbitMenu();
}

initOrbitAI();
