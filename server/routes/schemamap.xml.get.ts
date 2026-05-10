// NLWeb Schema Map: https://github.com/microsoft/NLWeb
// Lists structured data feeds (JSON-LD on pages, OpenAPI catalogue, etc.)
// so agents can pull machine-readable representations of the site.
import { defineEventHandler, setResponseHeader } from 'h3'

const SITE_URL = 'https://cake47.art'

export default defineEventHandler((event) => {
  setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')

  return `<?xml version="1.0" encoding="UTF-8"?>
<schemamap xmlns="https://nlweb.org/schemas/schemamap/0.1">
  <schema>
    <name>Person</name>
    <feed format="json-ld" href="${SITE_URL}/.well-known/agent-card.json"/>
    <feed format="text/markdown" href="${SITE_URL}/index.md"/>
  </schema>
  <schema>
    <name>CreativeWork</name>
    <feed format="application/openapi+json" href="${SITE_URL}/api/openapi.json"/>
    <feed format="application/json" href="${SITE_URL}/api/gallery"/>
  </schema>
  <schema>
    <name>llms.txt</name>
    <feed format="text/plain" href="${SITE_URL}/llms.txt"/>
  </schema>
</schemamap>
`
})
