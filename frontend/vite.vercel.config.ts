/**
 * Static SPA build for Vercel (produces dist/index.html).
 * Local dev still uses vite.config.ts (TanStack Start).
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

function readDotEnv(): Record<string, string> {
  const path = resolve(process.cwd(), ".env");
  if (!existsSync(path)) return {};
  const vars: Record<string, string> = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return vars;
}

const apiBase =
  process.env.VITE_API_BASE?.trim() || readDotEnv().VITE_API_BASE?.trim() || "";

export default defineConfig({
  plugins: [react(), tsconfigPaths(), tailwindcss()],
  define: {
    "import.meta.env.VITE_API_BASE": JSON.stringify(apiBase),
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
