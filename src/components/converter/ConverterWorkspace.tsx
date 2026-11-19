import { useDeferredValue, useEffect, useRef, useState } from 'react'
import type {
  ConversionOptions,
  ConversionPreviewResult,
  OutputFormat,
  QueuedFileItem,
} from '../../types/converter'
import {
  disposeConversionResult,
  runCombinedMultiFileConversion,
  runSingleItemConversion,
} from '../../utils/convertPipeline'
import { downloadBlob, downloadZipArchive } from '../../utils/download'
import {
  buildOutputFileName,
  detectInputFormat,
  sanitizeFileBase,
  stripExtension,
} from '../../utils/format'
import { inspectGifFrameCount } from '../../utils/gifCodec'
import { inspectImageDimensions } from '../../utils/imageCodecs'
import { inspectPdfMetadata } from '../../utils/pdfCodec'
import { DropZone } from '../common/DropZone'
import { NoticeBanner } from '../common/NoticeBanner'
import { ConversionSettings } from './ConversionSettings'
import {
  ConverterPreviewStage,
  type BatchExportProgress,
} from './ConverterPreviewStage'
import { FileQueueList } from './FileQueueList'
import { FormatSelector } from './FormatSelector'

const INITIAL_OPTIONS: ConversionOptions = {
  targetFormat: 'webp',
  quality: 86,
  backgroundColor: '#ffffff',
  resizeMode: 'original',
  scalePercent: 100,
  customWidth: null,
  customHeight: null,
  maintainAspect: true,
  svgRasterScale: 2,
  gifFrameDelayMs: 400,
  gifLoop: true,
  gifCombineMultiple: true,
  pdfPageSize: 'fit',
  pdfOrientation: 'auto',
  pdfMargin: 'narrow',
  pdfCombineMultiple: true,
  pdfRenderScale: 2,
}

const ACCEPTED_MIME_AND_EXT =
  '.png,.jpg,.jpeg,.webp,.gif,.pdf,.svg,.bmp,.avif,image/png,image/jpeg,image/webp,image/gif,application/pdf,image/svg+xml,image/bmp,image/avif'

