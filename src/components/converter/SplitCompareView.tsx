import { useRef, useState } from 'react'
import type { CompareViewMode } from '../../types/converter'
import { SegmentedControl, type SegmentedOption } from '../common/SegmentedControl'
import { SplitIcon } from '../icons/Icons'

type BackdropMode = 'checker' | 'light' | 'dark'

const VIEW_MODES: readonly SegmentedOption<CompareViewMode>[] = [
  { value: 'split', label: 'Split' },
  { value: 'converted', label: 'Output' },
  { value: 'original', label: 'Original' },
]

const BACKDROP_MODES: readonly SegmentedOption<BackdropMode>[] = [
  { value: 'checker', label: 'Grid' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

interface SplitCompareViewProps {
  convertedUrl: string
  originalUrl?: string
  altLabel: string
  isAnimated?: boolean
}

export function SplitCompareView({
  convertedUrl,
  originalUrl,
  altLabel,
  isAnimated = false,
}: SplitCompareViewProps) {
  const [viewMode, setViewMode] = useState<CompareViewMode>(
    originalUrl && !isAnimated ? 'split' : 'converted'
  )
  const [backdrop, setBackdrop] = useState<BackdropMode>('checker')
  const [splitPercent, setSplitPercent] = useState(50)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const isDraggingRef = useRef(false)

  const hasOriginal = Boolean(originalUrl)
  const canSplit = hasOriginal && !isAnimated
  const effectiveMode: CompareViewMode = !hasOriginal
    ? 'converted'
    : !canSplit && viewMode === 'split'
      ? 'converted'
      : viewMode

  function updateSplitFromClientX(clientX: number) {
    const el = stageRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.width <= 0) return
    const pct = ((clientX - rect.left) / rect.width) * 100
    setSplitPercent(Math.max(0, Math.min(100, Math.round(pct))))
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (effectiveMode !== 'split') return
    isDraggingRef.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    updateSplitFromClientX(e.clientX)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDraggingRef.current || effectiveMode !== 'split') return
    updateSplitFromClientX(e.clientX)
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  const backdropClass =
    backdrop === 'checker'
      ? 'optical-checkerboard'
      : backdrop === 'light'
        ? 'bg-white'
        : 'bg-[#1a2430]'

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {canSplit ? (
          <SegmentedControl
            label="Preview comparison mode"
            value={effectiveMode}
            options={VIEW_MODES}
            onChange={setViewMode}
          />
        ) : (
          <div className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--ink-secondary)]">
            <SplitIcon width={14} height={14} />
            <span>{isAnimated ? 'Live animated output preview' : 'Converted output preview'}</span>
          </div>
        )}

        <SegmentedControl
          label="Preview background surface"
          value={backdrop}
          options={BACKDROP_MODES}
          onChange={setBackdrop}
        />
      </div>

      <div
        ref={stageRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={[
          'relative flex h-[280px] w-full select-none items-center justify-center overflow-hidden rounded-md border border-[var(--border-hairline)] sm:h-[380px]',
          backdropClass,
          effectiveMode === 'split' ? 'cursor-ew-resize touch-none' : '',
        ].join(' ')}
      >
        {effectiveMode === 'original' && originalUrl ? (
          <img
            src={originalUrl}
            alt={`Original ${altLabel}`}
            draggable={false}
            className="max-h-full max-w-full object-contain p-3"
          />
        ) : null}

        {effectiveMode === 'converted' ? (
          <img
            src={convertedUrl}
            alt={`Converted ${altLabel}`}
            draggable={false}
            className="max-h-full max-w-full object-contain p-3"
          />
        ) : null}

        {effectiveMode === 'split' && originalUrl ? (
          <>
            <img
              src={originalUrl}
              alt={`Original ${altLabel}`}
              draggable={false}
              className="pointer-events-none absolute inset-0 h-full w-full object-contain p-3"
            />
            <img
              src={convertedUrl}
              alt={`Converted ${altLabel}`}
              draggable={false}
              style={{ clipPath: `inset(0 0 0 ${splitPercent}%)` }}
              className="pointer-events-none absolute inset-0 h-full w-full object-contain p-3"
            />

            <div
              aria-hidden="true"
              style={{ left: `${splitPercent}%` }}
              className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-[var(--accent-primary)] shadow-[0_0_0_1px_rgba(255,255,255,0.85)]"
            >
              <div className="absolute top-1/2 left-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-[var(--accent-primary)] text-[11px] font-bold text-white shadow">
                ↔
              </div>
            </div>

            <span className="pointer-events-none absolute top-2.5 left-2.5 rounded border border-white/15 bg-[#10161d]/90 px-2 py-0.5 text-[11px] font-medium text-[#edf2f7]">
              Original
            </span>
            <span className="pointer-events-none absolute top-2.5 right-2.5 rounded bg-[var(--accent-primary)]/95 px-2 py-0.5 text-[11px] font-medium text-white">
              Converted
            </span>
          </>
        ) : null}
      </div>

      {effectiveMode === 'split' ? (
        <div className="flex items-center gap-3 px-1">
          <span className="text-xs font-medium text-[var(--ink-secondary)]">Split</span>
          <input
            type="range"
            aria-label="Before and after split position"
            min={0}
            max={100}
            value={splitPercent}
            onChange={(e) => setSplitPercent(Number(e.target.value))}
            className="studio-range flex-1"
          />
          <span className="font-mono-data w-9 text-right text-xs text-[var(--ink-secondary)]">
            {splitPercent}%
          </span>
        </div>
      ) : null}
    </div>
  )
}
