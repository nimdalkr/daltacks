import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@daltacks/stx-utils": path.resolve(__dirname, "../packages/stx-utils/src/index.ts"),
      "@daltacks/tracker-sdk": path.resolve(__dirname, "../packages/tracker-sdk/src/index.ts")
    }
  }
});
