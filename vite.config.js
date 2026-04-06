import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  // Parse SDK expects Node's `events` — Vite's stub breaks EventEmitter in the browser.
  resolve: {
    alias: {
      events: path.resolve(__dirname, "node_modules/events/"),
    },
  },
});
