import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import baseManifest from "./manifest.json" with { type: "json" };

const LOCAL_BACKEND = "http://localhost:3000";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const backendUrl = env.VITE_BACKEND_URL || LOCAL_BACKEND;

  // manifest.json is static, but the extension can only fetch origins listed
  // in host_permissions — so the deployed backend has to be injected here at
  // build time. src/background/worker.ts reads the same variable for the URL
  // it actually calls. Localhost stays in the list so one build serves both.
  const manifest = {
    ...baseManifest,
    host_permissions: [
      ...new Set([
        `${new URL(backendUrl).origin}/*`,
        `${LOCAL_BACKEND}/*`,
        ...baseManifest.host_permissions,
      ]),
    ],
  };

  return {
    plugins: [react(), crx({ manifest })],
  };
});
