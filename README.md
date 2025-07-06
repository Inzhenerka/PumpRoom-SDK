# PumpRoom SDK

[![npm version](https://badge.fury.io/js/pumproom-sdk.svg)](https://www.npmjs.com/package/pumproom-sdk)

Lightweight library for integrating LMS with PumpRoom. Provides methods for API authentication and message exchange.

# SDK Usage

**[📖 Integration and usage guide](https://pumproom-sdk.inzhenerka-cloud.com/)**

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
