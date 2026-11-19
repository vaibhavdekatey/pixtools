import type {
  ConversionOptions,
  ConversionPreviewResult,
  QueuedFileItem,
  RenderedPageArtifact,
} from '../types/converter'
import { buildOutputFileName, sanitizeFileBase, stripExtension } from './format'
import { decodeGifFrames, encodeCanvasesToGifBlob } from './gifCodec'
import {
  computeTargetDimensions,
  decodeImageFileToCanvas,
  encodeCanvasToImageBlob,
  resizeAndMatteCanvas,
} from './imageCodecs'
import { buildPdfFromCanvases, renderPdfPagesToCanvases } from './pdfCodec'

function revokeUrlSafe(url: string | undefined): void {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

export function disposeConversionResult(result: ConversionPreviewResult | null): void {
  if (!result) return
  revokeUrlSafe(result.primaryUrl)
  revokeUrlSafe(result.originalCompareUrl)
  if (result.pages) {
    for (const page of result.pages) {
      revokeUrlSafe(page.url)
      revokeUrlSafe(page.originalPreviewUrl)
    }
  }
  if (result.pdfSheets) {
    for (const sheet of result.pdfSheets) {
      revokeUrlSafe(sheet.imageUrl)
    }
  }
}

async function canvasToPreviewPngUrl(canvas: HTMLCanvasElement): Promise<string> {
  const blob = await encodeCanvasToImageBlob(canvas, 'png', 100)
  return URL.createObjectURL(blob)
}

function resolveCanvasForItem(
  canvas: HTMLCanvasElement,
  options: ConversionOptions
): { canvas: HTMLCanvasElement; width: number; height: number } {
  const dims = computeTargetDimensions(
    canvas.width,
    canvas.height,
    options.resizeMode,
    options.scalePercent,
    options.customWidth,
    options.customHeight,
    options.maintainAspect
  )
  const needsMatte = options.targetFormat === 'jpg'
  const prepared = resizeAndMatteCanvas(
    canvas,
    dims.width,
    dims.height,
    needsMatte ? options.backgroundColor : undefined
  )
  return { canvas: prepared, width: dims.width, height: dims.height }
}

async function encodeRasterCanvas(
  canvas: HTMLCanvasElement,
  options: ConversionOptions
): Promise<Blob> {
  if (options.targetFormat === 'gif') {
    return encodeCanvasesToGifBlob([{ canvas, delayMs: options.gifFrameDelayMs }], {
      targetWidth: canvas.width,
      targetHeight: canvas.height,
      defaultDelayMs: options.gifFrameDelayMs,
      loop: options.gifLoop,
    })
  }
  const format =
    options.targetFormat === 'jpg' || options.targetFormat === 'webp'
      ? options.targetFormat
      : 'png'
  return encodeCanvasToImageBlob(canvas, format, options.quality)
}

async function convertPdfSource(
  item: QueuedFileItem,
  options: ConversionOptions
): Promise<ConversionPreviewResult> {
  const pages = await renderPdfPagesToCanvases(item.file, options.pdfRenderScale)
  if (pages.length === 0) {
    throw new Error('This PDF contains no readable pages.')
  }

  if (options.targetFormat === 'pdf') {
    const pdfSources = pages.map((p) => ({
      canvas: p.canvas,
      sourceName: `${item.name} (Page ${p.pageNumber})`,
      preferJpg: false,
    }))
    const { blob, sheets } = await buildPdfFromCanvases(pdfSources, {
      pageSize: options.pdfPageSize,
      orientation: options.pdfOrientation,
      margin: options.pdfMargin,
    })
    return {
      kind: 'pdf-output',
      primaryBlob: blob,
      primaryUrl: URL.createObjectURL(blob),
      fileName: buildOutputFileName(item.name, 'pdf', 'reformatted'),
      width: Math.round(sheets[0].sheetWidthPt),
      height: Math.round(sheets[0].sheetHeightPt),
      originalSize: item.size,
      convertedSize: blob.size,
      pdfSheets: sheets,
      note: 'PDF pages rasterized and re-laid out with selected paper dimensions.',
    }
  }

  // Multi-page PDF -> combined animated GIF when combining is selected
  if (options.targetFormat === 'gif' && pages.length > 1 && options.gifCombineMultiple) {
    const firstPrepared = resolveCanvasForItem(pages[0].canvas, options)
    const gifBlob = await encodeCanvasesToGifBlob(
      pages.map((p) => ({ canvas: p.canvas, delayMs: options.gifFrameDelayMs })),
      {
        targetWidth: firstPrepared.width,
        targetHeight: firstPrepared.height,
        defaultDelayMs: options.gifFrameDelayMs,
        loop: options.gifLoop,
      }
    )
    return {
      kind: 'animated-gif',
      primaryBlob: gifBlob,
      primaryUrl: URL.createObjectURL(gifBlob),
      fileName: buildOutputFileName(item.name, 'gif'),
      width: firstPrepared.width,
      height: firstPrepared.height,
      originalSize: item.size,
      convertedSize: gifBlob.size,
      note: `Combined ${pages.length} PDF pages into an animated GIF.`,
    }
  }

  const pageArtifacts: RenderedPageArtifact[] = []
  for (const page of pages) {
    const prepared = resolveCanvasForItem(page.canvas, options)
    const blob = await encodeRasterCanvas(prepared.canvas, options)
    const originalUrl = await canvasToPreviewPngUrl(page.canvas)
    pageArtifacts.push({
      index: page.pageNumber - 1,
      label: `Page ${page.pageNumber}`,
      blob,
      url: URL.createObjectURL(blob),
      width: prepared.width,
      height: prepared.height,
      originalPreviewUrl: originalUrl,
    })
  }

  const first = pageArtifacts[0]
  return {
    kind: 'pdf-pages',
    primaryBlob: first.blob,
    primaryUrl: first.url,
    fileName:
      pageArtifacts.length === 1
        ? buildOutputFileName(item.name, options.targetFormat)
        : buildOutputFileName(item.name, options.targetFormat, 'page-1'),
    width: first.width,
    height: first.height,
    originalSize: item.size,
    convertedSize: pageArtifacts.reduce((sum, p) => sum + p.blob.size, 0),
    pages: pageArtifacts,
  }
}

async function convertGifSource(
  item: QueuedFileItem,
  options: ConversionOptions
): Promise<ConversionPreviewResult> {
  const frames = await decodeGifFrames(item.file)
  if (frames.length === 0) {
    throw new Error('Could not read any frames from this GIF.')
  }

  // Animated or static GIF -> GIF preserves all frames and updates timing/dimensions.
  if (options.targetFormat === 'gif') {
    const firstPrepared = resolveCanvasForItem(frames[0].canvas, options)
    const gifBlob = await encodeCanvasesToGifBlob(
      frames.map((f) => ({
        canvas: f.canvas,
        delayMs: frames.length > 1 ? f.delayMs : options.gifFrameDelayMs,
      })),
      {
        targetWidth: firstPrepared.width,
        targetHeight: firstPrepared.height,
        defaultDelayMs: options.gifFrameDelayMs,
        loop: options.gifLoop,
      }
    )
    return {
      kind: frames.length > 1 ? 'animated-gif' : 'image',
      primaryBlob: gifBlob,
      primaryUrl: URL.createObjectURL(gifBlob),
      fileName: buildOutputFileName(item.name, 'gif', 'optimized'),
      width: firstPrepared.width,
      height: firstPrepared.height,
      originalSize: item.size,
      convertedSize: gifBlob.size,
      originalCompareUrl: frames.length === 1 ? item.previewUrl : undefined,
      note:
        frames.length > 1
          ? `Re-encoded ${frames.length} animated frames.`
          : undefined,
    }
  }

  if (options.targetFormat === 'pdf') {
    const pdfSources = frames.map((frame) => {
      const prepared = resolveCanvasForItem(frame.canvas, options)
      return {
        canvas: prepared.canvas,
        sourceName:
          frames.length > 1 ? `${item.name} (Frame ${frame.index + 1})` : item.name,
        preferJpg: false,
      }
    })
    const { blob, sheets } = await buildPdfFromCanvases(pdfSources, {
      pageSize: options.pdfPageSize,
      orientation: options.pdfOrientation,
      margin: options.pdfMargin,
    })
    return {
      kind: 'pdf-output',
      primaryBlob: blob,
      primaryUrl: URL.createObjectURL(blob),
      fileName: buildOutputFileName(item.name, 'pdf'),
      width: Math.round(sheets[0].sheetWidthPt),
      height: Math.round(sheets[0].sheetHeightPt),
      originalSize: item.size,
      convertedSize: blob.size,
      pdfSheets: sheets,
      note:
        frames.length > 1
          ? `Exported all ${frames.length} GIF frames as PDF pages.`
          : undefined,
    }
  }

  // GIF -> PNG / JPG / WebP: convert every frame so user can scrub & export any or all frames.
  const frameArtifacts: RenderedPageArtifact[] = []
  for (const frame of frames) {
    const prepared = resolveCanvasForItem(frame.canvas, options)
    const blob = await encodeRasterCanvas(prepared.canvas, options)
    const originalUrl = await canvasToPreviewPngUrl(frame.canvas)
    frameArtifacts.push({
      index: frame.index,
      label: frames.length > 1 ? `Frame ${frame.index + 1}` : 'Frame 1',
      blob,
      url: URL.createObjectURL(blob),
      width: prepared.width,
      height: prepared.height,
      originalPreviewUrl: originalUrl,
    })
  }

  if (frameArtifacts.length === 1) {
    const only = frameArtifacts[0]
    return {
      kind: 'image',
      primaryBlob: only.blob,
      primaryUrl: only.url,
      fileName: buildOutputFileName(item.name, options.targetFormat),
      width: only.width,
      height: only.height,
      originalSize: item.size,
      convertedSize: only.blob.size,
      originalCompareUrl: only.originalPreviewUrl,
    }
  }

  const first = frameArtifacts[0]
  return {
    kind: 'gif-frames',
    primaryBlob: first.blob,
    primaryUrl: first.url,
    fileName: buildOutputFileName(item.name, options.targetFormat, 'frame-1'),
    width: first.width,
    height: first.height,
    originalSize: item.size,
    convertedSize: frameArtifacts.reduce((sum, f) => sum + f.blob.size, 0),
    pages: frameArtifacts,
    note: `Extracted ${frameArtifacts.length} frames from animated GIF.`,
  }
}

export async function runSingleItemConversion(
  item: QueuedFileItem,
  options: ConversionOptions
): Promise<ConversionPreviewResult> {
  if (item.sourceFormat === 'pdf') {
    return convertPdfSource(item, options)
  }

  if (item.sourceFormat === 'gif') {
    return convertGifSource(item, options)
  }

  const decoded = await decodeImageFileToCanvas(item.file, options.svgRasterScale)
  const prepared = resolveCanvasForItem(decoded.canvas, options)

  if (options.targetFormat === 'pdf') {
    const preferJpg = item.sourceFormat === 'jpg'
    const { blob, sheets } = await buildPdfFromCanvases(
      [
        {
          canvas: prepared.canvas,
          sourceName: item.name,
          preferJpg,
        },
      ],
      {
        pageSize: options.pdfPageSize,
        orientation: options.pdfOrientation,
        margin: options.pdfMargin,
      }
    )
    return {
      kind: 'pdf-output',
      primaryBlob: blob,
      primaryUrl: URL.createObjectURL(blob),
      fileName: buildOutputFileName(item.name, 'pdf'),
      width: Math.round(sheets[0].sheetWidthPt),
      height: Math.round(sheets[0].sheetHeightPt),
      originalSize: item.size,
      convertedSize: blob.size,
      pdfSheets: sheets,
    }
  }

  const blob = await encodeRasterCanvas(prepared.canvas, options)
  const url = URL.createObjectURL(blob)
  const originalCompareUrl =
    item.sourceFormat === 'svg'
      ? await canvasToPreviewPngUrl(decoded.canvas)
      : URL.createObjectURL(item.file)

  return {
    kind: 'image',
    primaryBlob: blob,
    primaryUrl: url,
    fileName: buildOutputFileName(item.name, options.targetFormat),
    width: prepared.width,
    height: prepared.height,
    originalSize: item.size,
    convertedSize: blob.size,
    originalCompareUrl,
  }
}

export async function runCombinedMultiFileConversion(
  items: QueuedFileItem[],
  options: ConversionOptions
): Promise<ConversionPreviewResult> {
  const validItems = items.filter((item) => item.status === 'ready')
  if (validItems.length === 0) {
    throw new Error('Add at least one valid file to convert.')
  }

  if (options.targetFormat === 'pdf' && options.pdfCombineMultiple && validItems.length > 1) {
    const pdfSources: Array<{ canvas: HTMLCanvasElement; sourceName: string; preferJpg: boolean }> = []
    let totalOriginalSize = 0

    for (const item of validItems) {
      totalOriginalSize += item.size
      if (item.sourceFormat === 'pdf') {
        const pages = await renderPdfPagesToCanvases(item.file, options.pdfRenderScale)
        for (const p of pages) {
          const prepared = resolveCanvasForItem(p.canvas, options)
          pdfSources.push({
            canvas: prepared.canvas,
            sourceName: `${item.name} (Page ${p.pageNumber})`,
            preferJpg: false,
          })
        }
      } else if (item.sourceFormat === 'gif') {
        const frames = await decodeGifFrames(item.file)
        for (const f of frames) {
          const prepared = resolveCanvasForItem(f.canvas, options)
          pdfSources.push({
            canvas: prepared.canvas,
            sourceName:
              frames.length > 1 ? `${item.name} (Frame ${f.index + 1})` : item.name,
            preferJpg: false,
          })
        }
      } else {
        const decoded = await decodeImageFileToCanvas(item.file, options.svgRasterScale)
        const prepared = resolveCanvasForItem(decoded.canvas, options)
        pdfSources.push({
          canvas: prepared.canvas,
          sourceName: item.name,
          preferJpg: item.sourceFormat === 'jpg',
        })
      }
    }

    const { blob, sheets } = await buildPdfFromCanvases(pdfSources, {
      pageSize: options.pdfPageSize,
      orientation: options.pdfOrientation,
      margin: options.pdfMargin,
    })

    const baseName = sanitizeFileBase(stripExtension(validItems[0].name), 'combined')
    return {
      kind: 'pdf-output',
      primaryBlob: blob,
      primaryUrl: URL.createObjectURL(blob),
      fileName: `${baseName}-merged.pdf`,
      width: Math.round(sheets[0].sheetWidthPt),
      height: Math.round(sheets[0].sheetHeightPt),
      originalSize: totalOriginalSize,
      convertedSize: blob.size,
      pdfSheets: sheets,
      note: `Combined ${validItems.length} files into a ${sheets.length}-page PDF.`,
    }
  }

  if (options.targetFormat === 'gif' && options.gifCombineMultiple && validItems.length > 1) {
    const frames: Array<{ canvas: HTMLCanvasElement; delayMs: number }> = []
    let totalOriginalSize = 0
    let targetW = 0
    let targetH = 0

    for (const item of validItems) {
      totalOriginalSize += item.size
      if (item.sourceFormat === 'pdf') {
        const pages = await renderPdfPagesToCanvases(item.file, options.pdfRenderScale)
        for (const p of pages) {
          if (targetW === 0) {
            const first = resolveCanvasForItem(p.canvas, options)
            targetW = first.width
            targetH = first.height
          }
          frames.push({ canvas: p.canvas, delayMs: options.gifFrameDelayMs })
        }
      } else if (item.sourceFormat === 'gif') {
        const gifFrames = await decodeGifFrames(item.file)
        for (const f of gifFrames) {
          if (targetW === 0) {
            const first = resolveCanvasForItem(f.canvas, options)
            targetW = first.width
            targetH = first.height
          }
          frames.push({
            canvas: f.canvas,
            delayMs: gifFrames.length > 1 ? f.delayMs : options.gifFrameDelayMs,
          })
        }
      } else {
        const decoded = await decodeImageFileToCanvas(item.file, options.svgRasterScale)
        if (targetW === 0) {
          const first = resolveCanvasForItem(decoded.canvas, options)
          targetW = first.width
          targetH = first.height
        }
        frames.push({ canvas: decoded.canvas, delayMs: options.gifFrameDelayMs })
      }
    }

    const gifBlob = await encodeCanvasesToGifBlob(frames, {
      targetWidth: targetW,
      targetHeight: targetH,
      defaultDelayMs: options.gifFrameDelayMs,
      loop: options.gifLoop,
    })

    const baseName = sanitizeFileBase(stripExtension(validItems[0].name), 'animation')
    return {
      kind: 'animated-gif',
      primaryBlob: gifBlob,
      primaryUrl: URL.createObjectURL(gifBlob),
      fileName: `${baseName}-animated.gif`,
      width: targetW,
      height: targetH,
      originalSize: totalOriginalSize,
      convertedSize: gifBlob.size,
      note: `Combined ${frames.length} frames into an animated GIF.`,
    }
  }

  throw new Error('Combined mode is not active for this configuration.')
}
