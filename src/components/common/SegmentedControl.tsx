export interface SegmentedOption<T extends string> {
  value: T
  label: string
  hint?: string
}

interface SegmentedControlProps<T extends string> {
  label: string
  value: T
  options: readonly SegmentedOption<T>[]
  onChange: (value: T) => void
  fullWidth?: boolean
}

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  fullWidth = false,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={[
        'inline-flex flex-wrap gap-1 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-recessed)] p-1',
        fullWidth ? 'w-full' : '',
      ].join(' ')}
    >
      {options.map((option) => {
        const isActive = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={[
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              fullWidth ? 'flex-1 text-center' : '',
              isActive
                ? 'bg-[var(--bg-surface)] text-[var(--ink-primary)] shadow-xs ring-1 ring-[var(--border-hairline)]'
                : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]',
            ].join(' ')}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
