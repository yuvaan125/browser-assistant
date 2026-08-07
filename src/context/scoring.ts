import type { BlockType, SemanticBlock } from "./types";

const BASE_TYPE_WEIGHT: Record<BlockType, number> = {
  heading: 40,
  code: 30,
  table: 30,
  paragraph: 20,
  list: 18,
  blockquote: 15,
  image: 5,
  form: 5,
};

export function scoreBlock(block: SemanticBlock): number {
  const base = BASE_TYPE_WEIGHT[block.type] ?? 10;

  const lengthBonus = Math.min(
    30,
    Math.log2(block.signals.textLength + 1) * 4
  );

  const headingBonus =
    block.signals.headingLevel > 0
      ? (7 - block.signals.headingLevel) * 3
      : 0;

  const depthPenalty = Math.min(15, block.signals.domDepth * 0.5);

  const linkPenalty = block.signals.linkDensity * 20;

  const score = base + lengthBonus + headingBonus - depthPenalty - linkPenalty;

  return Math.max(0, Math.round(score));
}

export function scoreBlocks(blocks: SemanticBlock[]): SemanticBlock[] {
  blocks.forEach((block) => {
    block.score = scoreBlock(block);
  });

  return blocks;
}
