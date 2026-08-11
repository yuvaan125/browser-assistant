import { useEffect, useState } from "react";
import { ArrowLeft, LogOut, User as UserIcon } from "lucide-react";
import type { OrbitUser } from "../auth/session";
import { signOut } from "../auth/session";

import "./AccountView.css";

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
    <>
      <div className="subview-header">
        <button className="btn-icon" onClick={onBack} aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <span className="subview-title">Account</span>
      </div>

      <div className="card">
        <div className="account-profile">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="account-avatar"
            />
          ) : (
            <div className="account-avatar-fallback">
              <UserIcon size={28} />
            </div>
          )}

          <div className="account-identity">
            {user.name && <div className="account-name">{user.name}</div>}
            <div className="account-email">{user.email}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="usage-header">
          <span className="card-label">Daily usage</span>

          {usage && (
            <span className="usage-count">
              {usage.used} / {usage.limit}
            </span>
          )}
        </div>

        {usageError && (
          <div className="usage-state is-error">{usageError}</div>
        )}

        {!usage && !usageError && (
          <div className="usage-state">Loading...</div>
        )}

        {usage && (
          <>
            <div className="usage-track">
              <div
                className={`usage-fill${
                  usage.remaining === 0 ? " is-full" : ""
                }`}
                style={{ width: `${percentUsed}%` }}
              />
            </div>

            <p className="usage-note">
              {usage.remaining > 0
                ? `${usage.remaining} requests remaining today`
                : "Daily limit reached. Resets 24h after your earliest request."}
            </p>
          </>
        )}
      </div>

      <button
        className="btn btn-block btn-danger-ghost"
        onClick={() => signOut()}
      >
        <LogOut size={16} />
        Sign out
      </button>
    </>
  );
}
