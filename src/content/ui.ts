// ======================================
// Orbit AI — injected UI
// ======================================
//
// Everything here lives inside a shadow root, so host page CSS can't reach it
// and our styles can't leak out. That isolation is why the markup below can use
// plain class names and let styles.css do the work, instead of patching each
// element's inline style after every render.

import styles from "./styles.css?inline";

export type MenuAction =
  | "explain"
  | "explainPage"
  | "summarize"
  | "translate"
  | "ask";

export interface UIHandlers {
  onAction: (action: MenuAction) => void;
  onAsk: (question: string) => void;
  onButtonClick: () => void;
}

const MENU_ITEMS: {
  action: MenuAction;
  title: string;
  description: string;
}[] = [
  {
    action: "explain",
    title: "Explain",
    description: "Understand selected text",
  },
  {
    action: "summarize",
    title: "Summarize",
    description: "Create a concise summary",
  },
  {
    action: "translate",
    title: "Translate",
    description: "Translate into English",
  },
  {
    action: "explainPage",
    title: "Explain Page",
    description: "Overview of this whole page",
  },
  {
    action: "ask",
    title: "Ask",
    description: "Ask anything about this page",
  },
];

let host: HTMLDivElement | null = null;
let root: ShadowRoot | null = null;
let button: HTMLButtonElement | null = null;
let menu: HTMLDivElement | null = null;

let handlers: UIHandlers | null = null;
let lastResponse = "";

// ======================================
// Markup helpers
// ======================================

function headerHtml(subtitle = "Select an action"): string {
  return `
    <div class="orbit-header">
      <div class="orbit-header-top">
        <div class="orbit-brand">Orbit AI</div>
        <div class="orbit-badge">Beta</div>
      </div>
      <div class="orbit-subtitle">${subtitle}</div>
    </div>
  `;
}

function footerHtml(withCopy: boolean): string {
  return `
    <div class="orbit-footer">
      <button class="orbit-btn orbit-btn-back" data-role="back">← Back</button>
      ${
        withCopy
          ? `<button class="orbit-btn orbit-btn-copy" data-role="copy">📋 Copy</button>`
          : ""
      }
      <button class="orbit-btn orbit-btn-close" data-role="close">✕ Close</button>
    </div>
  `;
}

// ======================================
// Mount
// ======================================

export function mountUI(uiHandlers: UIHandlers) {
  if (host) return;

  handlers = uiHandlers;

  host = document.createElement("div");
  host.id = "orbit-ai-root";

  // Closed: nothing on the page can reach into our tree via shadowRoot.
  // It also means document-level listeners see events retargeted to the host,
  // which is what makes the click-outside check below reliable.
  root = host.attachShadow({ mode: "closed" });

  const style = document.createElement("style");
  style.textContent = styles;
  root.appendChild(style);

  button = document.createElement("button");
  button.className = "orbit-button";
  button.setAttribute("aria-label", "Orbit AI");
  button.innerHTML = `<img src="${chrome.runtime.getURL(
    "icons/icon48.png"
  )}" alt="" />`;

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    handlers?.onButtonClick();
  });

  menu = document.createElement("div");
  menu.className = "orbit-menu";

  // One delegated listener for the whole menu — survives every innerHTML swap,
  // so no rebinding after each render.
  menu.addEventListener("click", onMenuClick);
  menu.addEventListener("keydown", onMenuKeydown);

  root.appendChild(button);
  root.appendChild(menu);

  document.body.appendChild(host);
}

// ======================================
// Event delegation
// ======================================

function onMenuClick(event: Event) {
  const target = event.target as HTMLElement;

  const item = target.closest<HTMLElement>(".orbit-item");
  if (item?.dataset.action) {
    handlers?.onAction(item.dataset.action as MenuAction);
    return;
  }

  const role = target.closest<HTMLElement>("[data-role]")?.dataset.role;

  if (role === "back") renderMainMenu();
  if (role === "close") closeMenu();
  if (role === "copy") copyResponse(target.closest("[data-role]"));
  if (role === "submit") submitAsk();
}

function onMenuKeydown(event: Event) {
  const keyEvent = event as KeyboardEvent;

  if (
    keyEvent.key === "Enter" &&
    (keyEvent.target as HTMLElement).dataset?.role === "question"
  ) {
    submitAsk();
  }
}

