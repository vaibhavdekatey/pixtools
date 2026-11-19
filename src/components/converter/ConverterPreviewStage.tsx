import { useState } from 'react'
import type { ConversionPreviewResult, OutputFormat } from '../../types/converter'
import {
  buildOutputFileName,
  formatByteDelta,
  formatBytes,
  formatOutputLabel,
  sanitizeFileBase,
} from '../../utils/format'
import { NoticeBanner } from '../common/NoticeBanner'
import { ArchiveIcon, DownloadIcon, LayersIcon } from '../icons/Icons'
import { PageArtifactStrip } from './PageArtifactStrip'
import { PdfPreviewView } from './PdfPreviewView'
import { SplitCompareView } from './SplitCompareView'

export interface BatchExportProgress {
  completed: number
  total: number
  currentFile: string
}

interface ConverterPreviewStageProps {
  result: ConversionPreviewResult | null
  targetFormat: OutputFormat
  queuedCount: number
  isCombinedMode: boolean
  isConverting: boolean
  isExportingBatch: boolean
  batchProgress: BatchExportProgress | null
  batchWarning: string | null
  errorMessage: string | null
  onDismissBatchWarning: () => void
  onDownloadPrimary: (artifactIndex: number) => void
  onDownloadMultiArtifactsZip: () => void
  onDownloadBatchQueueZip: () => void
}

