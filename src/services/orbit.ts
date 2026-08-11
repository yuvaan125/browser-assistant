import type { ContextPayload, OrbitAction } from "../context/types";

interface RunActionOptions {
  selectedText?: string;
  question?: string;
}

/**
 * Runs an AI action from the popup.
 *
 * The popup has no DOM access to the page, so context is built by the content
 * script, then handed to the background worker — the same ORBIT_ACTION path the
 * floating button uses, which owns auth, token refresh and error handling.
 */
export async function runAction(
  action: OrbitAction,
  options: RunActionOptions = {}
): Promise<string> {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (!tab.id) {
    throw new Error("No active tab found.");
  }

  const context = (await chrome.tabs.sendMessage(tab.id, {
    type: "BUILD_CONTEXT",
    action,
    question: options.question,
  })) as ContextPayload;

  const response = await chrome.runtime.sendMessage({
    type: "ORBIT_ACTION",
    action,
    selectedText: options.selectedText ?? context.selectedText,
    question: options.question,
    pageTitle: context.metadata.title,
    pageUrl: context.metadata.url,
    context,
  });

  if (!response?.success) {
    throw new Error(response?.error ?? "Something went wrong.");
  }

  return response.result;
}
