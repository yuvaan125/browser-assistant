export type AIAction =
  | "explain"
  | "summarize"
  | "translate"
  | "ask";

export interface AIRequest {
  action: AIAction;
  selectedText: string;
  pageTitle: string;
  pageUrl: string;
  pageText: string;
  question?: string;
}