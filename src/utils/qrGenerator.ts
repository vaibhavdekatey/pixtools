import QRCode from 'qrcode'
import type { QrExportFormat, QrGeneratedOutput, QrSettings } from '../types/qr'
import { getContrastRatio, getRelativeLuminance, normalizeHexColor } from './color'

function escapeWifiField(value: string): string {
  return value.replace(/([\\;,:"'])/g, '\\$1')
}

function escapeIcsField(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

function formatIcsDateTime(value: string): string {
  const cleaned = value.trim()
  if (!cleaned) return ''
  // Convert HTML datetime-local "YYYY-MM-DDTHH:mm" to "YYYYMMDDTHHMM00"
  const match = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!match) return ''
  return `${match[1]}${match[2]}${match[3]}T${match[4]}${match[5]}00`
}

export function buildQrPayload(settings: QrSettings): string {
  switch (settings.mode) {
    case 'text':
      return settings.text.trim()
    case 'wifi': {
      const ssid = settings.wifi.ssid.trim()
      if (!ssid) return ''
      const type = settings.wifi.encryption
      const escapedSsid = escapeWifiField(ssid)
      const escapedPass = type === 'nopass' ? '' : escapeWifiField(settings.wifi.password)
      const hiddenPart = settings.wifi.hidden ? 'H:true;' : ''
      return `WIFI:T:${type};S:${escapedSsid};P:${escapedPass};${hiddenPart};`
    }
    case 'email': {
      const to = settings.email.to.trim()
      if (!to) return ''
      const params = new URLSearchParams()
      if (settings.email.subject.trim()) params.set('subject', settings.email.subject.trim())
      if (settings.email.body.trim()) params.set('body', settings.email.body.trim())
      const query = params.toString()
      return query ? `mailto:${to}?${query}` : `mailto:${to}`
    }
    case 'phone': {
      const cleaned = settings.phone.trim().replace(/\s+/g, '')
      return cleaned ? `tel:${cleaned}` : ''
    }
    case 'vcard': {
      const { firstName, lastName, organization, phone, email, website } = settings.vcard
      const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')
      if (!fullName && !organization.trim() && !phone.trim() && !email.trim()) {
        return ''
      }
      const lines = ['BEGIN:VCARD', 'VERSION:3.0']
      lines.push(`N:${lastName.trim()};${firstName.trim()};;;`)
      if (fullName) lines.push(`FN:${fullName}`)
      if (organization.trim()) lines.push(`ORG:${organization.trim()}`)
      if (phone.trim()) lines.push(`TEL:${phone.trim()}`)
      if (email.trim()) lines.push(`EMAIL:${email.trim()}`)
      if (website.trim()) lines.push(`URL:${website.trim()}`)
      lines.push('END:VCARD')
      return lines.join('\n')
    }
    case 'event': {
      const { title, start, end, location, description } = settings.event
      if (!title.trim()) return ''
      const dtStart = formatIcsDateTime(start)
      const dtEnd = formatIcsDateTime(end)
      const lines = ['BEGIN:VEVENT', `SUMMARY:${escapeIcsField(title.trim())}`]
      if (dtStart) lines.push(`DTSTART:${dtStart}`)
      if (dtEnd) lines.push(`DTEND:${dtEnd}`)
      if (location.trim()) lines.push(`LOCATION:${escapeIcsField(location.trim())}`)
      if (description.trim()) lines.push(`DESCRIPTION:${escapeIcsField(description.trim())}`)
      lines.push('END:VEVENT')
      return lines.join('\n')
    }
  }
}

function isFinderModule(row: number, col: number, moduleCount: number): boolean {
  const inTopLeft = row < 7 && col < 7
  const inTopRight = row < 7 && col >= moduleCount - 7
  const inBottomLeft = row >= moduleCount - 7 && col < 7
  return inTopLeft || inTopRight || inBottomLeft
}

interface LogoCutoutBounds {
  minModule: number
  maxModule: number
  logoStart: number
  logoSpan: number
  padStart: number
  padSpan: number
}

function computeLogoBounds(
  moduleCount: number,
  margin: number,
  sizePercent: number,
  padding: boolean
): LogoCutoutBounds {
  const clampedPct = Math.max(12, Math.min(30, sizePercent))
  const logoSpan = (moduleCount * clampedPct) / 100
  const padExtra = padding ? Math.max(0.8, moduleCount * 0.03) : 0
  const padSpan = logoSpan + padExtra * 2
  const center = margin + moduleCount / 2
  return {
    minModule: moduleCount / 2 - padSpan / 2,
    maxModule: moduleCount / 2 + padSpan / 2,
    logoStart: center - logoSpan / 2,
    logoSpan,
    padStart: center - padSpan / 2,
    padSpan,
  }
}

function isInsideLogoCutout(
  row: number,
  col: number,
  bounds: LogoCutoutBounds | null
): boolean {
  if (!bounds) return false
  return (
    row + 0.5 >= bounds.minModule &&
    row + 0.5 <= bounds.maxModule &&
    col + 0.5 >= bounds.minModule &&
    col + 0.5 <= bounds.maxModule
  )
}

function escapeXmlAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

function buildStyledFinderSvg(
  ox: number,
  oy: number,
  fg: string,
  outerRadius: number,
  innerRadius: number
): string {
  // Draw crisp 7x7 outer ring (stroke width 1 centered at +0.5) and 3x3 inner core
  return [
    `<rect x="${ox + 0.5}" y="${oy + 0.5}" width="6" height="6" rx="${outerRadius}" ry="${outerRadius}" fill="none" stroke="${fg}" stroke-width="1"/>`,
    `<rect x="${ox + 2}" y="${oy + 2}" width="3" height="3" rx="${innerRadius}" ry="${innerRadius}" fill="${fg}"/>`,
  ].join('')
}

export function generateQrOutput(settings: QrSettings): QrGeneratedOutput | null {
  const payload = buildQrPayload(settings)
  if (!payload) return null

  const matrix = QRCode.create(payload, {
    errorCorrectionLevel: settings.errorCorrection,
  })

  const moduleCount = matrix.modules.size
  const margin = Math.max(0, Math.min(12, Math.round(settings.margin)))
  const totalModules = moduleCount + margin * 2
  const fg = normalizeHexColor(settings.foregroundColor, '#16202a')
  const bg = normalizeHexColor(settings.backgroundColor, '#ffffff')

  const hasLogo = Boolean(settings.logo.dataUrl)
  const logoBounds = hasLogo
    ? computeLogoBounds(moduleCount, margin, settings.logo.sizePercent, settings.logo.padding)
    : null

  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalModules} ${totalModules}" width="${settings.size}" height="${settings.size}" shape-rendering="${settings.moduleStyle === 'square' ? 'crispEdges' : 'geometricPrecision'}">`,
  ]

  if (!settings.transparentBackground) {
    parts.push(`<rect width="${totalModules}" height="${totalModules}" fill="${bg}"/>`)
  }

  if (settings.moduleStyle === 'square') {
    const commands: string[] = []
    for (let row = 0; row < moduleCount; row++) {
      let runStart = -1
      for (let col = 0; col <= moduleCount; col++) {
        const isDark =
          col < moduleCount &&
          Boolean(matrix.modules.get(row, col)) &&
          !isInsideLogoCutout(row, col, logoBounds)
        if (isDark && runStart === -1) {
          runStart = col
        } else if (!isDark && runStart !== -1) {
          const runLength = col - runStart
          commands.push(`M${runStart + margin} ${row + margin}h${runLength}v1h-${runLength}z`)
          runStart = -1
        }
      }
    }
    parts.push(`<path d="${commands.join('')}" fill="${fg}"/>`)
  } else {
    const isDots = settings.moduleStyle === 'dots'
    const outerR = isDots ? 1.6 : 1.1
    const innerR = isDots ? 1.2 : 0.7

    // Styled finder eyes in the 3 corners
    parts.push(buildStyledFinderSvg(margin, margin, fg, outerR, innerR))
    parts.push(buildStyledFinderSvg(margin + moduleCount - 7, margin, fg, outerR, innerR))
    parts.push(buildStyledFinderSvg(margin, margin + moduleCount - 7, fg, outerR, innerR))

    const moduleShapes: string[] = []
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (isFinderModule(row, col, moduleCount)) continue
        if (!matrix.modules.get(row, col)) continue
        if (isInsideLogoCutout(row, col, logoBounds)) continue

        const x = col + margin
        const y = row + margin
        if (isDots) {
          moduleShapes.push(`<circle cx="${x + 0.5}" cy="${y + 0.5}" r="0.43"/>`)
        } else {
          moduleShapes.push(`<rect x="${x + 0.06}" y="${y + 0.06}" width="0.88" height="0.88" rx="0.28" ry="0.28"/>`)
        }
      }
    }
    parts.push(`<g fill="${fg}">${moduleShapes.join('')}</g>`)
  }

  if (hasLogo && logoBounds && settings.logo.dataUrl) {
    if (settings.logo.padding && !settings.transparentBackground) {
      parts.push(
        `<rect x="${logoBounds.padStart.toFixed(2)}" y="${logoBounds.padStart.toFixed(2)}" width="${logoBounds.padSpan.toFixed(2)}" height="${logoBounds.padSpan.toFixed(2)}" rx="0.7" ry="0.7" fill="${bg}"/>`
      )
    }
    parts.push(
      `<image href="${escapeXmlAttr(settings.logo.dataUrl)}" x="${logoBounds.logoStart.toFixed(2)}" y="${logoBounds.logoStart.toFixed(2)}" width="${logoBounds.logoSpan.toFixed(2)}" height="${logoBounds.logoSpan.toFixed(2)}" preserveAspectRatio="xMidYMid meet"/>`
    )
  }

  parts.push('</svg>')
  const svgMarkup = parts.join('')

  const contrastBg = settings.transparentBackground ? '#ffffff' : bg
  const contrastRatio = getContrastRatio(fg, contrastBg)
  const isInverted = getRelativeLuminance(fg) > getRelativeLuminance(contrastBg)

  return {
    payload,
    moduleCount,
    svgMarkup,
    svgByteSize: new Blob([svgMarkup], { type: 'image/svg+xml' }).size,
    contrastRatio,
    isInverted,
    isLowContrast: contrastRatio < 3.0,
  }
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + w - radius, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
  ctx.lineTo(x + w, y + h - radius)
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
  ctx.lineTo(x + radius, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

function drawStyledFinderCanvas(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  cellSize: number,
  fg: string,
  isDots: boolean
): void {
  const outerR = (isDots ? 1.6 : 1.1) * cellSize
  const innerR = (isDots ? 1.2 : 0.7) * cellSize

  ctx.strokeStyle = fg
  ctx.lineWidth = cellSize
  drawRoundedRect(
    ctx,
    (ox + 0.5) * cellSize,
    (oy + 0.5) * cellSize,
    6 * cellSize,
    6 * cellSize,
    outerR
  )
  ctx.stroke()

  ctx.fillStyle = fg
  drawRoundedRect(
    ctx,
    (ox + 2) * cellSize,
    (oy + 2) * cellSize,
    3 * cellSize,
    3 * cellSize,
    innerR
  )
  ctx.fill()
}

function loadLogoImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Unable to load QR center logo image.'))
    img.src = dataUrl
  })
}

