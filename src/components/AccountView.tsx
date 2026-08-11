import { useEffect, useState } from "react";
import { User as UserIcon } from "lucide-react";
import type { OrbitUser } from "../auth/session";
import { signOut } from "../auth/session";

interface AccountViewProps {
  user: OrbitUser;
  onBack: () => void;
}

interface UsageStats {
  used: number;
  limit: number;
  remaining: number;
}

export default function AccountView({ user, onBack }: AccountViewProps) {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [usageError, setUsageError] = useState<string | null>(null);

  useEffect(() => {
    chrome.runtime
      .sendMessage({ type: "GET_USAGE" })
      .then((response) => {
        if (response?.success) {
          setUsage(response.usage);
        } else {
          setUsageError(response?.error ?? "Could not load usage.");
        }
      })
      .catch((err) => setUsageError(String(err)));
  }, []);

  const percentUsed = usage
    ? Math.min(100, Math.round((usage.used / usage.limit) * 100))
    : 0;

  return (
    <div>
      <button onClick={onBack}>← Back</button>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          padding: "24px 0",
        }}
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name ?? user.email ?? "Account"}
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "var(--surface-alt)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <UserIcon size={32} color="var(--text-secondary)" />
          </div>
        )}

        <div style={{ textAlign: "center" }}>
          {user.name && (
            <div style={{ fontSize: 16, fontWeight: 600 }}>{user.name}</div>
          )}
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            {user.email}
          </div>
        </div>
      </div>

      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: 16,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 10,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600 }}>Daily usage</span>

          {usage && (
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              {usage.used} / {usage.limit}
            </span>
          )}
        </div>

        {usageError && (
          <div style={{ fontSize: 12, color: "var(--danger)" }}>
            {usageError}
          </div>
        )}

        {!usage && !usageError && (
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            Loading...
          </div>
        )}

        {usage && (
          <>
            <div
              style={{
                height: 6,
                borderRadius: 999,
                background: "var(--surface-alt)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${percentUsed}%`,
                  height: "100%",
                  background:
                    usage.remaining === 0
                      ? "var(--danger)"
                      : "var(--primary)",
                }}
              />
            </div>

            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "var(--text-secondary)",
              }}
            >
              {usage.remaining > 0
                ? `${usage.remaining} requests remaining today`
                : "Daily limit reached. Resets 24h after your earliest request."}
            </div>
          </>
        )}
      </div>

      <button onClick={() => signOut()} style={{ width: "100%" }}>
        Sign out
      </button>
    </div>
  );
}
