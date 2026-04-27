# cake47.art

Nuxt 4 art portfolio and gallery with a token-protected admin area. Local data uses NuxtHub SQLite/blob storage; production uses Cloudflare D1/R2.

## Setup

```bash
corepack enable
pnpm install
cp .env.example .env
```

Set `NUXT_ADMIN_TOKEN` for admin APIs. Fill the Cloudflare variables in `.env` before production migration, sync, or deployment.

## Development

```bash
pnpm dev
```

Open `http://localhost:3000`. Admin pages are under `/admin`.

## Database

```bash
pnpm db:generate
pnpm db:migrate
```

For production D1 migrations:

```bash
pnpm db:migrate:production
```

## Build and Deploy

```bash
pnpm build
pnpm preview
```

For Cloudflare Workers:

```bash
pnpm build:cloudflare
pnpm deploy:cloudflare
```

## ThumbHash Backfill

Local:

```bash
pnpm thumbhash:backfill
```

Production:

```bash
pnpm build:cloudflare
ALLOW_PROD_BACKFILL=1 pnpm thumbhash:backfill -- --remote
```

## Production Data Sync

Use only when bootstrapping production from local data. It replaces production business data from `.data/db/sqlite.db` and uploads `.data/blob` objects to R2. It does not sync `_hub_migrations`.

Dry run:

```bash
pnpm sync:prod
```

Production run:

```bash
pnpm build:cloudflare
ALLOW_PROD_SYNC=1 pnpm sync:prod
```

The production run writes a D1 backup and generated SQL under `.tmp/`.
