import type { Chunk, SemanticBlock } from "./types";

function samePath(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((value, i) => value === b[i]);
}

export function buildChunks(blocks: SemanticBlock[]): Chunk[] {
  const chunks: Chunk[] = [];

  for (const block of blocks) {
    const current = chunks[chunks.length - 1];

    if (current && samePath(current.headingPath, block.headingPath)) {
      current.blocks.push(block);
      current.combinedText += `\n${block.text}`;
      current.score += block.score;
      continue;
    }

    chunks.push({
      headingPath: block.headingPath,
      blocks: [block],
      combinedText: block.text,
      score: block.score,
    });
  }

  return chunks;
}
