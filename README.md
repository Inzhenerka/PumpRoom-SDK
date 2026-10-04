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

The SDK bundle is identical for cloud and on-premises deployments. Cloud integration examples
use built-in defaults. For on-premises, the application must configure both its API address and
the trusted origin of the PumpRoom UI in the same `init()` call:

```ts
init({
  apiKey: "...",
  realm: "...",
  apiBaseUrl: "https://pumproom.school.example/api",
  trustedOrigins: ["https://tasks.school.example"],
});
```

Loading the bundle from a local SDK server does not change these defaults. `trustedOrigins`
contains the UI origin (protocol, host and port, without a path), not the LMS or SDK server address.
Explicit configuration applies equally to npm, UMD, ESM and GetCourse integrations.

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

## Managed task embedding

`mountTask()` creates one iframe and owns its event handlers and lifetime. It does not
authenticate: call `init()` and `authenticate()` / `setUser()` first for an authenticated task.
For anonymous examples, pass `user: null`; no SDK initialization is required.

```ts
import { mountTask } from "pumproom-sdk";

const task = mountTask(document.getElementById("task")!, {
  url: "https://tasks.school.example/?realm=school&repo_name=course&task_name=lesson",
  title: "Lesson",
  user: null,
  onTaskResultChanged: (data) => console.log(data.taskResult),
  onError: (error) => console.error(error),
});
await task.ready;
// On component unmount or before replacing the task:
task.destroy();
```

`ready` waits for the task's `onTaskLoaded` message, not the iframe's HTML load event.
The default timeout is 30 seconds (`timeoutMs`); height defaults to 600 pixels (`height`).
An optional `taskUid` filters events to the expected task. Pass an `AbortSignal` to cancel loading
or destroy the frame. Timeout/load failure removes the iframe; callback errors are reported
without removing a working task. `destroy()` is idempotent and rejects pending readiness.

Events are scoped to the exact iframe window and URL origin. Managed frames do not invoke global
SDK callbacks or use global message responders; manually embedded iframes continue to work as before.
Credentials and environment are captured when mounting. Reauthentication or a realm change requires
destroying and mounting again. For authenticated frames, the URL realm and origin must match the
SDK configuration (`trustedOrigins` for custom deployments). `user: null` prevents credential sharing
with public examples even if another task on the page is authenticated.

## SCORM launch page

For a SCO containing one task, the SDK handles connection, identity mapping, authentication,
embedding and result reporting in one call:

```ts
import { mountScormTask } from "./pumproom-sdk.esm.js";

const task = await mountScormTask(document.getElementById("task")!, {
  apiKey: "PUBLIC_INTEGRATION_KEY",
  realm: "school",
  apiBaseUrl: "https://api.school.example",
  url: "https://tasks.school.example/?realm=school&repo_name=course&task_name=lesson",
  taskUid: "TASK_UID",
  lmsId: "school-lms",
  scormVersion: "2004",
  pageUrl: "https://lms.school.example/content/lesson-1",
  onError: (error) => console.error("Could not save or load the task", error),
});
// For an explicit close action; normal pagehide is also handled by the SCORM adapter:
// task.destroy();
```

Catch rejection of `mountScormTask()` in the launch page and display a startup error. The resolved
handle exposes the iframe, `ready`, `scorm` and `destroy()`. Destruction also finishes the SCORM
session and may throw if the LMS rejects persistence. `signal` cancels authentication/loading
or closes the mounted task. Use one SCORM mount per launch document; it owns SDK configuration.

Embedding settings and event callbacks are shared with `mountTask()`. The URL realm must match
the configured realm. `onTaskResultChanged` runs after reporting to the LMS, even if that reporting
fails; LMS and callback errors are delivered to `onError`. Learner credentials are managed by
the wrapper, so it does not accept a `user` option.

The default LMS identity is `encodeURIComponent(lmsId) + ":" + encodeURIComponent(learner.id)`.
Keep `lmsId` stable per installation, not per course. For existing users, supply
`mapLearner: learner => ({ provider: "lms", id: existingId(learner.id) })` to preserve the existing
identity scheme. Authentication caching is off by default in this wrapper. The LMS learner ID is
not cryptographic proof of identity; use the integration's public key, never an administrative secret.

