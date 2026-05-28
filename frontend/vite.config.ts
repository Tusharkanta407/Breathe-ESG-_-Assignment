// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

/** Dev proxy target from frontend/.env (VITE_API_BASE) or local Django. */
function devProxyTarget(): string {
  const apiBase = process.env.VITE_API_BASE?.trim();
  if (!apiBase) return "http://127.0.0.1:8000";
  try {
    return new URL(apiBase).origin;
  } catch {
    return "http://127.0.0.1:8000";
  }
}

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    server: {
      proxy: {
        "/api": {
          target: devProxyTarget(),
          changeOrigin: true,
          secure: true,
        },
      },
    },
  },
});
