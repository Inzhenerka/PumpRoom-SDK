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

Set `trustedOrigins: []` to enable origin and iframe-source checks for standard origins:
`https://pumproom.inzhenerka-cloud.com`, `https://dev.pumproom.inzhenerka-cloud.com`,
`https://dev-pumproom.inzhenerka-cloud.com`.
For a custom deployment, add its exact origin (no wildcard or path):

```ts
init({ apiKey: "...", realm: "...", trustedOrigins: ["https://tasks.school.example"] });
```

Entries supplement the standard origins. Omitting the option preserves legacy behavior without
sender checks. Enabling it is recommended; strict checks are planned for the next major release.

# SDK Development

## Installing Dependencies

Requirements:

- Node.js >=20
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

Release a new version:

```bash
npm version <patch|minor|major>
```

This will update the version in package.json, create a git tag, and push changes to the repository.
