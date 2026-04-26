# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Production Data Sync

Use the one-off sync script only when bootstrapping production from local data.
It replaces production business data from `.data/db/sqlite.db` and uploads `.data/blob` objects to R2.
It does not sync `_hub_migrations`.

Dry run:

```bash
pnpm sync:prod
```

Production run:

```bash
pnpm build:cloudflare
ALLOW_PROD_SYNC=1 pnpm sync:prod
```

The production run first exports a D1 backup into `.tmp/`, then uploads R2 objects, then imports the generated SQL into remote D1.
