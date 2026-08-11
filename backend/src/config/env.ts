import "dotenv/config";

/**
 * Validates required configuration at startup.
 *
 * Without this, a missing variable surfaces as an opaque stack trace from
 * deep inside whichever SDK received `undefined` (Supabase's createClient
 * throws from RealtimeClient, several frames from the actual cause). Failing
 * here instead names the missing variables directly.
 */

const REQUIRED = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GEMINI_API_KEY",
] as const;

type RequiredKey = (typeof REQUIRED)[number];

function loadEnv(): Record<RequiredKey, string> {
  const missing = REQUIRED.filter((key) => !process.env[key]?.trim());

  if (missing.length) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}.\n` +
        `Set them in your host's dashboard (or backend/.env locally). ` +
        `See backend/.env.example.`
    );
  }

  return Object.fromEntries(
    REQUIRED.map((key) => [key, process.env[key] as string])
  ) as Record<RequiredKey, string>;
}

export const env = loadEnv();

export const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
