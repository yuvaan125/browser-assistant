import type { SemanticBlock } from "./types";

const MIN_TEXT_LENGTH = 25;
const MAX_LINK_DENSITY = 0.6;

const NOISE_KEYWORDS = [
  "cookie",
  "subscribe",
  "privacy policy",
  "advertisement",
  "sign in",
  "log in",
  "login",
  "register",
  "newsletter",
  "accept all",
  "share this",
];

function matchesNoiseKeyword(haystack: string): boolean {
  const lower = haystack.toLowerCase();
  return NOISE_KEYWORDS.some((keyword) => lower.includes(keyword));
}

export function filterNoise(
  blocks: SemanticBlock[],
  elementsByBlockId: Map<string, Element>
): SemanticBlock[] {
  return blocks.filter((block) => {
    if (block.type === "heading") return true;

    if (block.signals.textLength < MIN_TEXT_LENGTH) return false;

    if (block.signals.linkDensity > MAX_LINK_DENSITY) return false;

    const el = elementsByBlockId.get(block.id);
    const attrHints = el
      ? `${el.id} ${el.className}`.toLowerCase()
      : "";

    if (matchesNoiseKeyword(block.text) || matchesNoiseKeyword(attrHints)) {
      return false;
    }

    return true;
  });
}
