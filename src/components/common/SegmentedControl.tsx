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
        'inline-flex flex-wrap gap-1 rounded-full bg-[var(--bg-recessed)] p-1',
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
              'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:text-[13px]',
              fullWidth ? 'flex-1 text-center' : '',
              isActive
                ? 'bg-[#2a3f54] text-[#e0f2fe]'
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