export default function ConverterWorkspace() {
  const [items, setItems] = useState<QueuedFileItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [options, setOptions] = useState<ConversionOptions>(INITIAL_OPTIONS)
  const [ingestWarning, setIngestWarning] = useState<string | null>(null)

  const [previewResult, setPreviewResult] = useState<ConversionPreviewResult | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [conversionError, setConversionError] = useState<string | null>(null)
  const [isExportingBatch, setIsExportingBatch] = useState(false)
  const [batchProgress, setBatchProgress] = useState<BatchExportProgress | null>(null)
  const [batchWarning, setBatchWarning] = useState<string | null>(null)
  const [mobileOptionsOpen, setMobileOptionsOpen] = useState(false)

  const conversionSeqRef = useRef(0)
  const previewResultRef = useRef<ConversionPreviewResult | null>(null)
  const itemsRef = useRef<QueuedFileItem[]>([])
  itemsRef.current = items

  const deferredOptions = useDeferredValue(options)

  const activeItem =
    items.find((item) => item.id === selectedId) ??
    items.find((item) => item.status === 'ready') ??
    null

  const readyItems = items.filter((item) => item.status === 'ready')
  const isCombinedMode =
    readyItems.length > 1 &&
    ((options.targetFormat === 'pdf' && options.pdfCombineMultiple) ||
      (options.targetFormat === 'gif' && options.gifCombineMultiple))

  // Clean up all queued object URLs and preview blobs on unmount
  useEffect(() => {
    return () => {
      disposeConversionResult(previewResultRef.current)
      for (const item of itemsRef.current) {
        if (item.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.previewUrl)
        }
      }
    }
  }, [])

  // Live conversion preview runner with stale-request cancellation
  useEffect(() => {
    const seq = ++conversionSeqRef.current
    const readyList = items.filter((item) => item.status === 'ready')
    const currentSelected =
      readyList.find((item) => item.id === selectedId) ?? readyList[0] ?? null

    if (!currentSelected) {
      disposeConversionResult(previewResultRef.current)
      previewResultRef.current = null
      setPreviewResult(null)
      setConversionError(null)
      setIsConverting(false)
      return
    }

    const combinedActive =
      readyList.length > 1 &&
      ((deferredOptions.targetFormat === 'pdf' && deferredOptions.pdfCombineMultiple) ||
        (deferredOptions.targetFormat === 'gif' && deferredOptions.gifCombineMultiple))

    setIsConverting(true)
    setConversionError(null)

    const task = combinedActive
      ? runCombinedMultiFileConversion(readyList, deferredOptions)
      : runSingleItemConversion(currentSelected, deferredOptions)

    task
      .then((nextResult) => {
        if (conversionSeqRef.current !== seq) {
          disposeConversionResult(nextResult)
          return
        }
        disposeConversionResult(previewResultRef.current)
        previewResultRef.current = nextResult
        setPreviewResult(nextResult)
        setIsConverting(false)
      })
      .catch((err) => {
        if (conversionSeqRef.current !== seq) return
        setConversionError(
          err instanceof Error ? err.message : 'Unable to convert this file with the chosen settings.'
        )
        setIsConverting(false)
      })
  }, [items, selectedId, deferredOptions])

  async function handleFilesSelected(fileList: FileList | File[]) {
    const incoming = Array.from(fileList)
    if (incoming.length === 0) return

    const rejectedNames: string[] = []
    const nextQueued: QueuedFileItem[] = []

    for (const file of incoming) {
      const detected = detectInputFormat(file)
      if (!detected) {
        rejectedNames.push(file.name)
        continue
      }

      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const previewUrl = detected === 'pdf' ? '' : URL.createObjectURL(file)

      try {
        if (detected === 'pdf') {
          const meta = await inspectPdfMetadata(file)
          nextQueued.push({
            id,
            file,
            name: file.name,
            size: file.size,
            sourceFormat: detected,
            previewUrl,
            width: meta.firstPageWidth,
            height: meta.firstPageHeight,
            pageCount: meta.pageCount,
            frameCount: null,
            status: 'ready',
          })
        } else if (detected === 'gif') {
          const gifMeta = await inspectGifFrameCount(file)
          nextQueued.push({
            id,
            file,
            name: file.name,
            size: file.size,
            sourceFormat: detected,
            previewUrl,
            width: gifMeta.width,
            height: gifMeta.height,
            pageCount: null,
            frameCount: gifMeta.frameCount,
            status: 'ready',
          })
        } else {
          const dims = await inspectImageDimensions(file)
          nextQueued.push({
            id,
            file,
            name: file.name,
            size: file.size,
            sourceFormat: detected,
            previewUrl,
            width: dims.width,
            height: dims.height,
            pageCount: null,
            frameCount: null,
            status: 'ready',
          })
        }
      } catch (err) {
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        nextQueued.push({
          id,
          file,
          name: file.name,
          size: file.size,
          sourceFormat: detected,
          previewUrl: '',
          width: null,
          height: null,
          pageCount: null,
          frameCount: null,
          status: 'error',
          errorMessage:
            err instanceof Error ? err.message : `Unable to read ${file.name}.`,
        })
      }
    }

    if (rejectedNames.length > 0) {
      setIngestWarning(
        `Unsupported file type skipped: ${rejectedNames.join(', ')}. Supported inputs: PNG, JPG, WebP, GIF, SVG, BMP, AVIF, and PDF.`
      )
    } else {
      setIngestWarning(null)
    }

    if (nextQueued.length === 0) return

    // Smart default target format on first drop so user never sees redundant PNG -> PNG by default.
    const wasEmpty = itemsRef.current.length === 0
    setItems((prev) => [...prev, ...nextQueued])

    if (wasEmpty && nextQueued[0].status === 'ready') {
      const firstFormat = nextQueued[0].sourceFormat
      setOptions((curr) => {
        if (firstFormat === 'pdf' && curr.targetFormat === 'pdf') {
          return { ...curr, targetFormat: 'png' }
        }
        if (firstFormat === curr.targetFormat) {
          return { ...curr, targetFormat: firstFormat === 'png' ? 'webp' : 'png' }
        }
        return curr
      })
    }

    setSelectedId((curr) => curr ?? nextQueued[0].id)
  }

  function handleFormatChange(targetFormat: OutputFormat) {
    setOptions((prev) => ({ ...prev, targetFormat }))
  }

  function handleUpdateOptions(patch: Partial<ConversionOptions>) {
    setOptions((prev) => ({ ...prev, ...patch }))
  }

  function handleMoveItem(id: string, direction: -1 | 1) {
    setItems((prev) => {
      const idx = prev.findIndex((item) => item.id === id)
      const swapIdx = idx + direction
      if (idx === -1 || swapIdx < 0 || swapIdx >= prev.length) return prev
      const copy = [...prev]
      const temp = copy[idx]
      copy[idx] = copy[swapIdx]
      copy[swapIdx] = temp
      return copy
    })
  }

  function handleRemoveItem(id: string) {
    setItems((prev) => {
      const removed = prev.find((item) => item.id === id)
      if (removed?.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(removed.previewUrl)
      }
      const remaining = prev.filter((item) => item.id !== id)
      setSelectedId((curr) => {
        if (curr !== id) return curr
        return remaining[0]?.id ?? null
      })
      return remaining
    })
  }

  function handleClearAll() {
    setItems((prev) => {
      for (const item of prev) {
        if (item.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.previewUrl)
        }
      }
      return []
    })
    setSelectedId(null)
    setIngestWarning(null)
    setConversionError(null)
  }

  function handleDownloadPrimary(artifactIndex: number) {
    if (!previewResult) return
    if (previewResult.pages && previewResult.pages.length > 0) {
      const chosen = previewResult.pages[artifactIndex] ?? previewResult.pages[0]
      const stem = activeItem ? activeItem.name : previewResult.fileName
      const suffix =
        previewResult.pages.length > 1
          ? sanitizeFileBase(chosen.label.toLowerCase())
          : undefined
      const fileName = buildOutputFileName(stem, options.targetFormat, suffix)
      downloadBlob(chosen.blob, fileName)
      return
    }
    downloadBlob(previewResult.primaryBlob, previewResult.fileName)
  }

  async function handleDownloadMultiArtifactsZip() {
    if (!previewResult?.pages || previewResult.pages.length === 0) return
    setIsExportingBatch(true)
    setConversionError(null)
    try {
      const sourceName = activeItem?.name ?? 'export'
      const entries = previewResult.pages.map((page) => ({
        fileName: buildOutputFileName(
          sourceName,
          options.targetFormat,
          sanitizeFileBase(page.label.toLowerCase())
        ),
        blob: page.blob,
      }))
      const zipStem = sanitizeFileBase(stripExtension(sourceName), 'pages')
      await downloadZipArchive(entries, `${zipStem}-${options.targetFormat}.zip`)
    } catch (err) {
      setConversionError(err instanceof Error ? err.message : 'Failed to create ZIP archive.')
    } finally {
      setIsExportingBatch(false)
    }
  }

  async function handleDownloadBatchQueueZip() {
    if (readyItems.length === 0) return
    setIsExportingBatch(true)
    setConversionError(null)
    setBatchWarning(null)

    try {
      const entries: Array<{ fileName: string; blob: Blob }> = []
      const failedItems: Array<{ name: string; reason: string }> = []

      for (let idx = 0; idx < readyItems.length; idx++) {
        const item = readyItems[idx]
        setBatchProgress({
          completed: idx,
          total: readyItems.length,
          currentFile: item.name,
        })

        try {
          const res = await runSingleItemConversion(item, options)
          try {
            if (res.pages && res.pages.length > 1) {
              for (const page of res.pages) {
                entries.push({
                  fileName: buildOutputFileName(
                    item.name,
                    options.targetFormat,
                    sanitizeFileBase(page.label.toLowerCase())
                  ),
                  blob: page.blob,
                })
              }
            } else {
              entries.push({
                fileName: res.fileName,
                blob: res.primaryBlob,
              })
            }
          } finally {
            disposeConversionResult(res)
          }
        } catch (err) {
          failedItems.push({
            name: item.name,
            reason: err instanceof Error ? err.message : 'Conversion failed',
          })
        }
      }

      if (entries.length === 0) {
        setConversionError('None of the queued files could be converted with the current settings.')
        return
      }

      setBatchProgress({
        completed: readyItems.length,
        total: readyItems.length,
        currentFile: 'Packaging ZIP archive...',
      })

      await downloadZipArchive(entries, `pixtools-${options.targetFormat}-batch.zip`)

      if (failedItems.length > 0) {
        const summary = failedItems.map((f) => `${f.name} (${f.reason})`).join('; ')
        setBatchWarning(
          `Downloaded ${entries.length} converted file${entries.length > 1 ? 's' : ''}, skipped ${failedItems.length} failed item${failedItems.length > 1 ? 's' : ''}: ${summary}`
        )
      }
    } catch (err) {
      setConversionError(err instanceof Error ? err.message : 'Batch export failed.')
    } finally {
      setBatchProgress(null)
      setIsExportingBatch(false)
    }
  }

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(340px,420px)_minmax(0,1fr)]">
      {/* Control column */}
      <div className="space-y-4 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 sm:p-5">
        <DropZone
          accept={ACCEPTED_MIME_AND_EXT}
          multiple
          compact={items.length > 0}
          onFilesSelected={handleFilesSelected}
          title={items.length > 0 ? 'Add more files' : 'Drop files or click to browse'}
          subtitle="PNG, JPG, WebP, GIF, SVG, or PDF"
        />

        {ingestWarning ? (
          <NoticeBanner
            tone="warning"
            message={ingestWarning}
            onDismiss={() => setIngestWarning(null)}
          />
        ) : null}

        <FileQueueList
          items={items}
          selectedId={activeItem?.id ?? null}
          allowReorder={options.targetFormat === 'pdf' || options.targetFormat === 'gif'}
          onSelect={setSelectedId}
          onMove={handleMoveItem}
          onRemove={handleRemoveItem}
          onClearAll={handleClearAll}
        />

        <FormatSelector value={options.targetFormat} onChange={handleFormatChange} />

        <div className="border-t border-[var(--border-hairline)] pt-3 lg:hidden">
          <button
            type="button"
            aria-expanded={mobileOptionsOpen}
            onClick={() => setMobileOptionsOpen((prev) => !prev)}
            className="flex w-full items-center justify-between rounded-md border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3 py-2 text-left text-xs font-medium text-[var(--ink-primary)]"
          >
            <span>
              {options.targetFormat === 'jpg' || options.targetFormat === 'webp'
                ? `Quality ${options.quality}%, ${options.resizeMode === 'original' ? 'original size' : options.resizeMode === 'scale' ? `${options.scalePercent}% scale` : 'custom size'}`
                : options.resizeMode === 'original'
                  ? 'Options: Original dimensions'
                  : options.resizeMode === 'scale'
                    ? `Options: ${options.scalePercent}% scale`
                    : 'Options: Custom dimensions'}
            </span>
            <span className="font-semibold text-[var(--accent-primary)]">
              {mobileOptionsOpen ? 'Hide options' : 'Adjust'}
            </span>
          </button>
        </div>

        <div className={mobileOptionsOpen ? 'block' : 'hidden lg:block'}>
          <ConversionSettings
            options={options}
            items={readyItems}
            activeItem={activeItem}
            onUpdate={handleUpdateOptions}
          />
        </div>
      </div>

      {/* Live Preview Stage */}
      <div className="lg:sticky lg:top-[73px]">
        <ConverterPreviewStage
          key={isCombinedMode ? 'combined' : (activeItem?.id ?? 'empty')}
          result={previewResult}
          targetFormat={options.targetFormat}
          queuedCount={readyItems.length}
          isCombinedMode={isCombinedMode}
          isConverting={isConverting}
          isExportingBatch={isExportingBatch}
          batchProgress={batchProgress}
          batchWarning={batchWarning}
          errorMessage={conversionError}
          onDismissBatchWarning={() => setBatchWarning(null)}
          onDownloadPrimary={handleDownloadPrimary}
          onDownloadMultiArtifactsZip={handleDownloadMultiArtifactsZip}
          onDownloadBatchQueueZip={handleDownloadBatchQueueZip}
        />
      </div>
    </div>
  )
}
