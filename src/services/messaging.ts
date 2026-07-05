import type { PageInfo } from "../types/page";

export async function getPageInfo(): Promise<PageInfo> {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (!tab.id) {
    throw new Error("No active tab found.");
  }

  const response = await chrome.tabs.sendMessage(tab.id, {
    type: "GET_PAGE_INFO",
  });

  return response;
}