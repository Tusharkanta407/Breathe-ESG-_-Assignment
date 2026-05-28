/**
 * Static SPA build for Vercel (produces dist/index.html + assets).
 * Do NOT use `npm run build` for Vercel — that is TanStack Start (dist/client, no index.html).
 */
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths(), tailwindcss()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    cssCodeSplit: false,
  },
});
