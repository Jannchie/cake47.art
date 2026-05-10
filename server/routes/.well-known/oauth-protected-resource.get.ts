// RFC 9728 — OAuth Protected Resource metadata.
// cake47.art's public read endpoints don't require OAuth, but publishing this
// document lets agents skip the 401 handshake and learn that fact directly.
import { defineEventHandler, setResponseHeader } from 'h3'

const SITE_URL = 'https://cake47.art'

export default defineEventHandler((event) => {
  setResponseHeader(event, 'Content-Type', 'application/json; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')

  return {
    resource: SITE_URL,
    resource_name: 'snowcake47 portfolio public API',
    resource_documentation: `${SITE_URL}/llms.txt`,
    authorization_servers: [],
    scopes_supported: [],
    bearer_methods_supported: [],
    resource_signing_alg_values_supported: [],
    resource_policy_uri: `${SITE_URL}/llms.txt`,
    tls_client_certificate_bound_access_tokens: false,
  }
})
