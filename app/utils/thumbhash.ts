import { rgbaToThumbHash, thumbHashToAverageRGBA, thumbHashToDataURL } from 'thumbhash'

const MAX_THUMBHASH_DIMENSION = 100
const placeholderCache = new Map<string, string | null>()
const averageColorCache = new Map<string, string | null>()

function bytesToBase64(bytes: Uint8Array) {
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(i, i + chunkSize))
  }
  return btoa(binary)
}

function base64ToBytes(value: string) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function loadImageFromFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new window.Image()
    img.addEventListener('load', () => {
      URL.revokeObjectURL(url)
      resolve(img)
    })
    img.addEventListener('error', () => {
      URL.revokeObjectURL(url)
      reject(new Error('Unable to load image'))
    })
    img.src = url
  })
}

export async function createThumbHashFromFile(file: File): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const img = await loadImageFromFile(file)
    if (img.naturalWidth <= 0 || img.naturalHeight <= 0) {
      return null
    }

    const scale = Math.min(
      MAX_THUMBHASH_DIMENSION / img.naturalWidth,
      MAX_THUMBHASH_DIMENSION / img.naturalHeight,
      1,
    )
    const width = Math.max(1, Math.round(img.naturalWidth * scale))
    const height = Math.max(1, Math.round(img.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) {
      return null
    }

    ctx.drawImage(img, 0, 0, width, height)
    const rgba = ctx.getImageData(0, 0, width, height).data
    return bytesToBase64(rgbaToThumbHash(width, height, rgba))
  }
  catch {
    return null
  }
}

export function thumbHashToPlaceholderUrl(thumbHash: string | null | undefined) {
  if (!thumbHash) {
    return null
  }
  if (placeholderCache.has(thumbHash)) {
    return placeholderCache.get(thumbHash) ?? null
  }

  try {
    const url = thumbHashToDataURL(base64ToBytes(thumbHash))
    placeholderCache.set(thumbHash, url)
    return url
  }
  catch {
    placeholderCache.set(thumbHash, null)
    return null
  }
}

export function thumbHashBackgroundStyle(thumbHash: string | null | undefined) {
  const placeholderUrl = thumbHashToPlaceholderUrl(thumbHash)
  return placeholderUrl ? { backgroundImage: `url(${placeholderUrl})` } : {}
}

export function thumbHashAverageColorStyle(thumbHash: string | null | undefined) {
  if (!thumbHash) {
    return {}
  }
  if (!averageColorCache.has(thumbHash)) {
    try {
      const color = thumbHashToAverageRGBA(base64ToBytes(thumbHash))
      averageColorCache.set(
        thumbHash,
        `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a.toFixed(3)})`,
      )
    }
    catch {
      averageColorCache.set(thumbHash, null)
    }
  }

  const backgroundColor = averageColorCache.get(thumbHash)
  return backgroundColor ? { backgroundColor } : {}
}
