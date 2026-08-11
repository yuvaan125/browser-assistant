export interface OrbitUser {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

export async function getCurrentUser(): Promise<OrbitUser | null> {
  const result = await chrome.storage.local.get("orbitUser");
  return (result.orbitUser as OrbitUser | undefined) ?? null;
}

export async function signOut() {
  await chrome.storage.local.remove([
    "accessToken",
    "refreshToken",
    "orbitUser",
  ]);
}

export function onAuthStateChange(
  callback: (user: OrbitUser | null) => void
) {
  function listener(
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string
  ) {
    if (areaName !== "local" || !("orbitUser" in changes)) return;
    callback((changes.orbitUser.newValue as OrbitUser | undefined) ?? null);
  }

  chrome.storage.onChanged.addListener(listener);

  return {
    data: {
      subscription: {
        unsubscribe: () => chrome.storage.onChanged.removeListener(listener),
      },
    },
  };
}
