import { RetrievedBlock } from "../types";

export function formatBlocksForPrompt(blocks: RetrievedBlock[]): string {
  return blocks
    .map((block) => {
      const breadcrumb = block.headingPath.join(" > ");
      return breadcrumb ? `[${breadcrumb}]\n${block.text}` : block.text;
    })
    .join("\n\n");
}
