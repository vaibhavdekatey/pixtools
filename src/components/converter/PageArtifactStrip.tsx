import type { RenderedPageArtifact } from '../../types/converter'
import { formatBytes } from '../../utils/format'
import { ChevronLeftIcon, ChevronRightIcon } from '../icons/Icons'

interface PageArtifactStripProps {
  artifacts: RenderedPageArtifact[]
  activeIndex: number
  onSelect: (index: number) => void
  unitLabel: string
}

export function PageArtifactStrip({
  artifacts,
  activeIndex,
  onSelect,
  unitLabel,
}: PageArtifactStripProps) {
  if (artifacts.length <= 1) return null

  const active = artifacts[activeIndex] ?? artifacts[0]

  return (
    <div className="space-y-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-0.5">
          <button
            type="button"
            disabled={activeIndex === 0}
            onClick={() => onSelect(Math.max(0, activeIndex - 1))}
            aria-label={`Previous ${unitLabel}`}
            className="rounded p-1 text-[var(--ink-secondary)] hover:bg-[var(--bg-recessed)] hover:text-[var(--ink-primary)] disabled:opacity-35"
          >
            <ChevronLeftIcon width={14} height={14} />
          </button>
          <span className="tabular-nums px-2 text-xs font-medium text-[var(--ink-primary)]">
            {active.label} of {artifacts.length}
          </span>
          <button
            type="button"
            disabled={activeIndex === artifacts.length - 1}
            onClick={() => onSelect(Math.min(artifacts.length - 1, activeIndex + 1))}
            aria-label={`Next ${unitLabel}`}
            className="rounded p-1 text-[var(--ink-secondary)] hover:bg-[var(--bg-recessed)] hover:text-[var(--ink-primary)] disabled:opacity-35"
          >
            <ChevronRightIcon width={14} height={14} />
          </button>
        </div>

        <div className="font-mono-data flex items-center gap-3 text-xs text-[var(--ink-secondary)]">
          <span>{active.width}×{active.height} px</span>
          <span>{formatBytes(active.blob.size)}</span>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {artifacts.map((item, idx) => {
          const isSelected = idx === activeIndex
          return (
            <button
              key={item.index}
              type="button"
              onClick={() => onSelect(idx)}
              className={[
                'flex shrink-0 flex-col items-center gap-1 rounded-md border p-1 transition-colors',
                isSelected
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-primary-soft)]'
                  : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)]',
              ].join(' ')}
            >
              <img
                src={item.url}
                alt={item.label}
                className="optical-checkerboard h-11 w-11 rounded-xs object-contain"
              />
              <span className="tabular-nums text-[10px] font-medium text-[var(--ink-primary)]">
                {idx + 1}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
