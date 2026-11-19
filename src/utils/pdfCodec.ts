import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type {
  PdfMarginPreset,
  PdfOrientation,
  PdfPageSize,
  PdfSheetPreviewItem,
} from '../types/converter'
import { encodeCanvasToImageBlob } from './imageCodecs'

let pdfWorkerConfigured = false

async function getPdfJs() {
  const pdfjs = await import('pdfjs-dist')
  if (!pdfWorkerConfigured) {
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl
    pdfWorkerConfigured = true
  }
  return pdfjs
}

export async function inspectPdfMetadata(file: File): Promise<{
  pageCount: number
  firstPageWidth: number
  firstPageHeight: number
}> {
  const pdfjs = await getPdfJs()
  const data = new Uint8Array(await file.arrayBuffer())
  const loadingTask = pdfjs.getDocument({ data })
  const doc = await loadingTask.promise
  try {
    const firstPage = await doc.getPage(1)
    const viewport = firstPage.getViewport({ scale: 1 })
    return {
      pageCount: doc.numPages,
      firstPageWidth: Math.round(viewport.width),
      firstPageHeight: Math.round(viewport.height),
    }
  } finally {
    await loadingTask.destroy()
  }
}

export async function renderPdfPagesToCanvases(
  file: File,
  scale: number
): Promise<Array<{ pageNumber: number; canvas: HTMLCanvasElement; width: number; height: number }>> {
  const pdfjs = await getPdfJs()
  const data = new Uint8Array(await file.arrayBuffer())
  const loadingTask = pdfjs.getDocument({ data })
  const doc = await loadingTask.promise
  const safeScale = Math.max(0.5, Math.min(4, scale))

  try {
    const rendered: Array<{
      pageNumber: number
      canvas: HTMLCanvasElement
      width: number
      height: number
    }> = []

    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      const page = await doc.getPage(pageNum)
      const viewport = page.getViewport({ scale: safeScale })

      const rawCanvas = document.createElement('canvas')
      rawCanvas.width = Math.max(1, Math.round(viewport.width))
      rawCanvas.height = Math.max(1, Math.round(viewport.height))

      await page.render({
        canvas: rawCanvas,
        viewport,
      }).promise

      // Composite over pure white paper so transparent PDF regions render consistently across formats.
      const finalCanvas = document.createElement('canvas')
      finalCanvas.width = rawCanvas.width
      finalCanvas.height = rawCanvas.height
      const ctx = finalCanvas.getContext('2d')
      if (!ctx) throw new Error('Canvas 2D context is unavailable.')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height)
      ctx.drawImage(rawCanvas, 0, 0)

      rendered.push({
        pageNumber: pageNum,
        canvas: finalCanvas,
        width: finalCanvas.width,
        height: finalCanvas.height,
      })
    }

    return rendered
  } finally {
    await loadingTask.destroy()
  }
}

const PAPER_SIZES_PT = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
} as const

const MARGIN_PT: Record<PdfMarginPreset, number> = {
  none: 0,
  narrow: 24,
  standard: 48,
}

export interface PdfBuildSource {
  canvas: HTMLCanvasElement
  sourceName: string
  preferJpg?: boolean
}

export async function buildPdfFromCanvases(
  sources: PdfBuildSource[],
  options: {
    pageSize: PdfPageSize
    orientation: PdfOrientation
    margin: PdfMarginPreset
  }
): Promise<{
  blob: Blob
  sheets: PdfSheetPreviewItem[]
}> {
  const { PDFDocument } = await import('pdf-lib')
  const pdfDoc = await PDFDocument.create()
  const marginPt = MARGIN_PT[options.margin]
  const sheets: PdfSheetPreviewItem[] = []

  for (let i = 0; i < sources.length; i++) {
    const src = sources[i]
    const imgW = src.canvas.width
    const imgH = src.canvas.height

    let sheetWidthPt: number
    let sheetHeightPt: number

    if (options.pageSize === 'fit') {
      const baseW = Math.max(72, imgW * 0.75)
      const baseH = Math.max(72, imgH * 0.75)
      sheetWidthPt = baseW + marginPt * 2
      sheetHeightPt = baseH + marginPt * 2
    } else {
      const preset = PAPER_SIZES_PT[options.pageSize]
      const useLandscape =
        options.orientation === 'landscape' ||
        (options.orientation === 'auto' && imgW > imgH)
      sheetWidthPt = useLandscape ? preset.height : preset.width
      sheetHeightPt = useLandscape ? preset.width : preset.height
    }

    const page = pdfDoc.addPage([sheetWidthPt, sheetHeightPt])

    const availW = Math.max(16, sheetWidthPt - marginPt * 2)
    const availH = Math.max(16, sheetHeightPt - marginPt * 2)
    const scale = Math.min(availW / imgW, availH / imgH)
    const drawW = imgW * scale
    const drawH = imgH * scale
    const x = (sheetWidthPt - drawW) / 2
    const y = (sheetHeightPt - drawH) / 2

    const encodedBlob = await encodeCanvasToImageBlob(
      src.canvas,
      src.preferJpg ? 'jpg' : 'png',
      92
    )
    const encodedBytes = new Uint8Array(await encodedBlob.arrayBuffer())
    const embeddedImage = src.preferJpg
      ? await pdfDoc.embedJpg(encodedBytes)
      : await pdfDoc.embedPng(encodedBytes)

    page.drawImage(embeddedImage, {
      x,
      y,
      width: drawW,
      height: drawH,
    })

    // Generate preview URL from the PNG/JPG blob already encoded for embedding.
    sheets.push({
      pageNumber: i + 1,
      imageUrl: URL.createObjectURL(encodedBlob),
      imageWidth: imgW,
      imageHeight: imgH,
      sheetWidthPt,
      sheetHeightPt,
      marginPt,
      sourceName: src.sourceName,
    })
  }

  const pdfBytes = await pdfDoc.save()
  const copy = new Uint8Array(pdfBytes.byteLength)
  copy.set(pdfBytes)
  const blob = new Blob([copy.buffer], { type: 'application/pdf' })

  return { blob, sheets }
}
