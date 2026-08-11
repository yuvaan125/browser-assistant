import { classifyPage, SCORING_PROFILES } from "./classifier";
import { getOrBuildBlocks } from "./contextCache";
import {
  retrieveForAsk,
  retrieveForExplain,
  retrieveForPage,
} from "./retriever";
import type { ContextPayload, OrbitAction, SemanticBlock } from "./types";

export interface BuildContextOptions {
  selectedText: string;
  question?: string;
  selectionRange?: Range | null;
}

function headingHierarchyOf(blocks: SemanticBlock[]): string[] {
  const seen = new Set<string>();
  const hierarchy: string[] = [];

  for (const block of blocks) {
    for (const heading of block.headingPath) {
      if (!seen.has(heading)) {
        seen.add(heading);
        hierarchy.push(heading);
      }
    }
  }

  return hierarchy;
}

export function buildContext(
  action: OrbitAction,
  options: BuildContextOptions
): ContextPayload {
  const { selectedText, question, selectionRange = null } = options;

  let retrievedBlocks: SemanticBlock[] = [];

  if (action === "explain" || action === "ask" || action === "explainPage") {
    const { pageType } = classifyPage();
    const { blocks, elementsByBlockId } = getOrBuildBlocks(
      SCORING_PROFILES[pageType]
    );

    if (action === "explain") {
      retrievedBlocks = retrieveForExplain(
        blocks,
        elementsByBlockId,
        selectionRange
      );
    } else if (action === "explainPage") {
      retrievedBlocks = retrieveForPage(blocks);
    } else {
      retrievedBlocks = retrieveForAsk(blocks, question || selectedText);
    }
  }

  return {
    metadata: {
      title: document.title,
      url: window.location.href,
    },
    selectedText,
    question,
    retrievedBlocks: retrievedBlocks.map((block) => ({
      headingPath: block.headingPath,
      text: block.text,
    })),
    headingHierarchy: headingHierarchyOf(retrievedBlocks),
  };
}
