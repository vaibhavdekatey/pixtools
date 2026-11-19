import { useEffect, useRef, useState } from 'react'
import type { CompareViewMode } from '../../types/converter'
import { SegmentedControl, type SegmentedOption } from '../common/SegmentedControl'
import { CollapseIcon, ExpandIcon, SplitIcon, ZoomInIcon, ZoomOutIcon } from '../icons/Icons'

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

const ZOOM_STEPS = [1, 1.5, 2, 3, 4] as const

interface SplitCompareViewProps {
  convertedUrl: string
  originalUrl?: string
  altLabel: string
  isAnimated?: boolean
  isExpanded?: boolean
  onToggleExpand?: () => void
}

export function SplitCompareView({
  convertedUrl,
  originalUrl,
  altLabel,
  isAnimated = false,
  isExpanded = false,
  onToggleExpand,
}: SplitCompareViewProps) {
  const [viewMode, setViewMode] = useState<CompareViewMode>(
    originalUrl && !isAnimated ? 'split' : 'converted'
  )
  const [backdrop, setBackdrop] = useState<BackdropMode>('checker')
  const [splitPercent, setSplitPercent] = useState(50)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  const stageRef = useRef<HTMLDivElement | null>(null)
  const dragModeRef = useRef<'none' | 'split' | 'pan'>('none')
  const panOriginRef = useRef({ clientX: 0, clientY: 0, startX: 0, startY: 0 })

  const hasOriginal = Boolean(originalUrl)
  const canSplit = hasOriginal && !isAnimated
  const effectiveMode: CompareViewMode = !hasOriginal
    ? 'converted'
    : !canSplit && viewMode === 'split'
      ? 'converted'
      : viewMode

  // Reset pan when returning to Fit (1x)
  useEffect(() => {
    if (zoom <= 1) {
      setPan({ x: 0, y: 0 })
    }
  }, [zoom])

  function stepZoom(delta: -1 | 1) {
    setZoom((curr) => {
      const nearestIndex = ZOOM_STEPS.findIndex((step) => step >= curr - 0.01)
      const currentIndex = nearestIndex === -1 ? ZOOM_STEPS.length - 1 : nearestIndex
      const nextIndex = Math.max(0, Math.min(ZOOM_STEPS.length - 1, currentIndex + delta))
      return ZOOM_STEPS[nextIndex]
    })
  }

  function resetView() {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setSplitPercent(50)
  }

  function updateSplitFromClientX(clientX: number) {
    const el = stageRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.width <= 0) return
    const pct = ((clientX - rect.left) / rect.width) * 100
    setSplitPercent(Math.max(0, Math.min(100, Math.round(pct))))
  }

  function handleHandlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (effectiveMode !== 'split') return
    e.stopPropagation()
    dragModeRef.current = 'split'
    stageRef.current?.setPointerCapture(e.pointerId)
    updateSplitFromClientX(e.clientX)
  }

  function handleStagePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (zoom > 1) {
      dragModeRef.current = 'pan'
      panOriginRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        startX: pan.x,
        startY: pan.y,
      }
      e.currentTarget.setPointerCapture(e.pointerId)
      return
    }

    if (effectiveMode === 'split') {
      dragModeRef.current = 'split'
      e.currentTarget.setPointerCapture(e.pointerId)
      updateSplitFromClientX(e.clientX)
    }
  }

  function handleStagePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (dragModeRef.current === 'split') {
      updateSplitFromClientX(e.clientX)
    } else if (dragModeRef.current === 'pan') {
      const dx = e.clientX - panOriginRef.current.clientX
      const dy = e.clientY - panOriginRef.current.clientY
      setPan({
        x: panOriginRef.current.startX + dx,
        y: panOriginRef.current.startY + dy,
      })
    }
  }

  function handleStagePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (dragModeRef.current === 'none') return
    dragModeRef.current = 'none'
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    if (!e.ctrlKey && !e.metaKey && !isExpanded) return
    e.preventDefault()
    stepZoom(e.deltaY < 0 ? 1 : -1)
  }

  const backdropClass =
    backdrop === 'checker'
      ? 'optical-checkerboard'
      : backdrop === 'light'
        ? 'bg-white'
        : 'bg-[#0a0c10]'

  const imageTransformStyle: React.CSSProperties = {
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
    transformOrigin: 'center center',
  }

  const stageCursorClass =
    zoom > 1
      ? 'cursor-grab active:cursor-grabbing touch-none'
      : effectiveMode === 'split'
        ? 'cursor-ew-resize touch-none'
        : ''

  return (
    <div className={isExpanded ? 'flex min-h-0 flex-1 flex-col gap-3' : 'space-y-3'}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {canSplit ? (
          <SegmentedControl
            label="Preview comparison mode"
            value={effectiveMode}
            options={VIEW_MODES}
            onChange={setViewMode}
          />
        ) : (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-elevated)] px-3 py-1 text-xs font-medium text-[var(--ink-secondary)]">
            <SplitIcon width={14} height={14} />
            <span>{isAnimated ? 'Live animated output preview' : 'Converted output preview'}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {/* Zoom controls */}
          <div
            role="group"
            aria-label="Zoom preview"
            className="inline-flex items-center gap-0.5 rounded-full bg-[var(--bg-recessed)] p-1"
          >
            <button
              type="button"
              disabled={zoom <= 1}
              onClick={() => stepZoom(-1)}
              aria-label="Zoom out"
              className="rounded-full p-1.5 text-[var(--ink-primary)] hover:bg-[var(--bg-elevated)] disabled:opacity-30"
            >
              <ZoomOutIcon width={14} height={14} />
            </button>
            <button
              type="button"
              onClick={resetView}
              title="Reset zoom and position"
              className="font-mono-data min-w-[48px] rounded-full px-2 py-1 text-xs font-semibold text-[var(--ink-primary)] hover:bg-[var(--bg-elevated)]"
            >
              {zoom === 1 ? 'Fit' : `${Math.round(zoom * 100)}%`}
            </button>
            <button
              type="button"
              disabled={zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}
              onClick={() => stepZoom(1)}
              aria-label="Zoom in"
              className="rounded-full p-1.5 text-[var(--ink-primary)] hover:bg-[var(--bg-elevated)] disabled:opacity-30"
            >
              <ZoomInIcon width={14} height={14} />
            </button>
          </div>

          <SegmentedControl
            label="Preview background surface"
            value={backdrop}
            options={BACKDROP_MODES}
            onChange={setBackdrop}
          />

          {onToggleExpand ? (
            <button
              type="button"
              onClick={onToggleExpand}
              aria-label={isExpanded ? 'Exit expanded preview' : 'Expand preview'}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-primary)] hover:bg-[var(--bg-elevated-hover)]"
            >
              {isExpanded ? <CollapseIcon width={14} height={14} /> : <ExpandIcon width={14} height={14} />}
              <span>{isExpanded ? 'Close' : 'Expand'}</span>
            </button>
          ) : null}
        </div>
      </div>

      <div
        ref={stageRef}
        onPointerDown={handleStagePointerDown}
        onPointerMove={handleStagePointerMove}
        onPointerUp={handleStagePointerUp}
        onPointerCancel={handleStagePointerUp}
        onWheel={handleWheel}
        className={[
          'relative flex w-full select-none items-center justify-center overflow-hidden rounded-xl',
          isExpanded ? 'min-h-[320px] flex-1' : 'h-[340px] sm:h-[460px]',
          backdropClass,
          stageCursorClass,
        ].join(' ')}
      >
        {effectiveMode === 'original' && originalUrl ? (
          <div className="pointer-events-none flex h-full w-full items-center justify-center p-3">
            <img
              src={originalUrl}
              alt={`Original ${altLabel}`}
              draggable={false}
              style={imageTransformStyle}
              className="h-full w-full object-contain will-change-transform"
            />
          </div>
        ) : null}

        {effectiveMode === 'converted' ? (
          <div className="pointer-events-none flex h-full w-full items-center justify-center p-3">
            <img
              src={convertedUrl}
              alt={`Converted ${altLabel}`}
              draggable={false}
              style={imageTransformStyle}
              className="h-full w-full object-contain will-change-transform"
            />
          </div>
        ) : null}

        {effectiveMode === 'split' && originalUrl ? (
          <>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-3">
              <img
                src={originalUrl}
                alt={`Original ${altLabel}`}
                draggable={false}
                style={imageTransformStyle}
                className="h-full w-full object-contain will-change-transform"
              />
            </div>

            <div
              style={{ clipPath: `inset(0 0 0 ${splitPercent}%)` }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center p-3"
            >
              <img
                src={convertedUrl}
                alt={`Converted ${altLabel}`}
                draggable={false}
                style={imageTransformStyle}
                className="h-full w-full object-contain will-change-transform"
              />
            </div>

            {/* Wide hit-area divider handle so user can drag split cleanly even while zoomed/panning */}
            <div
              role="slider"
              aria-label="Comparison split position"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={splitPercent}
              tabIndex={0}
              onPointerDown={handleHandlePointerDown}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft') setSplitPercent((p) => Math.max(0, p - 2))
                if (e.key === 'ArrowRight') setSplitPercent((p) => Math.min(100, p + 2))
              }}
              style={{ left: `${splitPercent}%` }}
              className="absolute inset-y-0 z-10 w-6 -translate-x-1/2 cursor-ew-resize touch-none"
            >
              <div className="mx-auto h-full w-0.5 bg-[var(--accent-primary)] shadow-[0_0_0_1px_rgba(0,0,0,0.45)]" />
              <div className="absolute top-1/2 left-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--accent-primary)] text-[11px] font-bold text-[var(--accent-primary-ink)] shadow-lg">
                ↔
              </div>
            </div>

            <span className="pointer-events-none absolute top-2.5 left-2.5 rounded-full bg-black/75 px-2.5 py-0.5 text-[11px] font-medium text-white">
              Original
            </span>
            <span className="pointer-events-none absolute top-2.5 right-2.5 rounded-full bg-[var(--accent-primary)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--accent-primary-ink)]">
              Converted
            </span>
          </>
        ) : null}

        {zoom > 1 ? (
          <span className="pointer-events-none absolute bottom-2.5 left-2.5 rounded-full bg-black/75 px-2.5 py-0.5 text-[11px] text-[var(--ink-secondary)]">
            Drag image to pan, drag handle to split
          </span>
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
