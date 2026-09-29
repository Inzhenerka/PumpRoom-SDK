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
the example from the `example` directory is available at `/example/`. Copy `.env.example`
to `.env.local` to configure the example credentials. The development server listens on
`http://localhost:8012`.

```bash
bun dev
```

## On-premises site

The documentation site and browser bundles are distributed as an immutable nginx image. Bundle
links shown on the site are based on the browser's current origin, so the same image works under
the cloud domain and a customer domain without rebuilding it.

1. Copy and edit the environment template:

   ```shell
   cp .env.onprem.example .env.onprem
   ```

2. Pull and start the versioned image:

   ```shell
   docker compose --env-file .env.onprem pull
   docker compose --env-file .env.onprem up -d
   ```

By default, the site listens on `http://localhost:8012`; its health endpoint is
`http://localhost:8012/healthz`. Put an ingress or reverse proxy with TLS in front of the
container. Set `PUMPROOM_SDK_BIND_ADDRESS=0.0.0.0` only when direct external access is intentional.

| Variable                    | Required | Purpose                                  |
| --------------------------- | -------- | ---------------------------------------- |
| `PUMPROOM_SDK_IMAGE`        | yes      | Versioned GHCR image or immutable digest |
| `PUMPROOM_SDK_PORT`         | no       | Host port; defaults to `8012`            |
| `PUMPROOM_SDK_BIND_ADDRESS` | no       | Bind address; defaults to `127.0.0.1`    |

The SDK library itself does not read container environment variables. An LMS configures its
PumpRoom API and iframe origins explicitly through `init({ apiBaseUrl, trustedOrigins })`, which
keeps npm, CDN and on-premises usage identical. To build the container from the current checkout:

```shell
docker compose -f compose.yaml -f compose.build.yaml --env-file .env.onprem up -d --build
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
publishes the npm package and GHCR image, deploys the SDK site through Coolify, and creates the
GitHub Release. Configure the repository secrets `COOLIFY_WEBHOOK` and `COOLIFY_TOKEN` before the
first deployment.

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
