import { walkDom, type DomWalkResult } from "./domWalker";
import { filterNoise } from "./noiseFilter";
import { scoreBlocks } from "./scoring";
import type { ScoringProfile } from "./scoring";

const TTL_MS = 60_000;
const MUTATION_THRESHOLD = 20;

interface CacheEntry {
  url: string;
  builtAt: number;
  mutationCount: number;
  result: DomWalkResult;
}

let cache: CacheEntry | null = null;
let observer: MutationObserver | null = null;

function startObserving(entry: CacheEntry) {
  observer?.disconnect();

  observer = new MutationObserver((mutations) => {
    entry.mutationCount += mutations.length;
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

function isFresh(entry: CacheEntry): boolean {
  if (entry.url !== window.location.href) return false;
  if (Date.now() - entry.builtAt > TTL_MS) return false;
  if (entry.mutationCount > MUTATION_THRESHOLD) return false;
  return true;
}

export function getOrBuildBlocks(profile?: ScoringProfile): DomWalkResult {
  if (cache && isFresh(cache)) {
    return cache.result;
  }

  const walked = walkDom();
  const filtered = filterNoise(walked.blocks, walked.elementsByBlockId);
  scoreBlocks(filtered, profile);

  const result: DomWalkResult = {
    blocks: filtered,
    elementsByBlockId: walked.elementsByBlockId,
  };

  const entry: CacheEntry = {
    url: window.location.href,
    builtAt: Date.now(),
    mutationCount: 0,
    result,
  };

  cache = entry;
  startObserving(entry);

  return result;
}
