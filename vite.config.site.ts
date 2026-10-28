import { readFileSync } from "node:fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

import { defineConfig, Plugin } from "vite";

import pkg from "./package.json" with { type: "json" };
import { renderReleaseNotes } from "./releaseNotes.ts";

const version = pkg.version;
const majorVersion = version.split(".")[0];
const __dirname = dirname(fileURLToPath(import.meta.url));
const releaseNotesPath = resolve(__dirname, "RELEASE_NOTES.md");

function htmlVersionPlugin(): Plugin {
  return {
    name: "html-version-replace",
    buildStart() {
      this.addWatchFile(releaseNotesPath);
    },
    configureServer(server) {
      server.watcher.add(releaseNotesPath);
      server.watcher.on("change", (path) => {
        if (path === releaseNotesPath) server.ws.send({ type: "full-reload", path: "*" });
      });
    },
    transformIndexHtml(html) {
      html = html.replace(
        "<!-- THEME_PICKER -->",
        `
        <button type="button" class="btn btn-link text-body-secondary text-decoration-none rounded-circle p-2 d-inline-flex align-items-center justify-content-center fs-5"
          data-sdk-theme disabled title="Тема: системная" aria-label="Включить светлую тему">
          <span data-theme-icon="os" class="d-inline-flex"><!-- ICON:circle-half --></span>
          <span data-theme-icon="light" class="d-none"><!-- ICON:sun --></span>
          <span data-theme-icon="dark" class="d-none"><!-- ICON:moon-stars --></span>
        </button>
        <span class="visually-hidden" role="status" data-theme-status></span>`,
      );
      html = html.replace(/<!-- ICON:([a-z-]+) -->/g, (_match, name: string) =>
        readFileSync(
          resolve(__dirname, "node_modules/bootstrap-icons/icons", `${name}.svg`),
          "utf8",
        )
          .replace("<svg ", '<svg aria-hidden="true" focusable="false" ')
          .replace('width="16" height="16"', 'width="1em" height="1em"')
          .replace('class="bi ', 'class="align-text-bottom flex-shrink-0 bi '),
      );
      if (html.includes("<!-- RELEASE_NOTES -->")) {
        html = html.replace("<!-- RELEASE_NOTES -->", () =>
          renderReleaseNotes(readFileSync(releaseNotesPath, "utf8"), majorVersion),
        );
      }
      return html.replace(/__VERSION__/g, version).replace(/__MAJOR_VERSION__/g, majorVersion);
    },
  };
}

export default defineConfig({
  base: "./",
  define: {
    __VERSION__: JSON.stringify(version),
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
    port: 8012,
    open: "/",
  },
  preview: {
    port: 8012,
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
