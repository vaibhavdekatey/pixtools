import type { QrExportFormat, QrGeneratedOutput, QrSettings } from '../../types/qr'
import { formatBytes } from '../../utils/format'
import { NoticeBanner } from '../common/NoticeBanner'
import { CheckIcon, CopyIcon, DownloadIcon, QrIcon } from '../icons/Icons'

interface QrPreviewStageProps {
  output: QrGeneratedOutput | null
  settings: QrSettings
  errorMessage: string | null
  busyFormat: QrExportFormat | null
  copiedFeedback: 'svg' | 'png' | null
  onDownload: (format: QrExportFormat) => void
  onCopySvg: () => void
  onCopyPng: () => void
}

export function QrPreviewStage({
  output,
  settings,
  errorMessage,
  busyFormat,
  copiedFeedback,
  onDownload,
  onCopySvg,
  onCopyPng,
}: QrPreviewStageProps) {
  const contrastLabel = output ? `${output.contrastRatio.toFixed(1)}:1` : '—'

  return (
    <section
      aria-labelledby="qr-preview-heading"
      className="flex flex-col overflow-hidden rounded-xl bg-[var(--bg-surface)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5 pb-3">
        <div>
          <h2 id="qr-preview-heading" className="text-base font-semibold tracking-tight text-[var(--ink-primary)]">
            QR preview
          </h2>
          <p className="text-xs text-[var(--ink-secondary)]">
            Vector SVG rendering with quiet-zone calibration
          </p>
        </div>

        {output ? (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={[
                'rounded-full px-3 py-1 font-semibold tabular-nums',
                output.isLowContrast || output.isInverted
                  ? 'bg-[var(--warning-soft)] text-[var(--warning)]'
                  : 'bg-[var(--accent-signal-soft)] text-[var(--accent-primary)]',
              ].join(' ')}
            >
              Contrast {contrastLabel}
            </span>
            <span className="font-mono-data rounded-full bg-[var(--bg-elevated)] px-3 py-1 text-[var(--ink-secondary)]">
              {output.moduleCount}×{output.moduleCount} modules
            </span>
          </div>
        ) : null}
      </div>

      <div className="px-5">
        <div className="optical-well-grid relative flex min-h-[290px] items-center justify-center rounded-xl p-6 sm:min-h-[380px] sm:p-10">
          {output ? (
            <div className="relative rounded-xl bg-[var(--bg-surface)] p-3.5 shadow-xl">
              <div
                className={[
                  'relative flex h-[220px] w-[220px] items-center justify-center overflow-hidden rounded-lg sm:h-[272px] sm:w-[272px]',
                  settings.transparentBackground ? 'optical-checkerboard' : '',
                ].join(' ')}
              >
                <div
                  className="h-full w-full [&>svg]:h-full [&>svg]:w-full"
                  dangerouslySetInnerHTML={{ __html: output.svgMarkup }}
                />
              </div>
            </div>
          ) : (
            <div className="flex max-w-xs flex-col items-center text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-[var(--bg-elevated)] text-[var(--ink-secondary)]">
                <QrIcon width={22} height={22} />
              </div>
              <p className="mt-3 text-sm font-semibold text-[var(--ink-primary)]">
                Enter content to preview QR code
              </p>
              <p className="mt-1 text-xs text-[var(--ink-secondary)]">
                Type a URL, Wi-Fi network, vCard, event, email, or phone number on the left to inspect and export.
              </p>
            </div>
          )}
        </div>
      </div>

      {errorMessage ? (
        <div className="px-5 pt-3">
          <NoticeBanner tone="error" message={errorMessage} />
        </div>
      ) : null}

      {output && (output.isLowContrast || output.isInverted) ? (
        <div className="px-5 pt-3">
          <NoticeBanner
            tone="warning"
            message={
              output.isInverted
                ? 'Foreground modules are lighter than the background. Some older camera scanners fail on inverted QR codes.'
                : `Contrast ratio is ${contrastLabel}. Use at least 3.0:1 between modules and background for reliable scanning.`
            }
          />
        </div>
      ) : null}

      <div className="space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--ink-secondary)]">
          <span className="tabular-nums">
            Raster export: {settings.size} × {settings.size} px
          </span>
          <span className="tabular-nums">
            {output ? `SVG size: ${formatBytes(output.svgByteSize)}` : 'Ready to encode'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            disabled={!output || busyFormat !== null}
            onClick={() => onDownload('svg')}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--accent-primary)] px-3 py-2.5 text-sm font-bold text-[var(--accent-primary-ink)] hover:bg-[var(--accent-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <DownloadIcon width={16} height={16} />
            <span>{busyFormat === 'svg' ? 'Saving' : 'SVG'}</span>
          </button>

          <button
            type="button"
            disabled={!output || busyFormat !== null}
            onClick={() => onDownload('png')}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--accent-primary)] px-3 py-2.5 text-sm font-bold text-[var(--accent-primary-ink)] hover:bg-[var(--accent-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <DownloadIcon width={16} height={16} />
            <span>{busyFormat === 'png' ? 'Saving' : 'PNG'}</span>
          </button>

          <button
            type="button"
            disabled={!output || busyFormat !== null}
            onClick={() => onDownload('jpg')}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--accent-primary)] px-3 py-2.5 text-sm font-bold text-[var(--accent-primary-ink)] hover:bg-[var(--accent-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <DownloadIcon width={16} height={16} />
            <span>{busyFormat === 'jpg' ? 'Saving' : 'JPG'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={!output}
            onClick={onCopySvg}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--bg-elevated)] px-3 py-2 text-xs font-semibold text-[var(--ink-secondary)] hover:bg-[var(--bg-elevated-hover)] hover:text-[var(--ink-primary)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copiedFeedback === 'svg' ? <CheckIcon width={14} height={14} /> : <CopyIcon width={14} height={14} />}
            <span>{copiedFeedback === 'svg' ? 'Copied SVG' : 'Copy SVG code'}</span>
          </button>

          <button
            type="button"
            disabled={!output}
            onClick={onCopyPng}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--bg-elevated)] px-3 py-2 text-xs font-semibold text-[var(--ink-secondary)] hover:bg-[var(--bg-elevated-hover)] hover:text-[var(--ink-primary)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copiedFeedback === 'png' ? <CheckIcon width={14} height={14} /> : <CopyIcon width={14} height={14} />}
            <span>{copiedFeedback === 'png' ? 'Copied PNG' : 'Copy PNG image'}</span>
          </button>
        </div>
      </div>
    </section>
  )
}
