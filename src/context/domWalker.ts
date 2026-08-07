import { computeSignals } from "./signals";
import type { BlockType, SemanticBlock } from "./types";

const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "TEMPLATE",
  "IFRAME",
  "SVG",
]);

const HEADING_RE = /^H[1-6]$/;

interface HeadingStackEntry {
  level: number;
  text: string;
}

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function isHidden(el: Element): boolean {
  if (el.hasAttribute("hidden")) return true;
  if (el.getAttribute("aria-hidden") === "true") return true;

  const style = window.getComputedStyle(el);

  if (style.display === "none" || style.visibility === "hidden") {
    return true;
  }

  if (el instanceof HTMLElement && el.offsetParent === null) {
    // offsetParent is null for elements with position:fixed too, so also
    // allow through anything that reports non-zero layout size.
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return true;
  }

  return false;
}

function tableToText(el: Element): string {
  const rows = el.querySelectorAll(":scope > tr, :scope > thead > tr, :scope > tbody > tr");

  const lines: string[] = [];

  rows.forEach((row) => {
    const cells = Array.from(row.querySelectorAll("th, td")).map((cell) =>
      collapseWhitespace(cell.textContent ?? "")
    );

    if (cells.some(Boolean)) {
      lines.push(cells.join(" | "));
    }
  });

  return lines.join("\n");
}

function listToText(el: Element): string {
  const items = el.querySelectorAll(":scope > li");

  return Array.from(items)
    .map((li) => `- ${collapseWhitespace(li.textContent ?? "")}`)
    .filter((line) => line !== "-")
    .join("\n");
}

function extractBlockContent(
  el: Element,
  tag: string
): { type: BlockType; text: string } | null {
  if (HEADING_RE.test(tag)) {
    const text = collapseWhitespace(el.textContent ?? "");
    return text ? { type: "heading", text } : null;
  }

  switch (tag) {
    case "P":
    case "BLOCKQUOTE": {
      const text = collapseWhitespace(el.textContent ?? "");
      return text
        ? { type: tag === "P" ? "paragraph" : "blockquote", text }
        : null;
    }

    case "PRE": {
      const text = (el.textContent ?? "").trim();
      return text ? { type: "code", text } : null;
    }

    case "TABLE": {
      const text = tableToText(el);
      return text ? { type: "table", text } : null;
    }

    case "UL":
    case "OL": {
      const text = listToText(el);
      return text ? { type: "list", text } : null;
    }

    case "IMG": {
      const alt = collapseWhitespace(el.getAttribute("alt") ?? "");
      return alt ? { type: "image", text: alt } : null;
    }

    case "LABEL": {
      const text = collapseWhitespace(el.textContent ?? "");
      return text ? { type: "form", text } : null;
    }

    case "INPUT": {
      const value =
        el.getAttribute("value") || el.getAttribute("placeholder") || "";
      const text = collapseWhitespace(value);
      return text ? { type: "form", text } : null;
    }

    default:
      return null;
  }
}

const LEAF_TAGS = new Set([
  "P",
  "BLOCKQUOTE",
  "PRE",
  "TABLE",
  "UL",
  "OL",
  "IMG",
  "LABEL",
  "INPUT",
]);

export interface DomWalkResult {
  blocks: SemanticBlock[];
  elementsByBlockId: Map<string, Element>;
}

export function walkDom(root: Element = document.body): DomWalkResult {
  const blocks: SemanticBlock[] = [];
  const elementsByBlockId = new Map<string, Element>();
  const headingStack: HeadingStackEntry[] = [];

  let nextId = 0;

  function visit(el: Element, domDepth: number) {
    const tag = el.tagName;

    if (SKIP_TAGS.has(tag)) return;
    if (isHidden(el)) return;

    if (HEADING_RE.test(tag)) {
      const content = extractBlockContent(el, tag);

      if (content) {
        const level = Number(tag[1]);

        while (
          headingStack.length &&
          headingStack[headingStack.length - 1].level >= level
        ) {
          headingStack.pop();
        }

        headingStack.push({ level, text: content.text });

        pushBlock(el, tag, content.type, content.text, domDepth);
      }

      return;
    }

    if (LEAF_TAGS.has(tag)) {
      const content = extractBlockContent(el, tag);

      if (content) {
        pushBlock(el, tag, content.type, content.text, domDepth);
      }

      return;
    }

    for (const child of Array.from(el.children)) {
      visit(child, domDepth + 1);
    }
  }

  function pushBlock(
    el: Element,
    tag: string,
    type: BlockType,
    text: string,
    domDepth: number
  ) {
    const id = `block-${nextId++}`;

    const block: SemanticBlock = {
      id,
      type,
      tag,
      text,
      headingPath: headingStack.map((h) => h.text),
      depth: domDepth,
      signals: computeSignals(el, text, domDepth),
      score: 0,
    };

    blocks.push(block);
    elementsByBlockId.set(id, el);
  }

  visit(root, 0);

  return { blocks, elementsByBlockId };
}
