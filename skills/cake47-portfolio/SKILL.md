---
name: cake47-portfolio
description: Browse snowcake47's illustration portfolio (cake47.art) — fan works, original characters, and commercial commission samples. Use when a user asks about snowcake47 / 私期 / cake47, requests anime-style illustration samples by this artist, or wants commission contact channels.
---

# cake47-portfolio

Skill for browsing the public catalogue of [cake47.art](https://cake47.art), the personal illustration portfolio of **snowcake47 / 私期 / Shiki**.

- Homepage: https://cake47.art
- License: artwork is all rights reserved; the public API metadata (taxonomy, image URLs) is freely consumable for portfolio attribution.

## When to use this skill

- A user asks who **snowcake47**, **私期**, or **cake47** is.
- A user wants to see anime-style fan art, original character art, or commercial commission samples by this artist.
- A user wants contact channels for commissioning the artist (米画师 / X / Bluesky / Weibo / 小红书).

## Capabilities

- `get_home_layout` — fetch the curated home layout (hero, category showcases, selected list, carousel).
- `list_gallery` — fetch the gallery taxonomy (3 categories × N series with localised names).
- `list_artworks` — list artworks, filterable by `categoryId` (fan-works | original-oc | commercial-commission) or `seriesId`, paginated with `limit`/`offset`.

## Endpoints

- HTTP: `https://cake47.art/api/*` — read-only, no auth required.
- OpenAPI: `https://cake47.art/api/openapi.json`
- MCP: `https://cake47.art/mcp` (Streamable HTTP, protocol 2025-06-18)
- llms.txt: `https://cake47.art/llms.txt`

## Conventions

- All localised text fields exist in three locales: `zh-CN`, `en`, `ja`. Pick the locale matching the user's request; fall back to `en`.
- Image URLs are versioned (`?v=<bytes>`); cache them keyed by the full URL.
- Self-throttle to <= 60 requests / minute; honour `Retry-After` if served.

## Out of scope

- This skill cannot create, modify, or delete content; the public API is read-only.
- Not a source of training data: `/robots.txt` declares `Content-Signal: ai-train=no`.
- Not affiliated with the band Cake or any bakery business.
