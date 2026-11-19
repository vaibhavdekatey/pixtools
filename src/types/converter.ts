export type InputFormat = 'png' | 'jpg' | 'webp' | 'gif' | 'pdf' | 'svg' | 'bmp' | 'avif'

export type OutputFormat = 'png' | 'jpg' | 'webp' | 'gif' | 'pdf'

export type ResizeMode = 'original' | 'scale' | 'custom'

export type PdfPageSize = 'fit' | 'a4' | 'letter'

export type PdfOrientation = 'auto' | 'portrait' | 'landscape'

export type PdfMarginPreset = 'none' | 'narrow' | 'standard'

export type CompareViewMode = 'split' | 'converted' | 'original'

export interface QueuedFileItem {
  id: string
  file: File
  name: string
  size: number
  sourceFormat: InputFormat
  previewUrl: string
  width: number | null
  height: number | null
  pageCount: number | null
  frameCount: number | null
  status: 'ready' | 'error'
  errorMessage?: string
}

export interface ConversionOptions {
  targetFormat: OutputFormat
  quality: number
  backgroundColor: string
  resizeMode: ResizeMode
  scalePercent: number
  customWidth: number | null
  customHeight: number | null
  maintainAspect: boolean
  svgRasterScale: number
  // GIF options
  gifFrameDelayMs: number
  gifLoop: boolean
  gifCombineMultiple: boolean
  // PDF output options (Image -> PDF)
  pdfPageSize: PdfPageSize
  pdfOrientation: PdfOrientation
  pdfMargin: PdfMarginPreset
  pdfCombineMultiple: boolean
  // PDF input options (PDF -> Image/GIF)
  pdfRenderScale: number
}

export interface RenderedPageArtifact {
  index: number
  label: string
  blob: Blob
  url: string
  width: number
  height: number
  originalPreviewUrl?: string
}

export interface PdfSheetPreviewItem {
  pageNumber: number
  imageUrl: string
  imageWidth: number
  imageHeight: number
  sheetWidthPt: number
  sheetHeightPt: number
  marginPt: number
  sourceName: string
}

export interface ConversionPreviewResult {
  kind: 'image' | 'animated-gif' | 'pdf-output' | 'pdf-pages' | 'gif-frames'
  primaryBlob: Blob
  primaryUrl: string
  fileName: string
  width: number
  height: number
  originalSize: number
  convertedSize: number
  /** For multi-page PDF -> Images or multi-frame GIF -> Images */
  pages?: RenderedPageArtifact[]
  /** For Image(s) -> PDF page sheet visualization */
  pdfSheets?: PdfSheetPreviewItem[]
  /** For Image -> Image / Frame -> Image before-after comparison */
  originalCompareUrl?: string
  note?: string
}
