import type { BlockType } from "./types";

export type PageType =
  | "github"
  | "documentation"
  | "shopping"
  | "article"
  | "form"
  | "generic";

export interface PageClassification {
  pageType: PageType;
  confidence: number;
}

type UrlRule = { test: RegExp; type: PageType; weight: number };

const URL_RULES: UrlRule[] = [
  { test: /(^|\.)github\.com$/i, type: "github", weight: 50 },
  {
    test: /docs\.|\/docs(\/|$)|readthedocs\.|developer\./i,
    type: "documentation",
    weight: 40,
  },
  {
    test: /amazon\.|shop\.|\/(product|products|item|cart)(\/|$)/i,
    type: "shopping",
    weight: 40,
  },
];

export const SCORING_PROFILES: Record<
  PageType,
  Partial<Record<BlockType, number>>
> = {
  github: { code: 1.4, heading: 1.1 },
  documentation: { code: 1.3, heading: 1.2 },
  shopping: { table: 1.4, list: 1.2 },
  article: { paragraph: 1.3 },
  form: { form: 1.5 },
  generic: {},
};

function scoreUrl(url: string): Partial<Record<PageType, number>> {
  const scores: Partial<Record<PageType, number>> = {};

  for (const rule of URL_RULES) {
    if (rule.test.test(url)) {
      scores[rule.type] = (scores[rule.type] ?? 0) + rule.weight;
    }
  }

  return scores;
}

function scoreDom(root: Element): Partial<Record<PageType, number>> {
  const scores: Partial<Record<PageType, number>> = {};

  const codeBlocks = root.querySelectorAll("pre code, pre").length;
  if (codeBlocks > 0) {
    scores.documentation = (scores.documentation ?? 0) + Math.min(30, codeBlocks * 5);
    scores.github = (scores.github ?? 0) + Math.min(20, codeBlocks * 3);
  }

  if (root.querySelector("article")) {
    scores.article = (scores.article ?? 0) + 30;
  }

  const productHints = root.querySelectorAll(
    '[itemtype*="Product"], [itemprop="price"], [class*="price"]'
  ).length;
  if (productHints > 0) {
    scores.shopping = (scores.shopping ?? 0) + Math.min(30, productHints * 6);
  }

  const formCount = root.querySelectorAll("form").length;
  if (formCount > 0) {
    scores.form = (scores.form ?? 0) + Math.min(30, formCount * 15);
  }

  const paragraphCount = root.querySelectorAll("p").length;
  const headingCount = root.querySelectorAll("h1, h2, h3, h4, h5, h6").length;
  if (paragraphCount > 8 && headingCount <= 3) {
    scores.article = (scores.article ?? 0) + 15;
  }

  return scores;
}

export function classifyPage(
  root: Element = document.body,
  url: string = window.location.href
): PageClassification {
  const totals = new Map<PageType, number>();

  const add = (scores: Partial<Record<PageType, number>>) => {
    for (const [type, value] of Object.entries(scores) as [
      PageType,
      number
    ][]) {
      totals.set(type, (totals.get(type) ?? 0) + value);
    }
  };

  add(scoreUrl(url));
  add(scoreDom(root));

  let best: PageType = "generic";
  let bestScore = 0;

  for (const [type, score] of totals) {
    if (score > bestScore) {
      best = type;
      bestScore = score;
    }
  }

  return { pageType: best, confidence: bestScore };
}
