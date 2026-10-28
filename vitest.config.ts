import { readFileSync } from "fs";

import { defineConfig } from "vitest/config";

const pkg = JSON.parse(readFileSync("./package.json", "utf8"));

export default defineConfig({
  define: {
    __VERSION__: JSON.stringify(pkg.version),
  },
  test: {
    environment: "happy-dom",
    setupFiles: ["./tests/setup.ts"],
    environmentOptions: {
      happyDOM: {
        settings: {
          // Create iframe windows for messaging tests without loading remote pages.
          enableIframePageLoading: true,
          navigation: { disableChildFrameNavigation: true },
        },
      },
    },
    coverage: {
      provider: "istanbul",
      reporter: ["text", "html", "json-summary", "json"],
      reportOnFailure: true,
      exclude: ["example/**", "vite*.ts", "dist", "public", "src/types/**"],
    },
  },
});
