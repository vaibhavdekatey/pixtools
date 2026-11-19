import type { QueuedFileItem } from '../../types/converter'
import { formatBytes, formatInputLabel } from '../../utils/format'
import { ArrowDownIcon, ArrowUpIcon, FilePdfIcon, TrashIcon } from '../icons/Icons'

interface FileQueueListProps {
  items: QueuedFileItem[]
  selectedId: string | null
  allowReorder: boolean
  onSelect: (id: string) => void
  onMove: (id: string, direction: -1 | 1) => void
  onRemove: (id: string) => void
  onClearAll: () => void
}

function buildItemMeta(item: QueuedFileItem): string {
  const parts: string[] = [formatBytes(item.size)]
  if (item.width && item.height) {
    parts.push(`${item.width}×${item.height}`)
  }
  if (item.pageCount && item.pageCount > 1) {
    parts.push(`${item.pageCount} pages`)
  } else if (item.pageCount === 1) {
    parts.push('1 page')
  }
  if (item.frameCount && item.frameCount > 1) {
    parts.push(`${item.frameCount} frames`)
  }
  return parts.join(', ')
}

export function FileQueueList({
  items,
  selectedId,
  allowReorder,
  onSelect,
  onMove,
  onRemove,
  onClearAll,
}: FileQueueListProps) {
  if (items.length === 0) return null

  return (
    <section aria-labelledby="queue-heading" className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h2 id="queue-heading" className="text-sm font-semibold text-[var(--ink-primary)]">
          Input files ({items.length})
        </h2>
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-medium text-[var(--ink-secondary)] hover:text-[var(--danger)]"
        >
          Clear all
        </button>
      </div>

      <ul className="max-h-[240px] space-y-1.5 overflow-y-auto pr-0.5">
        {items.map((item, idx) => {
          const isSelected = item.id === selectedId
          return (
            <li
              key={item.id}
              className={[
                'flex items-center gap-2.5 rounded-lg border p-2 transition-colors',
                isSelected
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-primary-soft)]/50'
                  : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)]',
              ].join(' ')}
            >
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded border border-[var(--border-hairline)] bg-[var(--bg-elevated)]">
                  {item.sourceFormat === 'pdf' ? (
                    <FilePdfIcon width={18} height={18} className="text-[var(--danger)]" />
                  ) : (
                    <img
                      src={item.previewUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-xs font-semibold text-[var(--ink-primary)]">
                      {item.name}
                    </span>
                    <span className="shrink-0 rounded bg-[var(--bg-recessed)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--ink-secondary)]">
                      {formatInputLabel(item.sourceFormat)}
                    </span>
                  </div>
                  <p className="tabular-nums mt-0.5 truncate text-[11px] text-[var(--ink-secondary)]">
                    {item.status === 'error'
                      ? item.errorMessage ?? 'Unreadable file'
                      : buildItemMeta(item)}
                  </p>
                </div>
              </button>

              <div className="flex shrink-0 items-center gap-1">
                {allowReorder && items.length > 1 ? (
                  <>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => onMove(item.id, -1)}
                      aria-label={`Move ${item.name} up`}
                      className="rounded p-1 text-[var(--ink-secondary)] hover:bg-[var(--bg-recessed)] hover:text-[var(--ink-primary)] disabled:opacity-30"
                    >
                      <ArrowUpIcon width={14} height={14} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === items.length - 1}
                      onClick={() => onMove(item.id, 1)}
                      aria-label={`Move ${item.name} down`}
                      className="rounded p-1 text-[var(--ink-secondary)] hover:bg-[var(--bg-recessed)] hover:text-[var(--ink-primary)] disabled:opacity-30"
                    >
                      <ArrowDownIcon width={14} height={14} />
                    </button>
                  </>
                ) : null}

                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  aria-label={`Remove ${item.name}`}
                  className="rounded p-1 text-[var(--ink-secondary)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"
                >
                  <TrashIcon width={14} height={14} />
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
