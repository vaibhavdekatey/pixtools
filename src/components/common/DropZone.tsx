import { useId, useRef, useState } from 'react'
import { UploadIcon } from '../icons/Icons'

interface DropZoneProps {
  accept: string
  multiple?: boolean
  compact?: boolean
  onFilesSelected: (files: FileList | File[]) => void
  title: string
  subtitle: string
}

export function DropZone({
  accept,
  multiple = true,
  compact = false,
  onFilesSelected,
  title,
  subtitle,
}: DropZoneProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    if (!isDragging) setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files)
      e.target.value = ''
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={[
        'rounded-xl transition-colors',
        compact ? 'px-3.5 py-3' : 'px-5 py-7',
        isDragging
          ? 'bg-[var(--accent-primary-soft)] ring-1 ring-[var(--accent-primary)]'
          : 'bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated-hover)]',
      ].join(' ')}
    >
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        className="sr-only"
      />
      <label
        htmlFor={inputId}
        className={[
          'flex cursor-pointer items-center gap-3.5',
          compact ? 'flex-row justify-between' : 'flex-col text-center',
        ].join(' ')}
      >
        <div
          className={[
            'flex items-center justify-center rounded-full bg-[var(--accent-primary-soft)] text-[var(--accent-primary)]',
            compact ? 'size-9 shrink-0' : 'size-12',
          ].join(' ')}
        >
          <UploadIcon width={18} height={18} />
        </div>
        <div className={compact ? 'min-w-0 flex-1 text-left' : ''}>
          <p className="text-sm font-semibold text-[var(--ink-primary)]">{title}</p>
          <p className="mt-0.5 text-xs text-[var(--ink-secondary)]">{subtitle}</p>
        </div>
        {compact ? (
          <span className="shrink-0 rounded-full bg-[var(--bg-surface)] px-3 py-1 text-xs font-semibold text-[var(--ink-primary)]">
            Add files
          </span>
        ) : null}
      </label>
    </div>
  )
}
