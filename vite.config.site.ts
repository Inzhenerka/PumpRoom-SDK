import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { defineConfig, Plugin } from "vite";

import pkg from "./package.json";

const version = pkg.version;
const majorVersion = version.split(".")[0];
const baseUrl = pkg.homepage.replace(/\/$/, "");
const __dirname = dirname(fileURLToPath(import.meta.url));

function htmlVersionPlugin(): Plugin {
  return {
    name: "html-version-replace",
    transformIndexHtml(html) {
      return html
        .replace(/__VERSION__/g, version)
        .replace(/__MAJOR_VERSION__/g, majorVersion)
        .replace(/__BASE_URL__/g, baseUrl);
    },
  };
}

export default defineConfig({
  define: {
    __VERSION__: JSON.stringify(version),
    __BASE_URL__: JSON.stringify(baseUrl),
  },
  publicDir: resolve(__dirname, "public"),
  build: {
    outDir: resolve(__dirname, "dist"),
    target: "es2015",
    emptyOutDir: false,
    rolldownOptions: {
      checks: {
        pluginTimings: false,
      },
      input: {
        main: resolve(__dirname, "index.html"),
        site: resolve(__dirname, "site.ts"),
        example: resolve(__dirname, "example/index.html"),
      },
    },
  },
  server: {
    port: 8005,
    open: "/",
  },
  preview: {
    port: 8005,
    open: "/",
  },
  plugins: [htmlVersionPlugin()],
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true,
        silenceDeprecations: [
          "import" as const,
          "color-functions" as const,
          "global-builtin" as const,
        ],
      },
    },
  },
});
