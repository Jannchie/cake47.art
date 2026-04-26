interface ImageDimensions {
  width: number
  height: number
}

function ascii(data: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...data.slice(start, end))
}

function readUint24LE(data: Uint8Array, offset: number) {
  return data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16)
}

function readPngDimensions(data: Uint8Array): ImageDimensions | null {
  if (
    data.length < 24
    || data[0] !== 0x89
    || ascii(data, 1, 4) !== 'PNG'
  ) {
    return null
  }

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  return {
    width: view.getUint32(16),
    height: view.getUint32(20),
  }
}

function readGifDimensions(data: Uint8Array): ImageDimensions | null {
  const signature = ascii(data, 0, 6)
  if (data.length < 10 || (signature !== 'GIF87a' && signature !== 'GIF89a')) {
    return null
  }

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  return {
    width: view.getUint16(6, true),
    height: view.getUint16(8, true),
  }
}

function readJpegDimensions(data: Uint8Array): ImageDimensions | null {
  if (data.length < 4 || data[0] !== 0xFF || data[1] !== 0xD8) {
    return null
  }

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  let offset = 2
  while (offset < data.length) {
    while (data[offset] === 0xFF) {
      offset++
    }

    const marker = data[offset++]
    if (marker === 0xD9 || marker === 0xDA) {
      break
    }
    if (offset + 2 > data.length) {
      break
    }

    const length = view.getUint16(offset)
    if (length < 2 || offset + length > data.length) {
      break
    }

    const isStartOfFrame = marker >= 0xC0
      && marker <= 0xCF
      && marker !== 0xC4
      && marker !== 0xC8
      && marker !== 0xCC
    if (isStartOfFrame && length >= 7) {
      return {
        height: view.getUint16(offset + 3),
        width: view.getUint16(offset + 5),
      }
    }

    offset += length
  }

  return null
}

function readWebpDimensions(data: Uint8Array): ImageDimensions | null {
  if (data.length < 20 || ascii(data, 0, 4) !== 'RIFF' || ascii(data, 8, 12) !== 'WEBP') {
    return null
  }

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  let offset = 12
  while (offset + 8 <= data.length) {
    const chunkType = ascii(data, offset, offset + 4)
    const chunkSize = view.getUint32(offset + 4, true)
    const chunkDataOffset = offset + 8
    if (chunkDataOffset + chunkSize > data.length) {
      break
    }

    if (chunkType === 'VP8X' && chunkSize >= 10) {
      return {
        width: readUint24LE(data, chunkDataOffset + 4) + 1,
        height: readUint24LE(data, chunkDataOffset + 7) + 1,
      }
    }

    if (
      chunkType === 'VP8 '
      && chunkSize >= 10
      && data[chunkDataOffset + 3] === 0x9D
      && data[chunkDataOffset + 4] === 0x01
      && data[chunkDataOffset + 5] === 0x2A
    ) {
      return {
        width: view.getUint16(chunkDataOffset + 6, true) & 0x3FFF,
        height: view.getUint16(chunkDataOffset + 8, true) & 0x3FFF,
      }
    }

    if (chunkType === 'VP8L' && chunkSize >= 5 && data[chunkDataOffset] === 0x2F) {
      const b1 = data[chunkDataOffset + 1]
      const b2 = data[chunkDataOffset + 2]
      const b3 = data[chunkDataOffset + 3]
      const b4 = data[chunkDataOffset + 4]
      return {
        width: 1 + (((b2 & 0x3F) << 8) | b1),
        height: 1 + (((b4 & 0x0F) << 10) | (b3 << 2) | ((b2 & 0xC0) >> 6)),
      }
    }

    offset = chunkDataOffset + chunkSize + (chunkSize % 2)
  }

  return null
}

export function readImageDimensions(data: Uint8Array): ImageDimensions | null {
  return readPngDimensions(data)
    ?? readGifDimensions(data)
    ?? readJpegDimensions(data)
    ?? readWebpDimensions(data)
}
