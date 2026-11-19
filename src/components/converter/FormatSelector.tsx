import type { OutputFormat } from '../../types/converter'

const OUTPUT_FORMATS: ReadonlyArray<{
  format: OutputFormat
  label: string
  description: string
}> = [
  { format: 'png', label: 'PNG', description: 'Lossless raster with alpha transparency' },
  { format: 'jpg', label: 'JPG', description: 'Compact photo compression on solid background' },
  { format: 'webp', label: 'WebP', description: 'Modern web compression with transparency support' },
  { format: 'gif', label: 'GIF', description: 'Indexed palette or multi-frame animation' },
  { format: 'pdf', label: 'PDF', description: 'Single or multi-page document sheet' },
]

interface FormatSelectorProps {
  value: OutputFormat
  onChange: (format: OutputFormat) => void
}

export function FormatSelector({ value, onChange }: FormatSelectorProps) {
  const activeMeta = OUTPUT_FORMATS.find((item) => item.format === value)

  return (
    <section aria-labelledby="target-format-heading" className="space-y-3">
      <div className="space-y-0.5">
        <h2 id="target-format-heading" className="text-sm font-semibold text-[var(--ink-primary)]">
          Convert to
        </h2>
        {activeMeta ? (
          <p className="text-xs text-[var(--ink-secondary)]">{activeMeta.description}</p>
        ) : null}
      </div>

      <div
        role="group"
        aria-label="Target output format"
        className="grid grid-cols-5 gap-1.5 rounded-full bg-[var(--bg-recessed)] p-1.5"
      >
        {OUTPUT_FORMATS.map((item) => {
          const isSelected = item.format === value
          return (
            <button
              key={item.format}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChange(item.format)}
              className={[
                'flex items-center justify-center rounded-full py-2 text-xs font-bold tracking-wide transition-colors sm:text-[13px]',
                isSelected
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-ink)]'
                  : 'text-[var(--ink-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--ink-primary)]',
              ].join(' ')}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    </section>
  )
}
