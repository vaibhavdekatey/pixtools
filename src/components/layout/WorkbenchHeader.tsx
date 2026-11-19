import { LayersIcon, QrIcon } from '../icons/Icons'

export type ActiveToolTab = 'converter' | 'qr'

interface WorkbenchHeaderProps {
  activeTool: ActiveToolTab
  onSelectTool: (tool: ActiveToolTab) => void
}

export function WorkbenchHeader({ activeTool, onSelectTool }: WorkbenchHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1380px] flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border-strong)] bg-[var(--bg-elevated)] text-[var(--ink-primary)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="3" width="8" height="8" rx="1.5" fill="currentColor" />
              <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" />
              <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" />
              <path d="M13 13h4v4h-4zM17 17h4v4h-4z" fill="var(--accent-signal)" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-[var(--ink-primary)] leading-tight">
              PixTools
            </h1>
            <p className="text-xs text-[var(--ink-secondary)] leading-tight">
              Browser-local media &amp; QR workbench
            </p>
          </div>
        </div>

        <nav
          aria-label="Utility tools"
          className="flex w-full items-center gap-1 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-recessed)] p-1 sm:w-auto"
        >
          <button
            type="button"
            aria-current={activeTool === 'converter' ? 'page' : undefined}
            onClick={() => onSelectTool('converter')}
            className={[
              'flex flex-1 items-center justify-center gap-2 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors sm:flex-initial',
              activeTool === 'converter'
                ? 'bg-[var(--bg-surface)] text-[var(--ink-primary)] shadow-xs ring-1 ring-[var(--border-hairline)]'
                : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]',
            ].join(' ')}
          >
            <LayersIcon width={16} height={16} />
            <span>File Converter</span>
          </button>

          <button
            type="button"
            aria-current={activeTool === 'qr' ? 'page' : undefined}
            onClick={() => onSelectTool('qr')}
            className={[
              'flex flex-1 items-center justify-center gap-2 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors sm:flex-initial',
              activeTool === 'qr'
                ? 'bg-[var(--bg-surface)] text-[var(--ink-primary)] shadow-xs ring-1 ring-[var(--border-hairline)]'
                : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]',
            ].join(' ')}
          >
            <QrIcon width={16} height={16} />
            <span>QR Generator</span>
          </button>
        </nav>

        <p className="hidden text-xs text-[var(--ink-secondary)] lg:block">
          Files stay on your device
        </p>
      </div>
    </header>
  )
}