function submitAsk() {
  const input = menu?.querySelector<HTMLInputElement>('[data-role="question"]');
  const question = input?.value.trim();

  if (!question) return;

  handlers?.onAsk(question);
}

async function copyResponse(copyBtn: Element | null) {
  await navigator.clipboard.writeText(lastResponse);

  if (!copyBtn) return;

  copyBtn.textContent = "✅ Copied";
  setTimeout(() => {
    copyBtn.textContent = "📋 Copy";
  }, 1200);
}

// ======================================
// Button
// ======================================

export function showButton(viewportX: number, viewportY: number) {
  if (!button) return;

  button.style.left = `${viewportX}px`;
  button.style.top = `${viewportY}px`;
  button.classList.add("is-visible");
}

export function hideButton() {
  button?.classList.remove("is-visible");
}

/** True when the event originated inside our shadow tree. */
export function isOwnEvent(target: EventTarget | null): boolean {
  return !!host && !!target && host.contains(target as Node);
}

// ======================================
// Menu visibility + position
// ======================================

export function isMenuOpen(): boolean {
  return !!menu?.classList.contains("is-open");
}

export function openMenu() {
  if (!menu) return;

  menu.classList.add("is-open");

  requestAnimationFrame(() => menu?.classList.add("is-visible"));
}

export function closeMenu() {
  if (!menu) return;

  menu.classList.remove("is-visible");

  setTimeout(() => menu?.classList.remove("is-open"), 180);
}

/** Anchors the menu under the button, keeping it inside the viewport. */
export function positionMenu() {
  if (!button || !menu) return;

  const rect = button.getBoundingClientRect();
  const menuWidth = 300;

  const left = Math.min(rect.left, window.innerWidth - menuWidth - 8);

  menu.style.left = `${Math.max(8, left)}px`;
  menu.style.top = `${rect.bottom + 8}px`;
}

// ======================================
// Views
// ======================================

export function renderMainMenu() {
  if (!menu) return;

  menu.innerHTML = `
    ${headerHtml()}
    <div class="orbit-list">
      ${MENU_ITEMS.map(
        (item) => `
        <button class="orbit-item" data-action="${item.action}">
          <span>
            <span class="orbit-title">${item.title}</span>
            <span class="orbit-description">${item.description}</span>
          </span>
          <span class="orbit-arrow">›</span>
        </button>
      `
      ).join("")}
    </div>
  `;
}

export function renderAsk() {
  if (!menu) return;

  menu.innerHTML = `
    ${headerHtml("Ask about this page")}
    <div class="orbit-ask">
      <input
        class="orbit-input"
        data-role="question"
        type="text"
        placeholder="What would you like to know?"
      />
      <button class="orbit-submit" data-role="submit">Ask Orbit</button>
    </div>
    ${footerHtml(false)}
  `;

  menu.querySelector<HTMLInputElement>('[data-role="question"]')?.focus();
}

export function renderLoading() {
  if (!menu) return;

  menu.innerHTML = `
    ${headerHtml("Working on it")}
    <div class="orbit-loading">
      <div class="orbit-loading-label">Orbit AI is thinking...</div>
      <div class="orbit-dots">
        <div class="orbit-dot"></div>
        <div class="orbit-dot"></div>
        <div class="orbit-dot"></div>
      </div>
    </div>
  `;
}

export function renderResponse(text: string) {
  if (!menu) return;

  lastResponse = text;

  menu.innerHTML = `
    ${headerHtml("Result")}
    <div class="orbit-response"></div>
    ${footerHtml(true)}
  `;

  // textContent, not innerHTML — page-derived text must never be parsed as
  // markup. `white-space: pre-wrap` preserves the line breaks.
  const target = menu.querySelector(".orbit-response");
  if (target) target.textContent = text;
}

export function renderError(message: string) {
  if (!menu) return;

  menu.innerHTML = `
    ${headerHtml("Something went wrong")}
    <div class="orbit-response is-error"></div>
    ${footerHtml(false)}
  `;

  const target = menu.querySelector(".orbit-response");
  if (target) target.textContent = message;
}
