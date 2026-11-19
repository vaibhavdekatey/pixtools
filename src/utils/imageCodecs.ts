import type { OutputFormat, ResizeMode } from '../types/converter'

export interface DecodedRasterSource {
  canvas: HTMLCanvasElement
  width: number
  height: number
  isVector: boolean
}

export interface TargetDimensions {
  width: number
  height: number
}

const MAX_CANVAS_DIM = 8192

export function clampDimension(value: number): number {
  if (!Number.isFinite(value)) return 1
  return Math.max(1, Math.min(MAX_CANVAS_DIM, Math.round(value)))
}

export function computeTargetDimensions(
  sourceWidth: number,
  sourceHeight: number,
  mode: ResizeMode,
  scalePercent: number,
  customWidth: number | null,
  customHeight: number | null,
  maintainAspect: boolean
): TargetDimensions {
  if (mode === 'original') {
    return {
      width: clampDimension(sourceWidth),
      height: clampDimension(sourceHeight),
    }
  }

  if (mode === 'scale') {
    const ratio = Math.max(0.05, Math.min(4, scalePercent / 100))
    return {
      width: clampDimension(sourceWidth * ratio),
      height: clampDimension(sourceHeight * ratio),
    }
  }

  const aspect = sourceWidth > 0 && sourceHeight > 0 ? sourceWidth / sourceHeight : 1
  if (customWidth && customHeight) {
    if (maintainAspect) {
      return {
        width: clampDimension(customWidth),
        height: clampDimension(customWidth / aspect),
      }
    }
    return {
      width: clampDimension(customWidth),
      height: clampDimension(customHeight),
    }
  }
  if (customWidth && !customHeight) {
    return {
      width: clampDimension(customWidth),
      height: clampDimension(maintainAspect ? customWidth / aspect : sourceHeight),
    }
  }
  if (!customWidth && customHeight) {
    return {
      width: clampDimension(maintainAspect ? customHeight * aspect : sourceWidth),
      height: clampDimension(customHeight),
    }
  }
  return {
    width: clampDimension(sourceWidth),
    height: clampDimension(sourceHeight),
  }
}

function parseSvgIntrinsicSize(svgText: string): { width: number; height: number } {
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgText, 'image/svg+xml')
  const svg = doc.querySelector('svg')
  if (!svg) return { width: 512, height: 512 }

  const widthAttr = svg.getAttribute('width')
  const heightAttr = svg.getAttribute('height')
  const parsedW = widthAttr ? Number.parseFloat(widthAttr) : Number.NaN
  const parsedH = heightAttr ? Number.parseFloat(heightAttr) : Number.NaN

  if (Number.isFinite(parsedW) && parsedW > 0 && Number.isFinite(parsedH) && parsedH > 0) {
    // Reject percentage values like "100%" by checking suffix
    if (!widthAttr?.includes('%') && !heightAttr?.includes('%')) {
      return { width: parsedW, height: parsedH }
    }
  }

  const viewBox = svg.getAttribute('viewBox')
  if (viewBox) {
    const parts = viewBox
      .trim()
      .split(/[\s,]+/)
      .map(Number)
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      return { width: parts[2], height: parts[3] }
    }
  }

  return { width: 512, height: 512 }
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image could not be decoded by the browser.'))
    img.src = src
  })
}

export async function inspectImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
    const text = await file.text()
    const size = parseSvgIntrinsicSize(text)
    return {
      width: Math.max(1, Math.round(size.width)),
      height: Math.max(1, Math.round(size.height)),
    }
  }

  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      try {
        return {
          width: Math.max(1, bitmap.width || 1),
          height: Math.max(1, bitmap.height || 1),
        }
      } finally {
        bitmap.close()
      }
    } catch {
      // Fall back to HTMLImageElement decoding below.
    }
  }

  const url = URL.createObjectURL(file)
  try {
    const img = await loadImageElement(url)
    return {
      width: Math.max(1, img.naturalWidth || img.width || 1),
      height: Math.max(1, img.naturalHeight || img.height || 1),
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function decodeImageFileToCanvas(
  file: File,
  svgScale = 2
): Promise<DecodedRasterSource> {
  const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')

  if (isSvg) {
    const text = await file.text()
    const baseSize = parseSvgIntrinsicSize(text)
    const width = clampDimension(baseSize.width * svgScale)
    const height = clampDimension(baseSize.height * svgScale)

    const svgBlob = new Blob([text], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    try {
      const img = await loadImageElement(url)
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas 2D context is unavailable.')
      ctx.drawImage(img, 0, 0, width, height)
      return { canvas, width, height, isVector: true }
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      try {
        const width = clampDimension(bitmap.width)
        const height = clampDimension(bitmap.height)
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Canvas 2D context is unavailable.')
        ctx.drawImage(bitmap, 0, 0, width, height)
        return { canvas, width, height, isVector: false }
      } finally {
        bitmap.close()
      }
    } catch {
      // Fall back to HTMLImageElement decoding below.
    }
  }

  const url = URL.createObjectURL(file)
  try {
    const img = await loadImageElement(url)
    const width = clampDimension(img.naturalWidth || img.width)
    const height = clampDimension(img.naturalHeight || img.height)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context is unavailable.')
    ctx.drawImage(img, 0, 0, width, height)
    return { canvas, width, height, isVector: false }
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function resizeAndMatteCanvas(
  sourceCanvas: HTMLCanvasElement,
  targetWidth: number,
  targetHeight: number,
  backgroundColor?: string
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = clampDimension(targetWidth)
  canvas.height = clampDimension(targetHeight)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context is unavailable.')

  if (backgroundColor) {
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(sourceCanvas, 0, 0, canvas.width, canvas.height)
  return canvas
}

export async function encodeCanvasToImageBlob(
  canvas: HTMLCanvasElement,
  format: Extract<OutputFormat, 'png' | 'jpg' | 'webp'>,
  qualityPercent: number
): Promise<Blob> {
  const mimeType =
    format === 'png' ? 'image/png' : format === 'jpg' ? 'image/jpeg' : 'image/webp'
  const quality = format === 'png' ? undefined : Math.max(0.1, Math.min(1, qualityPercent / 100))

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(`Failed to encode image as ${format.toUpperCase()}.`))
          return
        }
        if (format === 'webp' && blob.type !== 'image/webp') {
          reject(new Error('This browser cannot encode WebP images natively.'))
          return
        }
        resolve(blob)
      },
      mimeType,
      quality
    )
  })
}
