# PumpRoom SDK

[![npm version](https://badge.fury.io/js/pumproom-sdk.svg)](https://www.npmjs.com/package/pumproom-sdk)

Lightweight library for integrating LMS with PumpRoom. Provides methods for API authentication and message exchange.

# SDK Usage

**[📖 Integration and usage guide](https://pumproom-sdk.inzhenerka-cloud.com/)**

## Authentication cache

Cached credentials are bound to the current LMS identity and realm. Existing cache
entries migrate automatically after a successful authentication. If an LMS account
changes without reloading the page, call `authenticate()` again with the new identity.

## Trusted iframe origins

When `trustedOrigins` is omitted, SDK messages are accepted only from embedded iframes at standard
PumpRoom origins:
`https://pumproom.inzhenerka-cloud.com`, `https://dev.pumproom.inzhenerka-cloud.com`,
`https://dev-pumproom.inzhenerka-cloud.com`.
For a custom deployment, provide the complete list of trusted origins (no wildcard or path):

```ts
init({ apiKey: "...", realm: "...", trustedOrigins: ["https://tasks.school.example"] });
```

An explicitly configured `trustedOrigins` list replaces the standard origins. Use an empty list to
reject messages from every iframe origin.

## Custom API URL

On-premises deployments can route all SDK requests to their own PumpRoom API:

```ts
init({
  apiKey: "...",
  realm: "...",
  apiBaseUrl: "https://pumproom.school.example/api",
});
```

## Stable content URL

For SCORM players that launch different SCOs from the same browser URL, provide a stable canonical
URL for the current content. The SDK uses it for API requests and local cache keys:

```ts
init({
  apiKey: "...",
  realm: "...",
  pageUrl: "https://lms.example/scorm/course-42/lesson-1",
});
```

When omitted, the SDK uses `window.location.href`. Query parameters and fragments are removed in
both cases.

# SDK Development

## Installing Dependencies

Requirements:

- Node.js >=22.12
- Bun

To install dependencies:

```bash
bun install
```

## Building

```bash
bun run build
```

## Running the Development Server

The server runs Vite with live reload. The landing page is displayed at `/`, and
the example from the `example` directory is available at `/example/`.

```bash
bun dev
```

### Testing

Run unit tests and get a coverage report with the command:

```bash
bun run test
```

The HTML report will appear in the `coverage` directory.

### Publishing

Prepare and inspect a release without changing the repository:

```bash
bun run release:dry-run
```

Create the release commit and tag:

```bash
bun run release
```

`release-it` selects the next version from conventional commits, updates `package.json`, creates
and pushes the release commit and `v*` tag. The tag workflow tests and builds the exact revision,
publishes the npm package, deploys the SDK site, and creates the GitHub Release.

### Learning results

Register the callback before loading the iframe to receive its saved result and subsequent changes:

```typescript
import { setOnTaskResultChangedCallback } from "pumproom-sdk";

setOnTaskResultChangedCallback(({ task, taskResult }) => {
  console.log(task.uid, taskResult);
});
```

The event describes the main embedded task; nested Master steps do not replace its result.
The UI suppresses repeated revisions within the current load. Loading the task again emits its current result.

Result fields retain their API names: `completion_status` (`not_attempted`, `incomplete`, `completed`),
`success_status` (`unknown`, `passed`, `failed`), `score` (0–100 or null),
`progress` (0–1 or null), `revision` and `updated_at` (ISO datetime or null).
A null result means no persisted result is available, for example for anonymous access.
`onResultReady` remains the separate notification about an individual submission.
