// Markdown bodies for the small set of public sitemap pages.
// Kept in a single place so the .md handler and content-negotiation middleware
// share one source of truth. Locale-aware so agents/readers see the right
// language when they negotiate Markdown.
import type { Locale } from '~~/app/utils/useLocale'

const SITE_URL = 'https://cake47.art'

const HOME_COPY: Record<Locale, { title: string, summary: string, identity: string[], categories: string[], browse: string[] }> = {
  'en': {
    title: 'snowcake47 — illustration portfolio',
    summary: 'Personal illustration portfolio of snowcake47 (also written 私期 / Shiki) — anime-style fan works, original characters, and commercial commission samples. A creative portfolio, not a paid SaaS product; run by a single illustrator.',
    identity: [
      '**Artist:** snowcake47 / 私期 / Shiki',
      `**Domain:** [cake47.art](${SITE_URL})`,
      '**Languages:** English (en), Simplified Chinese (zh-CN), Japanese (ja)',
      '**Disambiguation:** This is an illustrator\'s portfolio. It is unrelated to the band "Cake", any bakery business, or any other entity sharing the "cake" string.',
    ],
    categories: [
      '**Fan works** — illustration based on games, anime, manga, and virtual singers (Vocaloid, etc.).',
      '**Original characters** — original character designs, birthday illustrations, personal works.',
      '**Commercial / commission** — public-facing commercial samples and commission samples.',
    ],
    browse: [
      `Home (English): [${SITE_URL}/en](${SITE_URL}/en)`,
      `Home (简体中文): [${SITE_URL}/zh-CN](${SITE_URL}/zh-CN)`,
      `Home (日本語): [${SITE_URL}/ja](${SITE_URL}/ja)`,
      `Full archive: [${SITE_URL}/en/gallery](${SITE_URL}/en/gallery)`,
    ],
  },
  'zh-CN': {
    title: 'snowcake47 / 私期 — 插画作品集',
    summary: 'snowcake47（又名 私期 / Shiki）的个人插画作品集 —— 收录同人创作、Vocaloid 同人、原创角色设计、生日贺图与商业委托样稿。三语展示（英文 / 中文 / 日文）。',
    identity: [
      '**画师:** snowcake47 / 私期 / Shiki',
      `**网域:** [cake47.art](${SITE_URL})`,
      '**语言:** 英文 (en)、简体中文 (zh-CN)、日文 (ja)',
      '**消歧义:** 本站为插画师个人作品集，与同名乐队 "Cake"、烘焙业务或其他含 "cake" 字串的实体无关。',
    ],
    categories: [
      '**同人作品** — 基于游戏、动画、漫画与虚拟歌手（Vocaloid 等）的二次创作。',
      '**原创角色** — 原创角色设计、生日贺图、个人创作。',
      '**商业 / 委托** — 公开展示的商业样稿与委托样图。',
    ],
    browse: [
      `首页（English）: [${SITE_URL}/en](${SITE_URL}/en)`,
      `首页（简体中文）: [${SITE_URL}/zh-CN](${SITE_URL}/zh-CN)`,
      `首页（日本語）: [${SITE_URL}/ja](${SITE_URL}/ja)`,
      `作品集（简体中文）: [${SITE_URL}/zh-CN/gallery](${SITE_URL}/zh-CN/gallery)`,
    ],
  },
  'ja': {
    title: 'snowcake47 / 私期 — イラストポートフォリオ',
    summary: 'snowcake47（私期 / Shiki）の個人イラストポートフォリオ。アニメ系のファンアート、Vocaloid 二次創作、オリジナルキャラクター、商業・依頼作品を三言語で掲載。',
    identity: [
      '**イラストレーター:** snowcake47 / 私期 / Shiki',
      `**ドメイン:** [cake47.art](${SITE_URL})`,
      '**言語:** 英語 (en)、簡体字中国語 (zh-CN)、日本語 (ja)',
      '**同名注意:** これはイラストレーターのポートフォリオです。バンド「Cake」、ベーカリー業、その他「cake」を含む別エンティティとは無関係です。',
    ],
    categories: [
      '**ファンアート** — ゲーム、アニメ、漫画、Vocaloid 等のキャラクターをモチーフにした二次創作。',
      '**オリジナルキャラクター** — オリジナルキャラクターデザイン、誕生日イラスト、個人作品。',
      '**商業 / 依頼** — 公開可能な商業作品・依頼作品サンプル。',
    ],
    browse: [
      `ホーム（English）: [${SITE_URL}/en](${SITE_URL}/en)`,
      `ホーム（简体中文）: [${SITE_URL}/zh-CN](${SITE_URL}/zh-CN)`,
      `ホーム（日本語）: [${SITE_URL}/ja](${SITE_URL}/ja)`,
      `ギャラリー（日本語）: [${SITE_URL}/ja/gallery](${SITE_URL}/ja/gallery)`,
    ],
  },
}

