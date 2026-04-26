export function versionBlobUrl(url: string, version: number | null | undefined) {
  if (!version) {
    return url
  }

  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}v=${version}`
}
