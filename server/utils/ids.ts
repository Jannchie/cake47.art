const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

export function shortId(length = 12): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  let out = ''
  for (const byte of bytes) {
    out += ALPHABET[byte % ALPHABET.length]
  }
  return out
}

export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 64)
}
