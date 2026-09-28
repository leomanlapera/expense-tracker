import { defineConfig } from "vitest/config";
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

loadEnv({ path: resolve(process.cwd(), ".env.local"), quiet: true });

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    testTimeout: 20_000,
    hookTimeout: 20_000,
    // Serial: each test creates/deletes real users. Parallel would leak.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": resolve(process.cwd()),
    },
  },
});
