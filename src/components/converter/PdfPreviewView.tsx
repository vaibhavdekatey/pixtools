import { useState } from 'react'
import type { PdfSheetPreviewItem } from '../../types/converter'
import { ChevronLeftIcon, ChevronRightIcon } from '../icons/Icons'

interface PdfPreviewViewProps {
  sheets: PdfSheetPreviewItem[]
}

export function PdfPreviewView({ sheets }: PdfPreviewViewProps) {
  const [pageIndex, setPageIndex] = useState(0)
  const [showMarginGuide, setShowMarginGuide] = useState(true)

  const clampedIndex = Math.min(pageIndex, Math.max(0, sheets.length - 1))
  const current = sheets[clampedIndex]
  if (!current) return null

  const marginPercentX = (current.marginPt / current.sheetWidthPt) * 100
  const marginPercentY = (current.marginPt / current.sheetHeightPt) * 100

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {sheets.length > 1 ? (
            <div className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-0.5">
              <button
                type="button"
                disabled={clampedIndex === 0}
                onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
                aria-label="Previous PDF page"
                className="rounded p-1 text-[var(--ink-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--ink-primary)] disabled:opacity-35"
              >
                <ChevronLeftIcon width={15} height={15} />
              </button>
              <span className="tabular-nums px-2 text-xs font-medium text-[var(--ink-primary)]">
                Page {clampedIndex + 1} of {sheets.length}
              </span>
              <button
                type="button"
                disabled={clampedIndex === sheets.length - 1}
                onClick={() => setPageIndex((i) => Math.min(sheets.length - 1, i + 1))}
                aria-label="Next PDF page"
                className="rounded p-1 text-[var(--ink-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--ink-primary)] disabled:opacity-35"
              >
                <ChevronRightIcon width={15} height={15} />
              </button>
            </div>
          ) : (
            <span className="text-xs font-medium text-[var(--ink-secondary)]">
              PDF sheet preview (1 page)
            </span>
          )}
        </div>

        <label className="flex items-center gap-1.5 text-xs text-[var(--ink-secondary)]">
          <input
            type="checkbox"
            checked={showMarginGuide}
            onChange={(e) => setShowMarginGuide(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-[var(--border-strong)] accent-[var(--accent-primary)]"
          />
          <span>Margin guides</span>
        </label>
      </div>

      <div className="optical-well-grid flex min-h-[290px] items-center justify-center rounded-md border border-[var(--border-hairline)] p-5 sm:min-h-[380px] sm:p-8">
        <div
          style={{
            aspectRatio: `${current.sheetWidthPt} / ${current.sheetHeightPt}`,
          }}
          className="pdf-sheet-shadow relative flex max-h-[340px] w-auto max-w-full items-center justify-center overflow-hidden border border-[#d6dee8] bg-white"
        >
          <div
            style={{
              padding: `${marginPercentY}% ${marginPercentX}%`,
            }}
            className="relative flex h-full w-full items-center justify-center"
          >
            {showMarginGuide && current.marginPt > 0 ? (
              <div
                aria-hidden="true"
                style={{
                  inset: `${marginPercentY}% ${marginPercentX}%`,
                }}
                className="pointer-events-none absolute border border-dashed border-[#93b4e6]"
              />
            ) : null}
            <img
              src={current.imageUrl}
              alt={`PDF page ${current.pageNumber}: ${current.sourceName}`}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--ink-secondary)]">
        <span className="truncate">Source: {current.sourceName}</span>
        <span className="font-mono-data">
          {Math.round(current.sheetWidthPt)} × {Math.round(current.sheetHeightPt)} pt
        </span>
      </div>

      {sheets.length > 1 ? (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {sheets.map((sheet, idx) => {
            const isSelected = idx === clampedIndex
            return (
              <button
                key={`${sheet.pageNumber}-${sheet.sourceName}`}
                type="button"
                onClick={() => setPageIndex(idx)}
                className={[
                  'flex shrink-0 items-center gap-2 rounded-md border px-2 py-1 text-xs transition-colors',
                  isSelected
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary-soft)] font-semibold text-[var(--ink-primary)]'
                    : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]',
                ].join(' ')}
              >
                <img
                  src={sheet.imageUrl}
                  alt=""
                  className="h-6 w-6 rounded-xs border border-[var(--border-hairline)] bg-white object-contain"
                />
                <span className="tabular-nums">P{sheet.pageNumber}</span>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
