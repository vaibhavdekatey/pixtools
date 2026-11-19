import { AlertIcon } from '../icons/Icons'

interface NoticeBannerProps {
  tone: 'info' | 'warning' | 'error'
  message: string
  onDismiss?: () => void
}

const TONE_CLASSES: Record<NoticeBannerProps['tone'], string> = {
  info: 'border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-[var(--ink-secondary)]',
  warning: 'border-[var(--warning-border)] bg-[var(--warning-soft)] text-[var(--warning)]',
  error: 'border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger)]',
}

export function NoticeBanner({ tone, message, onDismiss }: NoticeBannerProps) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={[
        'flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-xs leading-relaxed',
        TONE_CLASSES[tone],
      ].join(' ')}
    >
      <AlertIcon width={16} height={16} className="mt-0.5 shrink-0" />
      <p className="min-w-0 flex-1">{message}</p>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 font-medium underline underline-offset-2 hover:opacity-80"
        >
          Dismiss
        </button>
      ) : null}
    </div>
  )
}
