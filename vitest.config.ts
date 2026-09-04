import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    env: { TZ: "Europe/Paris" },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
});
