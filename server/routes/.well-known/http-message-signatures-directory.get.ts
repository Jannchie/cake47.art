// Web Bot Auth — directory of public keys agents can use to sign HTTP messages.
// Spec: RFC 9421 + https://datatracker.ietf.org/doc/draft-meunier-web-bot-auth-architecture/
//
// This site does not yet require signed agent traffic, so the keys array is
// intentionally empty. Publishing the document still satisfies the discovery
// contract and gives operators a single place to rotate keys later.
export default defineEventHandler((event) => {
  setResponseHeader(event, 'Content-Type', 'application/http-message-signatures-directory+json')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')

  return {
    keys: [],
  }
})
