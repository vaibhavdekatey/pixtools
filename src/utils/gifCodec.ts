import { clampDimension, resizeAndMatteCanvas } from './imageCodecs'

export interface DecodedGifFrame {
  index: number
  canvas: HTMLCanvasElement
  width: number
  height: number
  delayMs: number
}

export async function inspectGifFrameCount(file: File): Promise<{
  width: number
  height: number
  frameCount: number
}> {
  const { GifReader } = await import('omggif')
  const buffer = new Uint8Array(await file.arrayBuffer())
  const reader = new GifReader(buffer)
  return {
    width: reader.width,
    height: reader.height,
    frameCount: reader.numFrames(),
  }
}

export async function decodeGifFrames(file: File): Promise<DecodedGifFrame[]> {
  const { GifReader } = await import('omggif')
  const buffer = new Uint8Array(await file.arrayBuffer())
  const reader = new GifReader(buffer)

  const width = reader.width
  const height = reader.height
  const totalFrames = reader.numFrames()
  const pixelCount = width * height * 4

  // Persistent composition canvas handles disposal modes 0/1/2/3 accurately across frames.
  const compositeBuffer = new Uint8ClampedArray(pixelCount)
  let previousSnapshot: Uint8ClampedArray | null = null

  const frames: DecodedGifFrame[] = []

  for (let i = 0; i < totalFrames; i++) {
    const info = reader.frameInfo(i)
    if (info.disposal === 3) {
      previousSnapshot = new Uint8ClampedArray(compositeBuffer)
    }

    const frameRgba = new Uint8ClampedArray(pixelCount)
    reader.decodeAndBlitFrameRGBA(i, frameRgba)

    // Alpha-over composite the decoded frame onto the persistent canvas buffer.
    for (let p = 0; p < pixelCount; p += 4) {
      if (frameRgba[p + 3] !== 0) {
        compositeBuffer[p] = frameRgba[p]
        compositeBuffer[p + 1] = frameRgba[p + 1]
        compositeBuffer[p + 2] = frameRgba[p + 2]
        compositeBuffer[p + 3] = frameRgba[p + 3]
      }
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context is unavailable.')

    const imageData = new ImageData(new Uint8ClampedArray(compositeBuffer), width, height)
    ctx.putImageData(imageData, 0, 0)

    frames.push({
      index: i,
      canvas,
      width,
      height,
      // Standard GIF browsers clamp <20ms delays to 100ms; preserve reasonable default if 0.
      delayMs: info.delay > 0 ? info.delay * 10 : 100,
    })

    if (info.disposal === 2) {
      for (let y = info.y; y < info.y + info.height; y++) {
        if (y < 0 || y >= height) continue
        for (let x = info.x; x < info.x + info.width; x++) {
          if (x < 0 || x >= width) continue
          const idx = (y * width + x) * 4
          compositeBuffer[idx] = 0
          compositeBuffer[idx + 1] = 0
          compositeBuffer[idx + 2] = 0
          compositeBuffer[idx + 3] = 0
        }
      }
    } else if (info.disposal === 3 && previousSnapshot) {
      compositeBuffer.set(previousSnapshot)
    }
  }

  return frames
}

function hasTransparentPixels(rgba: Uint8ClampedArray): boolean {
  for (let i = 3; i < rgba.length; i += 4) {
    if (rgba[i] < 128) return true
  }
  return false
}

export async function encodeCanvasesToGifBlob(
  frames: Array<{ canvas: HTMLCanvasElement; delayMs?: number }>,
  options: {
    targetWidth: number
    targetHeight: number
    defaultDelayMs: number
    loop: boolean
  }
): Promise<Blob> {
  if (frames.length === 0) {
    throw new Error('No frames available to encode into GIF.')
  }

  const { GIFEncoder, quantize, applyPalette } = await import('gifenc')
  const width = clampDimension(options.targetWidth)
  const height = clampDimension(options.targetHeight)
  const encoder = GIFEncoder()

  for (let i = 0; i < frames.length; i++) {
    const frameCanvas = resizeAndMatteCanvas(frames[i].canvas, width, height)
    const ctx = frameCanvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context is unavailable.')
    const { data } = ctx.getImageData(0, 0, width, height)

    const useAlpha = hasTransparentPixels(data)
    const format = useAlpha ? 'rgba4444' : 'rgb565'
    const palette = quantize(data, 256, {
      format,
      oneBitAlpha: useAlpha,
      clearAlpha: useAlpha,
      clearAlphaThreshold: 127,
    })

    const indexed = applyPalette(data, palette, format)
    let transparentIndex = -1
    if (useAlpha) {
      transparentIndex = palette.findIndex((color) => color.length >= 4 && color[3] === 0)
    }

    encoder.writeFrame(indexed, width, height, {
      palette,
      delay: frames[i].delayMs ?? options.defaultDelayMs,
      repeat: options.loop ? 0 : -1,
      transparent: transparentIndex !== -1,
      transparentIndex: transparentIndex !== -1 ? transparentIndex : 0,
      dispose: useAlpha || frames.length > 1 ? 2 : -1,
    })
  }

  encoder.finish()
  const raw = encoder.bytes()
  const copy = new Uint8Array(raw.byteLength)
  copy.set(raw)
  return new Blob([copy.buffer], { type: 'image/gif' })
}
