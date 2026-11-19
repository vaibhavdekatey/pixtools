const HEX_COLOR_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i

export function normalizeHexColor(value: string, fallback = '#000000'): string {
  const match = value.trim().match(HEX_COLOR_RE)
  if (!match) return fallback
  const raw = match[1]
  if (raw.length === 3) {
    return `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`.toLowerCase()
  }
  return `#${raw.toLowerCase()}`
}

export function parseHexRgb(hex: string): [number, number, number] {
  const normalized = normalizeHexColor(hex, '#000000')
  const r = Number.parseInt(normalized.slice(1, 3), 16)
  const g = Number.parseInt(normalized.slice(3, 5), 16)
  const b = Number.parseInt(normalized.slice(5, 7), 16)
  return [r, g, b]
}

function channelToLinear(channel: number): number {
  const srgb = channel / 255
  return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
}

export function getRelativeLuminance(hex: string): number {
  const [r, g, b] = parseHexRgb(hex)
  return 0.2126 * channelToLinear(r) + 0.7152 * channelToLinear(g) + 0.0722 * channelToLinear(b)
}

export function getContrastRatio(hexA: string, hexB: string): number {
  const lumA = getRelativeLuminance(hexA)
  const lumB = getRelativeLuminance(hexB)
  const lighter = Math.max(lumA, lumB)
  const darker = Math.min(lumA, lumB)
  return (lighter + 0.05) / (darker + 0.05)
}