export async function renderQrRasterBlob(
  settings: QrSettings,
  format: Exclude<QrExportFormat, 'svg'>
): Promise<Blob> {
  const payload = buildQrPayload(settings)
  if (!payload) {
    throw new Error('Enter content to generate a QR code.')
  }

  const matrix = QRCode.create(payload, {
    errorCorrectionLevel: settings.errorCorrection,
  })

  const moduleCount = matrix.modules.size
  const margin = Math.max(0, Math.min(12, Math.round(settings.margin)))
  const totalModules = moduleCount + margin * 2
  const size = Math.max(128, Math.min(4096, Math.round(settings.size)))
  const fg = normalizeHexColor(settings.foregroundColor, '#16202a')
  const bg = normalizeHexColor(settings.backgroundColor, '#ffffff')

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas 2D context is unavailable in this browser.')
  }

  if (format === 'jpg' || !settings.transparentBackground) {
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, size, size)
  } else {
    ctx.clearRect(0, 0, size, size)
  }

  const hasLogo = Boolean(settings.logo.dataUrl)
  const logoBounds = hasLogo
    ? computeLogoBounds(moduleCount, margin, settings.logo.sizePercent, settings.logo.padding)
    : null

  const cellSize = size / totalModules
  ctx.fillStyle = fg

  if (settings.moduleStyle === 'square') {
    for (let row = 0; row < moduleCount; row++) {
      const y0 = Math.floor((row + margin) * cellSize)
      const y1 = Math.floor((row + margin + 1) * cellSize)
      const h = Math.max(1, y1 - y0)

      let runStart = -1
      for (let col = 0; col <= moduleCount; col++) {
        const isDark =
          col < moduleCount &&
          Boolean(matrix.modules.get(row, col)) &&
          !isInsideLogoCutout(row, col, logoBounds)
        if (isDark && runStart === -1) {
          runStart = col
        } else if (!isDark && runStart !== -1) {
          const x0 = Math.floor((runStart + margin) * cellSize)
          const x1 = Math.floor((col + margin) * cellSize)
          ctx.fillRect(x0, y0, Math.max(1, x1 - x0), h)
          runStart = -1
        }
      }
    }
  } else {
    const isDots = settings.moduleStyle === 'dots'
    drawStyledFinderCanvas(ctx, margin, margin, cellSize, fg, isDots)
    drawStyledFinderCanvas(ctx, margin + moduleCount - 7, margin, cellSize, fg, isDots)
    drawStyledFinderCanvas(ctx, margin, margin + moduleCount - 7, cellSize, fg, isDots)

    ctx.fillStyle = fg
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (isFinderModule(row, col, moduleCount)) continue
        if (!matrix.modules.get(row, col)) continue
        if (isInsideLogoCutout(row, col, logoBounds)) continue

        const x = (col + margin) * cellSize
        const y = (row + margin) * cellSize
        if (isDots) {
          ctx.beginPath()
          ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize * 0.43, 0, Math.PI * 2)
          ctx.fill()
        } else {
          drawRoundedRect(
            ctx,
            x + cellSize * 0.06,
            y + cellSize * 0.06,
            cellSize * 0.88,
            cellSize * 0.88,
            cellSize * 0.28
          )
          ctx.fill()
        }
      }
    }
  }

  if (hasLogo && logoBounds && settings.logo.dataUrl) {
    if (settings.logo.padding && (format === 'jpg' || !settings.transparentBackground)) {
      ctx.fillStyle = bg
      drawRoundedRect(
        ctx,
        logoBounds.padStart * cellSize,
        logoBounds.padStart * cellSize,
        logoBounds.padSpan * cellSize,
        logoBounds.padSpan * cellSize,
        0.7 * cellSize
      )
      ctx.fill()
    }

    const logoImg = await loadLogoImage(settings.logo.dataUrl)
    const boxSize = logoBounds.logoSpan * cellSize
    const boxX = logoBounds.logoStart * cellSize
    const boxY = logoBounds.logoStart * cellSize
    const aspect = logoImg.naturalWidth > 0 && logoImg.naturalHeight > 0
      ? logoImg.naturalWidth / logoImg.naturalHeight
      : 1

    let drawW = boxSize
    let drawH = boxSize
    if (aspect > 1) {
      drawH = boxSize / aspect
    } else if (aspect < 1) {
      drawW = boxSize * aspect
    }

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(
      logoImg,
      boxX + (boxSize - drawW) / 2,
      boxY + (boxSize - drawH) / 2,
      drawW,
      drawH
    )
  }

  const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png'
  const quality = format === 'jpg' ? 0.95 : undefined

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(`Failed to encode QR code as ${format.toUpperCase()}.`))
          return
        }
        resolve(blob)
      },
      mimeType,
      quality
    )
  })
}
