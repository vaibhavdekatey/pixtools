import type { OutputFormat } from '../../types/converter'

const OUTPUT_FORMATS: ReadonlyArray<{
  format: OutputFormat
  label: string
  hint: string
}> = [
  { format: 'png', label: 'PNG', hint: 'Lossless' },
  { format: 'jpg', label: 'JPG', hint: 'Compact' },
  { format: 'webp', label: 'WebP', hint: 'Modern web' },
  { format: 'gif', label: 'GIF', hint: 'Loop / frames' },
  { format: 'pdf', label: 'PDF', hint: 'Document' },
]

interface FormatSelectorProps {
  value: OutputFormat
  onChange: (format: OutputFormat) => void
}

export function FormatSelector({ value, onChange }: FormatSelectorProps) {
  return (
    <section aria-labelledby="target-format-heading" className="space-y-2">
      <h2 id="target-format-heading" className="text-sm font-semibold text-[var(--ink-primary)]">
        Convert to
      </h2>
      <div className="grid grid-cols-5 gap-1.5">
        {OUTPUT_FORMATS.map((item) => {
          const isSelected = item.format === value
          return (
            <button
              key={item.format}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChange(item.format)}
              className={[
                'flex flex-col items-center rounded-lg border px-1.5 py-2 text-center transition-colors',
                isSelected
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white'
                  : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--ink-primary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-elevated)]',
              ].join(' ')}
            >
              <span className="text-xs font-bold tracking-tight sm:text-sm">{item.label}</span>
              <span
                className={[
                  'mt-0.5 hidden text-[10px] sm:block',
                  isSelected ? 'text-white/85' : 'text-[var(--ink-secondary)]',
                ].join(' ')}
              >
                {item.hint}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
