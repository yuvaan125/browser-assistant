const API_KEY_STORAGE = "openai_api_key";

export async function getApiKey(): Promise<string | null> {
  const result = (await chrome.storage.local.get(
    API_KEY_STORAGE
  )) as Record<string, unknown>;

  const apiKey = result[API_KEY_STORAGE];

  return typeof apiKey === "string" ? apiKey : null;
}

export async function saveApiKey(key: string): Promise<void> {
  await chrome.storage.local.set({
    [API_KEY_STORAGE]: key.trim(),
  });
}

export async function removeApiKey(): Promise<void> {
  await chrome.storage.local.remove(API_KEY_STORAGE);
}