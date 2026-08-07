import type { SemanticBlock } from "./types";

const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "of",
  "on",
  "in",
  "to",
  "for",
  "and",
  "or",
  "does",
  "do",
  "is",
  "are",
  "this",
  "that",
  "what",
  "page",
  "about",
  "how",
  "with",
]);

function tokenize(text: string): string[] {
  const words = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return words.filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

export function retrieveForExplain(
  blocks: SemanticBlock[],
  elementsByBlockId: Map<string, Element>,
  selectionRange: Range | null
): SemanticBlock[] {
  if (!selectionRange) return [];

  let anchorIndex = -1;

  for (let i = 0; i < blocks.length; i++) {
    const el = elementsByBlockId.get(blocks[i].id);
    if (el && selectionRange.intersectsNode(el)) {
      anchorIndex = i;
      break;
    }
  }

  if (anchorIndex === -1) return [];

  const start = Math.max(0, anchorIndex - 1);
  const end = Math.min(blocks.length - 1, anchorIndex + 1);

  return blocks.slice(start, end + 1);
}

const ASK_CHAR_BUDGET = 4000;

export function retrieveForAsk(
  blocks: SemanticBlock[],
  question: string
): SemanticBlock[] {
  const questionTokens = tokenize(question);

  const withRelevance = blocks.map((block, index) => {
    const blockTokens = tokenize(block.text);
    const overlap = questionTokens.filter((token) =>
      blockTokens.includes(token)
    ).length;

    const relevance =
      overlap > 0 ? overlap * 10 + block.score : block.score * 0.05;

    return { block, index, relevance };
  });

  withRelevance.sort((a, b) => b.relevance - a.relevance);

  const selected: typeof withRelevance = [];
  let charTotal = 0;

  for (const entry of withRelevance) {
    if (charTotal >= ASK_CHAR_BUDGET) break;
    selected.push(entry);
    charTotal += entry.block.text.length;
  }

  selected.sort((a, b) => a.index - b.index);

  return selected.map((entry) => entry.block);
}
