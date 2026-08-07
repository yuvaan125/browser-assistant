export type BlockType =
  | "heading"
  | "paragraph"
  | "code"
  | "table"
  | "list"
  | "blockquote"
  | "image"
  | "form";

export interface BlockSignals {
  wordCount: number;
  textLength: number;
  linkDensity: number;
  codeDensity: number;
  childCount: number;
  domDepth: number;
  headingLevel: number;
  imageCount: number;
  tableCount: number;
}

export interface SemanticBlock {
  id: string;
  type: BlockType;
  tag: string;
  text: string;
  headingPath: string[];
  depth: number;
  signals: BlockSignals;
  score: number;
}

export type OrbitAction = "explain" | "summarize" | "translate" | "ask";

export interface ContextMetadata {
  title: string;
  url: string;
}

export interface RetrievedBlock {
  headingPath: string[];
  text: string;
}

export interface ContextPayload {
  metadata: ContextMetadata;
  selectedText: string;
  question?: string;
  retrievedBlocks: RetrievedBlock[];
  headingHierarchy: string[];
}