const GALLERY_COPY: Record<Locale, { title: string, summary: string, intro: string }> = {
  'en': {
    title: 'snowcake47 — full gallery',
    summary: 'Full archive of snowcake47 / 私期 illustrations — browse all public works by category (fan art, original characters, commissions) and by series.',
    intro: 'The gallery is browseable by category and by series. Use the query parameters `?category=` and `?series=` to filter.',
  },
  'zh-CN': {
    title: 'snowcake47 / 私期 — 作品集全索引',
    summary: 'snowcake47 / 私期 插画作品集全索引 —— 按分类（同人、原创角色、商单）与系列浏览所有公开作品。',
    intro: '可按分类与系列浏览全部作品。URL 查询参数 `?category=` 与 `?series=` 用于过滤。',
  },
  'ja': {
    title: 'snowcake47 / 私期 — ギャラリー全件',
    summary: 'snowcake47 / 私期 のイラスト作品集全索引。カテゴリ（ファンアート、オリジナル、商業・依頼）とシリーズで全公開作品を閲覧できます。',
    intro: 'カテゴリとシリーズで全作品を閲覧できます。URL クエリ `?category=` と `?series=` で絞り込めます。',
  },
}

const CONTACT_BLOCK = `## Contact

- X / Twitter — [@snowcake47](https://x.com/snowcake47)
- Bluesky — [@snowcake47.bsky.social](https://bsky.app/profile/snowcake47.bsky.social)
- 米画师 (commissions) — [id 2397](https://www.mihuashi.com/profiles/2397)
- 微博 — [2861524284](https://weibo.com/2861524284)
- 小红书 — [profile](https://www.rednote.com/user/profile/629e56300000000021029847)
`

const API_BLOCK = `## Public API

Read-only HTTP API, no auth required.

- \`GET /api/home/layout\` — curated home layout.
- \`GET /api/gallery\` — categories + series taxonomy.
- \`GET /api/gallery/artworks\` — paginated artwork list.
- \`GET /api/files/{path}\` — image binaries.

OpenAPI 3.1: [${SITE_URL}/api/openapi.json](${SITE_URL}/api/openapi.json)
`

export function buildHomeMarkdown(locale: Locale): string {
  const copy = HOME_COPY[locale]
  const lines = [
    `# ${copy.title}`,
    ``,
    `> ${copy.summary}`,
    ``,
    `## Identity`,
    ``,
    ...copy.identity.map(line => `- ${line}`),
    ``,
    `## Categories`,
    ``,
    ...copy.categories.map(line => `- ${line}`),
    ``,
    `## Browse`,
    ``,
    ...copy.browse.map(line => `- ${line}`),
    ``,
    CONTACT_BLOCK,
    API_BLOCK,
    `## Agent surface`,
    ``,
    `- llms.txt: [${SITE_URL}/llms.txt](${SITE_URL}/llms.txt)`,
    `- A2A agent card: [${SITE_URL}/.well-known/agent-card.json](${SITE_URL}/.well-known/agent-card.json)`,
    `- MCP server: [${SITE_URL}/mcp](${SITE_URL}/mcp)`,
    ``,
  ]
  return lines.join('\n')
}

export function buildGalleryMarkdown(locale: Locale): string {
  const copy = GALLERY_COPY[locale]
  const lines = [
    `# ${copy.title}`,
    ``,
    `> ${copy.summary}`,
    ``,
    copy.intro,
    ``,
    `## Browse`,
    ``,
    `- Gallery (English): [${SITE_URL}/en/gallery](${SITE_URL}/en/gallery)`,
    `- Gallery (简体中文): [${SITE_URL}/zh-CN/gallery](${SITE_URL}/zh-CN/gallery)`,
    `- Gallery (日本語): [${SITE_URL}/ja/gallery](${SITE_URL}/ja/gallery)`,
    ``,
    `## JSON API`,
    ``,
    `- [Gallery taxonomy](${SITE_URL}/api/gallery): categories and series.`,
    `- [Gallery artworks](${SITE_URL}/api/gallery/artworks): paginated artwork list.`,
    ``,
    CONTACT_BLOCK,
  ]
  return lines.join('\n')
}

const PAGE_MARKDOWN: Record<string, string> = {
  '/': buildHomeMarkdown('en'),
  '/en': buildHomeMarkdown('en'),
  '/zh-CN': buildHomeMarkdown('zh-CN'),
  '/ja': buildHomeMarkdown('ja'),
  '/en/gallery': buildGalleryMarkdown('en'),
  '/zh-CN/gallery': buildGalleryMarkdown('zh-CN'),
  '/ja/gallery': buildGalleryMarkdown('ja'),
}

export function markdownForPath(pathname: string): string | undefined {
  const path = (pathname.replace(/\/+$/, '') || '/')
    .replace(/^\/zh-cn(?=$|\/)/i, '/zh-CN')
  return PAGE_MARKDOWN[path]
}
