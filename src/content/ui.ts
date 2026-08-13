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

/** Keeps the button and menu clear of the viewport edges. */
const VIEWPORT_MARGIN = 8;

/** Gap between the button and the menu anchored to it. */
const ANCHOR_GAP = 8;

/** Matches .orbit-button in styles.css. */
const BUTTON_SIZE = 42;

/** Min wins when the element is larger than the space available. */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

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

  // A selection ending at the right margin would otherwise push the button
  // half off screen, and one on the first visible line would put it above the
  // fold — rect.top - 10 goes negative there.
  button.style.left = `${clamp(
    viewportX,
    VIEWPORT_MARGIN,
    window.innerWidth - BUTTON_SIZE - VIEWPORT_MARGIN
  )}px`;

  button.style.top = `${clamp(
    viewportY,
    VIEWPORT_MARGIN,
    window.innerHeight - BUTTON_SIZE - VIEWPORT_MARGIN
  )}px`;

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

  // is-open flips display to flex, which gives the menu a real height to
  // measure. It's still at opacity 0 here, so positioning lands before
  // anything is painted and there's no visible jump.
  menu.classList.add("is-open");

  positionMenu();

  requestAnimationFrame(() => menu?.classList.add("is-visible"));
}

export function closeMenu() {
  if (!menu) return;

  menu.classList.remove("is-visible");

  setTimeout(() => menu?.classList.remove("is-open"), 180);
}

/**
 * Anchors the menu to the button, flipping above it when there isn't room
 * below and clamping so it always lands fully inside the viewport.
 *
 * The size is measured rather than assumed, because every view has a different
 * height — a position that fits the loading state overflows once a long
 * response replaces it. That's why the render functions call this too.
 */
export function positionMenu() {
  if (!button || !menu || !menu.classList.contains("is-open")) return;

  const anchor = button.getBoundingClientRect();

  // offset*, not getBoundingClientRect: the rect is post-transform, and the
  // menu sits at scale(0.95) until it fades in, which would under-measure it.
  const width = menu.offsetWidth;
  const height = menu.offsetHeight;

  const spaceBelow =
    window.innerHeight - anchor.bottom - ANCHOR_GAP - VIEWPORT_MARGIN;
  const spaceAbove = anchor.top - ANCHOR_GAP - VIEWPORT_MARGIN;

  // Below is the default; flip only when above is genuinely roomier.
  const openUp = height > spaceBelow && spaceAbove > spaceBelow;

  const top = openUp
    ? anchor.top - ANCHOR_GAP - height
    : anchor.bottom + ANCHOR_GAP;

  menu.style.top = `${clamp(
    top,
    VIEWPORT_MARGIN,
    window.innerHeight - height - VIEWPORT_MARGIN
  )}px`;

  menu.style.left = `${clamp(
    anchor.left,
    VIEWPORT_MARGIN,
    window.innerWidth - width - VIEWPORT_MARGIN
  )}px`;

  // Grow from the edge nearest the button so it reads as opening out of it,
  // rather than swelling from its own centre.
  menu.style.transformOrigin = openUp ? "bottom left" : "top left";
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

  positionMenu();
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

  positionMenu();

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

  positionMenu();
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

  // After the text lands — the response is the one view whose height depends
  // on its content, so measuring before this would be measuring an empty box.
  positionMenu();
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

  positionMenu();
}
