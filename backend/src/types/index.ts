export type AIAction =
  | "explain"
  | "explainPage"
  | "summarize"
  | "translate"
  | "ask";

export interface RetrievedBlock {
  headingPath: string[];
  text: string;
}

export interface OrbitContext {
  metadata: { title: string; url: string };
  selectedText: string;
  question?: string;
  retrievedBlocks: RetrievedBlock[];
  headingHierarchy: string[];
}

export interface AIRequest {
  action: AIAction;
  selectedText: string;
  pageTitle: string;
  pageUrl: string;
  /** @deprecated use `context.retrievedBlocks` instead */
  pageText?: string;
  context?: OrbitContext;
  question?: string;
}