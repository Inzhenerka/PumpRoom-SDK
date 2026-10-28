# syntax=docker/dockerfile:1.7

FROM oven/bun:1.4.4-alpine@sha256:4cf82f5686b196504fe119db3fcd9185b191f82ece82c40680e597228ec6070a AS builder

WORKDIR /app

COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile

COPY README.md RELEASE_NOTES.md index.html site.ts theme.ts releaseNotes.ts tsconfig.json tsconfig.build.json typedoc.json ./
COPY vite.config.lib.ts vite.config.site.ts ./
COPY docs ./docs
COPY example ./example
COPY public ./public
COPY src ./src
COPY types ./types

RUN bun run build

FROM nginxinc/nginx-unprivileged:1.30.5-alpine-slim@sha256:e28dcf0a161ddcbf228c7364b4a14f9bad4763ae8f5317c437b896afa3df4b84 AS runtime

LABEL org.opencontainers.image.title="PumpRoom SDK" \
      org.opencontainers.image.description="Browser SDK and integration documentation for PumpRoom" \
      org.opencontainers.image.source="https://github.com/Inzhenerka/PumpRoom-SDK"

COPY --chown=101:101 nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --chown=101:101 nginx/app.conf.template /etc/nginx/pumproom/sdk/app.conf.template
COPY --chown=101:101 --chmod=755 scripts/generate-nginx-config.sh /docker-entrypoint.d/40-generate-nginx-config.sh
COPY --chown=101:101 --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8012

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O - http://127.0.0.1:8012/healthz >/dev/null || exit 1