### Low-level SCORM adapter

SCORM support is included in the main SDK bundle but remains opt-in: call `connectScorm()`
from the launch page hosted by the LMS, not from the cross-origin PumpRoom UI iframe.
Importing or initializing the SDK does not initialize SCORM.
One connection reports one PumpRoom task as one SCO.

```ts
import { connectScorm, setOnTaskResultChangedCallback } from "pumproom-sdk";

const scorm = connectScorm({
  taskUid: "YOUR_TASK_UID",
  version: "2004", // Must match imsmanifest.xml; "1.2" is also supported.
  onError: (error) => console.error("SCORM lifecycle error", error),
});
if (!scorm) throw new Error("The LMS SCORM API is not accessible");

const learner = scorm.getLearner();
console.log(learner.id, learner.name);

// Register before loading the iframe; combine with your existing callback if needed.
setOnTaskResultChangedCallback((data) => {
  try {
    scorm.handleTaskResult(data);
  } catch (error) {
    // Surface persistence failures to the learner; never claim the grade was saved.
    console.error("Could not save the result to the LMS", error);
  }
});
```

The snippet only wires result reporting. The launch page still configures the ordinary SDK with
`init()`, authenticates the learner and creates the task iframe. Treat `learner.id` as an LMS-local
identifier, not an email or proof of identity. Define an installation-scoped identity mapping agreed
with your PumpRoom integration; SCORM itself does not provide trusted server-side authentication.
Use a stable `pageUrl`, the customer's `apiBaseUrl` and explicit `trustedOrigins` for on-premises.

The adapter discovers the API in accessible parent/opener windows, initializes it explicitly and
throws on rejected LMS operations. `connectScorm()` returns `null` when no compatible API is
accessible (including cross-origin restrictions). Specify `instanceUid` if the same task appears
in multiple iframes. It uses events already validated by the SDK, without installing a second
message listener or replacing SDK callbacks.

| PumpRoom result     | SCORM 2004                                | SCORM 1.2                                |
| ------------------- | ----------------------------------------- | ---------------------------------------- |
| `completion_status` | `cmi.completion_status`                   | Combined into `cmi.core.lesson_status`   |
| `success_status`    | `cmi.success_status`                      | Used only when completion is `completed` |
| `score` (0–100)     | Raw score, min/max and scaled score (0–1) | Raw score and min/max                    |
| `progress` (0–1)    | `cmi.progress_measure`                    | Not reported: no equivalent field        |

In 1.2, an incomplete failed task stays `incomplete`; a completed task becomes `passed`, `failed`
or `completed` when success is unknown. Unknown (`null`) scores/progress are not written, so any
previous LMS numeric value remains unchanged. Null results and unsaved initial snapshots
(`revision: 0`, `not_attempted`) do not overwrite resumed LMS data. A persisted result is reported
on first receipt; subsequent duplicate/older revisions are ignored after a successful commit.
A failed write/commit throws and the same event can be retried; retries are not automatic.

Each result is committed immediately. By default, `pagehide` commits elapsed session time and
terminates the session, or only commits if the page enters the browser's back/forward cache.
Unfinished work uses `suspend`; finished work uses the version's normal exit value. Explicitly call
`finish()` from your own close flow if needed; successful repeated calls are harmless. For full
lifecycle control use `autoFinish: false`, `commit()` and `finish()`. Browser crashes and forced
closure cannot guarantee a final save. Completion alone does not terminate the session.

The adapter mirrors the current PumpRoom task result; it does not implement LMS attempts, course
aggregation or `suspend_data` restoration. A new LMS attempt does not reset the API's stored result.
Validate these policies in the target LMS before rollout.

SCORM and authentication share the existing `/bundle/pumproom-sdk-v<version>.esm.js` or
`/bundle/pumproom-sdk-v<version>.umd.js` bundle (UMD: `PumpRoomSdk.connectScorm`).
No additional script is needed. Major-version and `latest` aliases are also emitted.
For a reproducible SCORM ZIP, vendor one SDK bundle from an exact release inside the ZIP.
`imsmanifest.xml`, launch HTML, configuration and ZIP
generation remain the package builder's responsibility. Bundling the adapter does not make the
remote UI/API available offline.

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
