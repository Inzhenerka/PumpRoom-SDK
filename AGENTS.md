# PumpRoom SDK — agent instructions

## Project and sources

- This repository contains a browser SDK for LMS integration and its documentation site.
- `src/index.ts` defines the public SDK exports. SDK code lives in `src/`, including the opt-in
  SCORM adapter in `src/scorm/`. Preserve existing public contracts and iframe-origin validation.
- `index.html` and `site.ts` implement the Russian integration guide. `example/` contains a live
  integration demo, not an isolated test fixture.
- `README.md` documents SDK usage and development. TypeDoc uses `typedoc.json`, source comments
  and `docs/index.md`; the latter includes the README rather than duplicating it.
- `dist/`, `public/docs/`, `.generated/` and `coverage/` are generated outputs. Edit their sources.

## Implementation

- Study nearby implementations and reuse existing methods before introducing new patterns.
  Keep changes focused and dependencies minimal. Use modern TypeScript for application logic.
- Write source comments and public API documentation in English for TypeDoc. Keep the main
  integration guide and its controls in Russian.
- Keep site-only styles, icons and theme logic out of the published SDK entry point and bundles.
- Use Bun as configured by `package.json` and `bunfig.toml`; keep dependency changes synchronized
  with `bun.lock`. Read current engine and version requirements from the project configuration.

## Site design and themes

- Prefer the existing Bootstrap 5.3 components, grid and utilities over custom layout or CSS.
  Use semantic, color-mode-aware utilities such as `bg-body`, `bg-body-tertiary` and
  `text-body-secondary`. Fixed colors need a concrete reason, such as preserving logo artwork.
- Shared brand tokens live in `src/styles/_theme.scss`. The Bootstrap site styles are compiled
  from `src/styles/bootstrap.scss`. Let Bootstrap derive related theme colors from these tokens.
- Use Bootstrap Icons instead of emoji in interface controls and main section headings.
  `vite.config.site.ts` expands the existing icon markers to selected inline SVGs at build time;
  do not load the full icon font or add a runtime CDN dependency. Decorative icons are hidden
  from assistive technology; controls retain meaningful labels.
- The theme button cycles light → dark → system → light, matching PumpRoom UI and Admin.
  `public/theme-init.js` applies the preference before styles load; `theme.ts` handles interaction,
  OS changes and cross-tab updates. Preserve both entry points and their storage-failure fallback.
- Share TypeDoc's `tsd-theme` preference key and `light`, `dark`, `os` values. Bootstrap uses
  `data-bs-theme` for the resolved light/dark mode. Syntax highlighting must follow the theme.
- Keep TypeDoc's standard layout, search and native theme picker. Use its supported options in
  `typedoc.json` for customization. `src/styles/typedoc.scss` maps Bootstrap tokens to TypeDoc's
  native palette through `customCss`; do not import Bootstrap component CSS into TypeDoc pages.
- Check light/dark appearance, keyboard access, narrow layouts, code overflow and copy controls.
  Preserve deployment under a URL subdirectory and links between the guide and nested API pages.

## Release notes and publishing

- `RELEASE_NOTES.md` is the source of the website's release history. `releaseNotes.ts` renders it
  into the `<!-- RELEASE_NOTES -->` marker during development and builds.
- Never add hand-written release announcements or duplicate release entries directly to HTML.
  Design, styling and usability improvements do not need a public announcement unless requested.
- For release notes that are needed, use the existing `# v<major>` and `## <version> — <title>`
  Markdown structure. Do not invent a release number or change the package version for a UI edit.
- Release commands create/push commits and tags and trigger npm publication and deployment.
  Run them only when the user requests a release; consult README and the workflows first.

## Validation and build inputs

- Use `bun run check`, `bun run lint` and `bun run format:check` for changed code/configuration.
  Run relevant tests with `bunx vitest run <test paths>`; `bun run test` runs the full suite with
  coverage. Add tests for meaningful behavior changes, not static cosmetic details.
- For site or documentation changes run `bun run build-site`. `bun run docs` compiles the TypeDoc
  palette and regenerates its HTML. Use `bun run build` when verifying the full distributable.
- Inspect the site in a browser for visual changes. The static guide at `/` does not initialize
  the SDK. Opening `/example/` authenticates against its configured API and its controls can write
  state: use mocked tests or an explicitly configured isolated environment for those actions.
- `bun run dev` builds the library/docs and starts Vite; `bun run preview` serves an existing
  production build. The configured port is 8012.
- When adding build inputs, update both `Dockerfile` and the allowlist in `.dockerignore` as needed.
  The nginx image must build the same guide, docs and local assets as the normal site build.
- Do not expose `.env.local` values, learner tokens or other credentials in logs or documentation.
