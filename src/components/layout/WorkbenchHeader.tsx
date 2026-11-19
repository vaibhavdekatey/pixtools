import { LayersIcon, QrIcon } from '../icons/Icons'

export type ActiveToolTab = 'converter' | 'qr'

interface WorkbenchHeaderProps {
  activeTool: ActiveToolTab
  onSelectTool: (tool: ActiveToolTab) => void
}

export function WorkbenchHeader({ activeTool, onSelectTool }: WorkbenchHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-[var(--bg-canvas)]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1380px] flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-[var(--accent-primary)] text-[var(--accent-primary-ink)]">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" />
              <rect x="13" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2.2" />
              <rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2.2" />
              <path d="M14 14h6v6h-6z" fill="currentColor" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-[var(--ink-primary)] leading-tight">
              PixTools
            </h1>
            <p className="text-xs text-[var(--ink-secondary)] leading-tight">
              Local file converter &amp; QR studio
            </p>
          </div>
        </div>

        <nav
          aria-label="Utility tools"
          className="flex w-full items-center gap-1 rounded-full bg-[var(--bg-surface)] p-1 sm:w-auto"
        >
          <button
            type="button"
            aria-current={activeTool === 'converter' ? 'page' : undefined}
            onClick={() => onSelectTool('converter')}
            className={[
              'flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors sm:flex-initial',
              activeTool === 'converter'
                ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-ink)]'
                : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]',
            ].join(' ')}
          >
            <LayersIcon width={15} height={15} />
            <span>File Converter</span>
          </button>

          <button
            type="button"
            aria-current={activeTool === 'qr' ? 'page' : undefined}
            onClick={() => onSelectTool('qr')}
            className={[
              'flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors sm:flex-initial',
              activeTool === 'qr'
                ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-ink)]'
                : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]',
            ].join(' ')}
          >
            <QrIcon width={15} height={15} />
            <span>QR Generator</span>
          </button>
        </nav>

        <p className="hidden text-xs font-medium text-[var(--ink-secondary)] lg:block">
          Runs locally in browser
        </p>
      </div>
    </header>
  )
}
