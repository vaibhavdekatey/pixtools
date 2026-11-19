import type { InputFormat, OutputFormat } from '../types/converter'

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  const decimals = exponent === 0 ? 0 : value >= 100 ? 0 : value >= 10 ? 1 : 2
  return `${value.toFixed(decimals)} ${units[exponent]}`
}

export function formatByteDelta(originalBytes: number, convertedBytes: number): {
  label: string
  isReduction: boolean
} {
  if (originalBytes <= 0) {
    return { label: formatBytes(convertedBytes), isReduction: false }
  }
  const diffPercent = ((convertedBytes - originalBytes) / originalBytes) * 100
  const rounded = Math.round(Math.abs(diffPercent) * 10) / 10
  if (diffPercent < -0.1) {
    return { label: `-${rounded}%`, isReduction: true }
  }
  if (diffPercent > 0.1) {
    return { label: `+${rounded}%`, isReduction: false }
  }
  return { label: '0%', isReduction: false }
}

export function stripExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.')
  if (lastDot <= 0) return fileName
  return fileName.slice(0, lastDot)
}

export function sanitizeFileBase(name: string, fallback = 'export'): string {
  const cleaned = name
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1f]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return cleaned || fallback
}

export function buildOutputFileName(sourceName: string, targetFormat: OutputFormat, suffix?: string): string {
  const base = sanitizeFileBase(stripExtension(sourceName), 'converted')
  const ext = targetFormat === 'jpg' ? 'jpg' : targetFormat
  return suffix ? `${base}-${suffix}.${ext}` : `${base}.${ext}`
}

export function detectInputFormat(file: File): InputFormat | null {
  const mime = file.type.toLowerCase()
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''

  if (mime === 'image/png' || ext === 'png') return 'png'
  if (mime === 'image/jpeg' || mime === 'image/jpg' || ext === 'jpg' || ext === 'jpeg') return 'jpg'
  if (mime === 'image/webp' || ext === 'webp') return 'webp'
  if (mime === 'image/gif' || ext === 'gif') return 'gif'
  if (mime === 'application/pdf' || ext === 'pdf') return 'pdf'
  if (mime === 'image/svg+xml' || ext === 'svg') return 'svg'
  if (mime === 'image/bmp' || ext === 'bmp') return 'bmp'
  if (mime === 'image/avif' || ext === 'avif') return 'avif'

  return null
}

export function formatInputLabel(format: InputFormat): string {
  return format.toUpperCase()
}

export function formatOutputLabel(format: OutputFormat): string {
  return format.toUpperCase()
}
