// ======================================
// Orbit AI Content Script
// ======================================
//
// Owns page-side concerns: tracking the selection, dispatching actions to the
// background worker, and answering messages from the popup. All rendering lives
// in ./ui.ts behind a shadow root.

import { buildContext } from "../context/contextBuilder";
import type { OrbitAction } from "../context/types";
import {
  closeMenu,
  hideButton,
  isMenuOpen,
  isOwnEvent,
  mountUI,
  openMenu,
  positionMenu,
  renderAsk,
  renderError,
  renderLoading,
  renderMainMenu,
  renderResponse,
  showButton,
  type MenuAction,
} from "./ui";

// ======================================
// State
// ======================================

let currentSelection = "";
let currentSelectionRange: Range | null = null;

/** Actions that operate on highlighted text; the rest work page-wide. */
const NEEDS_SELECTION = new Set<MenuAction>([
  "explain",
  "summarize",
  "translate",
]);

// ======================================
// Actions
// ======================================

function handleMenuAction(action: MenuAction) {
  if (NEEDS_SELECTION.has(action) && !currentSelection.trim()) {
    renderError("Select some text on the page first, then try again.");
    return;
  }

  // Ask needs a question before it can run.
  if (action === "ask") {
    renderAsk();
    return;
  }

  runAction(action);
}

function runAction(action: MenuAction, question?: string) {
  renderLoading();

  const context = buildContext(action as OrbitAction, {
    selectedText: currentSelection,
    question,
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
      question,
      pageTitle: document.title,
      pageUrl: window.location.href,
      context,
    },
    (response) => {
      if (chrome.runtime.lastError) {
        renderError("Unable to reach the extension. Try reloading the page.");
        return;
      }

      if (!response) {
        renderError("No response received.");
        return;
      }

      if (!response.success) {
        renderError(response.error || "Something went wrong.");
        return;
      }

      renderResponse(response.result);
    }
  );
}

// ======================================
// Selection tracking
// ======================================

function updateFloatingButton() {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    hideButton();
    return;
  }

  const text = selection.toString().trim();

  if (!text) {
    hideButton();
    return;
  }

  currentSelection = text;
  currentSelectionRange = selection.getRangeAt(0).cloneRange();

  positionButtonToSelection();
}

/** Viewport coordinates — the button is position:fixed inside the shadow root. */
function positionButtonToSelection() {
  if (!currentSelectionRange) return;

  const rect = currentSelectionRange.getBoundingClientRect();

  showButton(rect.right + 8, rect.top - 10);
}

document.addEventListener("mouseup", () => {
  setTimeout(updateFloatingButton, 10);
});

document.addEventListener("keyup", () => {
  setTimeout(updateFloatingButton, 10);
});

// Clicking anywhere outside our UI dismisses it. Because the shadow root is
// closed, events from inside are retargeted to the host element, so a single
// containment check covers both the button and the menu.
document.addEventListener("mousedown", (event) => {
  if (isOwnEvent(event.target)) return;

  hideButton();

  if (isMenuOpen()) closeMenu();
});

// ======================================
// Reposition on scroll / resize
// ======================================

let repositionQueued = false;

function queueReposition() {
  if (repositionQueued) return;

  repositionQueued = true;

  requestAnimationFrame(() => {
    repositionQueued = false;

    // Fixed positioning doesn't scroll with the document, so both the button
    // and the menu have to be re-anchored to the (moved) selection.
    positionButtonToSelection();

    if (isMenuOpen()) positionMenu();
  });
}

window.addEventListener("scroll", queueReposition, true);
window.addEventListener("resize", queueReposition);

// ======================================
// Chrome messaging
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

    const selectedText = selection?.toString().trim() || currentSelection;

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

mountUI({
  onButtonClick: () => {
    renderMainMenu();
    positionMenu();
    openMenu();
  },
  onAction: handleMenuAction,
  onAsk: (question) => runAction("ask", question),
});
