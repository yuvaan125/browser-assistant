import type { BlockSignals } from "./types";

function headingLevelOf(tag: string): number {
  const match = /^H([1-6])$/i.exec(tag);
  return match ? Number(match[1]) : 0;
}

function linkTextLength(el: Element): number {
  let total = 0;

  el.querySelectorAll("a").forEach((anchor) => {
    total += (anchor.textContent ?? "").trim().length;
  });

  return total;
}

function codeTextLength(el: Element, tag: string): number {
  let total = tag === "PRE" || tag === "CODE" ? (el.textContent ?? "").length : 0;

  el.querySelectorAll("pre, code").forEach((code) => {
    total += (code.textContent ?? "").length;
  });

  return total;
}

export function computeSignals(
  el: Element,
  text: string,
  domDepth: number
): BlockSignals {
  const tag = el.tagName;
  const textLength = text.length;

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const linkLength = linkTextLength(el);
  const codeLength = codeTextLength(el, tag);

  const imageCount =
    (tag === "IMG" ? 1 : 0) + el.querySelectorAll("img").length;

  const tableCount =
    (tag === "TABLE" ? 1 : 0) + el.querySelectorAll("table").length;

  return {
    wordCount,
    textLength,
    linkDensity: textLength > 0 ? Math.min(1, linkLength / textLength) : 0,
    codeDensity: textLength > 0 ? Math.min(1, codeLength / textLength) : 0,
    childCount: el.children.length,
    domDepth,
    headingLevel: headingLevelOf(tag),
    imageCount,
    tableCount,
  };
}
