// Modular llms.txt for the gallery section.
const SITE_URL = 'https://cake47.art'

const BODY = `# cake47.art — gallery

> Full archive of works by snowcake47 / 私期, organised by category and series.

## Browse

- ${SITE_URL}/en/gallery — full archive (English UI)
- ${SITE_URL}/zh-CN/gallery — 完整作品集
- ${SITE_URL}/ja/gallery — 作品アーカイブ

## Categories

- fan-works — Fan works inspired by games, anime, manga, and virtual singers (Vocaloid, etc.).
- original-oc — Original characters, birthday illustrations, personal works.
- commercial-commission — Public-facing commercial samples and commission samples.

## Data feed

- GET ${SITE_URL}/api/gallery — JSON taxonomy (categories + series + counts).
- GET ${SITE_URL}/api/gallery/artworks?seriesId=... — JSON artwork pages.

## Notes for agents

- Each artwork carries titleZh / titleEn / titleJa. Use the locale that matches the user's request.
- Each series carries a primary cover artwork. Use coverUrl for thumbnails.
- thumbHash fields contain a base64 ThumbHash blur-up; treat as optional placeholder, not as a final image.
`

export default defineEventHandler((event) => {
  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')
  return BODY
})
