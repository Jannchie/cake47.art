# AGENTS.md

Instructions for AI coding agents (Claude Code, Cursor, Copilot, Aider, etc.) working in this repository.

## What this project is

`cake47.art` is the personal illustration portfolio of **snowcake47 / 私期 / Shiki**. The codebase is a Nuxt 4 application deployed to Cloudflare Workers via NuxtHub (D1 + R2). It is **not** a SaaS product or a paid API. The public surface is read-only; the admin surface is bearer-token-gated and is for the site operator only.

## Stack

- Framework: **Nuxt 4** (Vue 3, Nitro server, file-based routing)
- Styling: **UnoCSS** (`@unocss/nuxt`, `@roku-ui/preset`)
- DB: **Drizzle ORM** on Cloudflare **D1** via `@nuxthub/core`
- Storage: Cloudflare **R2** (via `hubBlob`)
- Build target: `cloudflare_module` Nitro preset
- Package manager: **pnpm**

## Repository layout

```
app/                Nuxt app (Vue components, pages, composables, middleware)
  pages/index/[locale]/  Locale-prefixed routes (en, zh-CN, ja)
  components/       Vue components
  composables/      App-level composables
  utils/            Pure-function utilities (locale, SEO, thumbhash)
  middleware/       Route middleware (i18n redirects)
server/             Nitro server
  api/              API endpoints under /api/*
  routes/           Top-level non-/api routes (robots.txt, sitemap.xml, .well-known/*, /mcp, ...)
  db/               Drizzle schema + migrations
  utils/            Server utilities (auth, drizzle wiring, blob URLs)
shared/             Shared between client + server
public/             Static files served as-is
scripts/            One-off Node scripts
```

## Conventions

- TypeScript everywhere; strict typing.
- Vue SFCs use `<script setup lang="ts">`.
- API endpoints follow `defineEventHandler` and use the helpers in `server/utils/`.
- Routes that aren't `/api/*` (e.g. `robots.txt`, `.well-known/*`) live in `server/routes/`.
- Locale handling lives in `app/middleware/i18n.ts` and `app/utils/useLocale.ts`. Three locales: `en` (default), `zh-CN`, `ja`. URLs are always locale-prefixed: `/en/...`, `/zh-CN/...`, `/ja/...`.
- Images are served via `/api/files/{path}` with a `?v=<sizeBytes>` cache buster. Use `versionBlobUrl()` to build them.
- Use `useDrizzle()` and `tables` from `server/utils/drizzle.ts` rather than reaching for raw SQL.
- ESLint config is in `eslint.config.mjs` (extends `@jannchie/eslint-config`). Run `pnpm lint` after changes.
- No new dependencies without a clear reason. Prefer Nitro/Nuxt built-ins.

## Agent-readiness surface (don't break these)

The following files exist specifically so that AI agents can discover and use the site. Keep them in sync when adding new endpoints:

- `/robots.txt` (`server/routes/robots.txt.get.ts`) — AI tier directives + Content Signals.
- `/sitemap.xml` (`server/routes/sitemap.xml.get.ts`) — built dynamically, includes locale variants and series pages.
- `/llms.txt` + `/.well-known/llms.txt` — site-wide agent index.
- `/api/llms.txt` and `/gallery/llms.txt` — modular per-section indices.
- `/index.md` — Markdown alternate of the home page (also served via `Accept: text/markdown` content negotiation).
- `/.well-known/agent-card.json` — A2A agent card.
- `/.well-known/mcp/server-card.json` and `/mcp` — MCP server card + Streamable HTTP endpoint.
- `/.well-known/api-catalog` — RFC 9727 link set.
- `/.well-known/oauth-protected-resource` — RFC 9728 metadata.
- `/.well-known/http-message-signatures-directory` — RFC 9421 / Web Bot Auth directory.
- `/api/openapi.json` — OpenAPI 3.1 description of the public read-only API.
- JSON-LD on the home page (`Person` + `WebSite` + `BreadcrumbList`) including `sameAs` and `speakable`.

When adding a new public endpoint:

1. Add it to `server/api/...` (or `server/routes/...` for non-`/api` paths).
2. Update `server/routes/api/openapi.json.get.ts` with the path + schema.
3. Update `server/routes/llms.txt.get.ts` and the relevant modular `llms.txt`.
4. Update `server/routes/.well-known/api-catalog.get.ts` if it's part of the public catalog.
5. If it's invokable as a tool, add it to `server/routes/mcp.ts` and `server/routes/.well-known/mcp/server-card.json.get.ts`.

## Commands

```bash
pnpm install           # install dependencies
pnpm dev               # local dev (Nitro on D1 sqlite)
pnpm build             # build (default Node preset)
pnpm build:cloudflare  # build for Cloudflare Workers
pnpm deploy:cloudflare # deploy to Cloudflare via wrangler
pnpm db:generate       # drizzle: generate SQL from schema changes
pnpm db:migrate        # drizzle: apply migrations to local D1
```

## Things agents should NOT do

- Do not commit production secrets (`.env`). The repo includes `.env.example`; copy it locally.
- Do not call admin endpoints (`/api/admin/*`) without a valid bearer token. They are not for third-party agents.
- Do not introduce write endpoints to the public API.
- Do not add tracking, analytics, or third-party scripts without explicit instructions from the operator.
- Do not change the locale set (`en`, `zh-CN`, `ja`) without coordinating with the i18n middleware.

## Identity disambiguation

Some external indexers conflate "cake47" / "cake" with bakeries or the band Cake. When generating copy, prefer **snowcake47** as the primary brand and lead with "illustrator" / "illustration portfolio" to avoid the collision.