export function ConverterPreviewStage({
  result,
  targetFormat,
  queuedCount,
  isCombinedMode,
  isConverting,
  isExportingBatch,
  batchProgress,
  batchWarning,
  errorMessage,
  onDismissBatchWarning,
  onDownloadPrimary,
  onDownloadMultiArtifactsZip,
  onDownloadBatchQueueZip,
}: ConverterPreviewStageProps) {
  const [artifactIndex, setArtifactIndex] = useState(0)

  const artifacts = result?.pages
  const safeArtifactIndex = artifacts
    ? Math.min(artifactIndex, Math.max(0, artifacts.length - 1))
    : 0
  const activeArtifact = artifacts ? artifacts[safeArtifactIndex] : null

  const delta = result
    ? formatByteDelta(result.originalSize, result.convertedSize)
    : null

  const outputLabel = formatOutputLabel(targetFormat)
  const hasMultipleArtifacts = Boolean(artifacts && artifacts.length > 1)
  const showQueueBatchZip = queuedCount > 1 && !isCombinedMode

  const displayFileName =
    result && activeArtifact && hasMultipleArtifacts
      ? buildOutputFileName(
          result.fileName.replace(/-(?:page|frame)-\d+(?=\.[^.]+$)/i, ''),
          targetFormat,
          sanitizeFileBase(activeArtifact.label.toLowerCase())
        )
      : result?.fileName ?? null

  return (
    <section
      aria-labelledby="converter-preview-heading"
      className="flex flex-col overflow-hidden rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-hairline)] px-4 py-3">
        <div>
          <h2 id="converter-preview-heading" className="text-sm font-semibold text-[var(--ink-primary)]">
            Conversion preview
          </h2>
          <p className="text-xs text-[var(--ink-secondary)]">
            {displayFileName ?? 'Drop a file to preview the converted result before downloading'}
          </p>
        </div>

        {isConverting ? (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--accent-primary)]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent-primary)]" />
            <span>Rendering preview</span>
          </span>
        ) : result && delta ? (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="tabular-nums rounded-md border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-2 py-0.5 text-[var(--ink-secondary)]">
              {formatBytes(result.originalSize)} → {formatBytes(result.convertedSize)}
            </span>
            <span
              className={[
                'tabular-nums rounded-md border px-2 py-0.5 font-semibold',
                delta.isReduction
                  ? 'border-[var(--accent-signal-border)] bg-[var(--accent-signal-soft)] text-[var(--accent-signal)]'
                  : 'border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-[var(--ink-secondary)]',
              ].join(' ')}
            >
              {delta.label}
            </span>
          </div>
        ) : null}
      </div>

      <div className="p-4">
        {errorMessage ? (
          <div className="mb-3">
            <NoticeBanner tone="error" message={errorMessage} />
          </div>
        ) : null}

        {batchWarning ? (
          <div className="mb-3">
            <NoticeBanner
              tone="warning"
              message={batchWarning}
              onDismiss={onDismissBatchWarning}
            />
          </div>
        ) : null}

        {batchProgress ? (
          <div className="mb-3 space-y-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-3">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-medium text-[var(--ink-primary)]">
                Converting {batchProgress.completed + 1} of {batchProgress.total}: {batchProgress.currentFile}
              </span>
              <span className="font-mono-data shrink-0 text-[var(--ink-secondary)]">
                {Math.round((batchProgress.completed / Math.max(1, batchProgress.total)) * 100)}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-recessed)]">
              <div
                style={{
                  width: `${Math.round((batchProgress.completed / Math.max(1, batchProgress.total)) * 100)}%`,
                }}
                className="h-full bg-[var(--accent-primary)] transition-[width] duration-150"
              />
            </div>
          </div>
        ) : null}

        {!result ? (
          <div className="optical-well-grid flex min-h-[290px] flex-col items-center justify-center rounded-md border border-[var(--border-hairline)] p-6 text-center sm:min-h-[380px]">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--ink-muted)]">
              <LayersIcon width={22} height={22} />
            </div>
            <p className="mt-3 text-sm font-medium text-[var(--ink-primary)]">
              No file selected for preview
            </p>
            <p className="mt-1 max-w-sm text-xs text-[var(--ink-secondary)]">
              Upload PNG, JPG, WebP, GIF, SVG, or PDF files to compare the converted output, dimensions, and file size.
            </p>
          </div>
        ) : null}

        {result && result.kind === 'pdf-output' && result.pdfSheets ? (
          <PdfPreviewView sheets={result.pdfSheets} />
        ) : null}

        {result && (result.kind === 'image' || result.kind === 'animated-gif') ? (
          <SplitCompareView
            convertedUrl={result.primaryUrl}
            originalUrl={result.originalCompareUrl}
            altLabel={result.fileName}
            isAnimated={result.kind === 'animated-gif'}
          />
        ) : null}

        {result && (result.kind === 'pdf-pages' || result.kind === 'gif-frames') && activeArtifact ? (
          <div className="space-y-3">
            <PageArtifactStrip
              artifacts={artifacts ?? []}
              activeIndex={safeArtifactIndex}
              onSelect={setArtifactIndex}
              unitLabel={result.kind === 'pdf-pages' ? 'page' : 'frame'}
            />
            <SplitCompareView
              convertedUrl={activeArtifact.url}
              originalUrl={activeArtifact.originalPreviewUrl}
              altLabel={`${result.fileName} ${activeArtifact.label}`}
            />
          </div>
        ) : null}

        {result?.note ? (
          <p className="mt-3 text-xs text-[var(--ink-secondary)]">{result.note}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-3.5">
        <div className="font-mono-data text-xs text-[var(--ink-secondary)]">
          {result
            ? activeArtifact
              ? `${activeArtifact.width} × ${activeArtifact.height} px`
              : result.kind === 'pdf-output'
                ? `${result.pdfSheets?.length ?? 1} page${(result.pdfSheets?.length ?? 1) > 1 ? 's' : ''}, ${result.width} × ${result.height} pt`
                : `${result.width} × ${result.height} px`
            : 'PNG, JPG, WebP, GIF, PDF'}
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <button
            type="button"
            disabled={!result || isConverting || isExportingBatch}
            onClick={() => onDownloadPrimary(safeArtifactIndex)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[var(--accent-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-initial"
          >
            <DownloadIcon width={16} height={16} />
            <span>
              {activeArtifact && hasMultipleArtifacts
                ? `Download ${activeArtifact.label} (${outputLabel})`
                : `Download ${outputLabel}`}
            </span>
          </button>

          {hasMultipleArtifacts ? (
            <button
              type="button"
              disabled={!result || isConverting || isExportingBatch}
              onClick={onDownloadMultiArtifactsZip}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-sm font-semibold text-[var(--ink-primary)] transition-colors hover:bg-[var(--bg-elevated)] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-initial"
            >
              <ArchiveIcon width={16} height={16} />
              <span>
                {result?.kind === 'pdf-pages'
                  ? `All ${artifacts?.length} pages (ZIP)`
                  : `All ${artifacts?.length} frames (ZIP)`}
              </span>
            </button>
          ) : null}

          {showQueueBatchZip ? (
            <button
              type="button"
              disabled={!result || isConverting || isExportingBatch}
              onClick={onDownloadBatchQueueZip}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-sm font-semibold text-[var(--ink-primary)] transition-colors hover:bg-[var(--bg-elevated)] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-initial"
            >
              <ArchiveIcon width={16} height={16} />
              <span>
                {isExportingBatch
                  ? 'Exporting ZIP...'
                  : `Convert all ${queuedCount} (ZIP)`}
              </span>
            </button>
          ) : null}
        </div>
      </div>
    </section>
  )
}
