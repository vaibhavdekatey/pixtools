import type {
  ConversionOptions,
  PdfMarginPreset,
  PdfOrientation,
  PdfPageSize,
  QueuedFileItem,
  ResizeMode,
} from '../../types/converter'
import { SegmentedControl, type SegmentedOption } from '../common/SegmentedControl'

const RESIZE_OPTIONS: readonly SegmentedOption<ResizeMode>[] = [
  { value: 'original', label: 'Original' },
  { value: 'scale', label: 'Scale %' },
  { value: 'custom', label: 'Custom px' },
]

const PDF_SIZE_OPTIONS: readonly SegmentedOption<PdfPageSize>[] = [
  { value: 'fit', label: 'Fit image' },
  { value: 'a4', label: 'A4' },
  { value: 'letter', label: 'Letter' },
]

const PDF_ORIENTATION_OPTIONS: readonly SegmentedOption<PdfOrientation>[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'portrait', label: 'Portrait' },
  { value: 'landscape', label: 'Landscape' },
]

const PDF_MARGIN_OPTIONS: readonly SegmentedOption<PdfMarginPreset>[] = [
  { value: 'none', label: 'None' },
  { value: 'narrow', label: 'Narrow' },
  { value: 'standard', label: 'Standard' },
]

const SVG_SCALE_OPTIONS: readonly SegmentedOption<string>[] = [
  { value: '1', label: '1×' },
  { value: '2', label: '2×' },
  { value: '4', label: '4×' },
]

const PDF_RENDER_SCALE_OPTIONS: readonly SegmentedOption<string>[] = [
  { value: '1', label: '72 DPI' },
  { value: '2', label: '144 DPI' },
  { value: '3', label: '216 DPI' },
]

interface ResizePreset {
  id: string
  label: string
  width: number
  height: number | null
  square?: boolean
}

const RESIZE_PRESETS: readonly ResizePreset[] = [
  { id: '1080p', label: '1080p', width: 1920, height: null },
  { id: '720p', label: '720p', width: 1280, height: null },
  { id: 'ig-square', label: '1080×1080', width: 1080, height: 1080, square: true },
  { id: 'favicon', label: '512×512', width: 512, height: 512, square: true },
]

interface ConversionSettingsProps {
  options: ConversionOptions
  items: QueuedFileItem[]
  activeItem: QueuedFileItem | null
  onUpdate: (patch: Partial<ConversionOptions>) => void
}

export function ConversionSettings({
  options,
  items,
  activeItem,
  onUpdate,
}: ConversionSettingsProps) {
  const hasPdfInput = items.some((item) => item.sourceFormat === 'pdf')
  const hasSvgInput = items.some((item) => item.sourceFormat === 'svg')
  const hasMultipleFiles = items.length > 1
  const hasMultiPagePdf = Boolean(activeItem?.pageCount && activeItem.pageCount > 1)

  const showQuality = options.targetFormat === 'jpg' || options.targetFormat === 'webp'
  const showMatte = options.targetFormat === 'jpg'
  const showGifOptions = options.targetFormat === 'gif'
  const showPdfOptions = options.targetFormat === 'pdf'

  return (
    <section
      aria-labelledby="conversion-settings-heading"
      className="space-y-4 border-t border-[var(--border-hairline)] pt-4"
    >
      <h2 id="conversion-settings-heading" className="text-sm font-semibold text-[var(--ink-primary)]">
        Conversion options
      </h2>

      {showQuality ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="quality-slider" className="font-medium text-[var(--ink-secondary)]">
              Compression quality
            </label>
            <span className="font-mono-data font-medium text-[var(--ink-primary)]">
              {options.quality}%
            </span>
          </div>
          <input
            id="quality-slider"
            type="range"
            min={10}
            max={100}
            step={1}
            value={options.quality}
            onChange={(e) => onUpdate({ quality: Number(e.target.value) })}
            className="studio-range"
          />
          <div className="flex justify-between text-[11px] text-[var(--ink-muted)]">
            <span>Smaller file</span>
            <span>Higher fidelity</span>
          </div>
        </div>
      ) : null}

      {showMatte ? (
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="jpg-matte" className="text-xs font-medium text-[var(--ink-secondary)]">
            Transparency background fill
          </label>
          <div className="flex items-center gap-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2 py-1">
            <input
              id="jpg-matte"
              type="color"
              value={options.backgroundColor}
              onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
              className="h-5 w-6 rounded border-0 bg-transparent p-0"
            />
            <span className="font-mono-data text-xs text-[var(--ink-primary)]">
              {options.backgroundColor}
            </span>
          </div>
        </div>
      ) : null}

      {hasPdfInput ? (
        <div className="space-y-1.5">
          <span className="block text-xs font-medium text-[var(--ink-secondary)]">
            PDF render resolution
          </span>
          <SegmentedControl
            label="PDF render resolution"
            value={String(options.pdfRenderScale)}
            options={PDF_RENDER_SCALE_OPTIONS}
            onChange={(val) => onUpdate({ pdfRenderScale: Number(val) })}
            fullWidth
          />
        </div>
      ) : null}

      {hasSvgInput ? (
        <div className="space-y-1.5">
          <span className="block text-xs font-medium text-[var(--ink-secondary)]">
            SVG rasterization scale
          </span>
          <SegmentedControl
            label="SVG raster scale"
            value={String(options.svgRasterScale)}
            options={SVG_SCALE_OPTIONS}
            onChange={(val) => onUpdate({ svgRasterScale: Number(val) })}
            fullWidth
          />
        </div>
      ) : null}

      {showGifOptions ? (
        <div className="space-y-3 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-3">
          {(hasMultipleFiles || hasMultiPagePdf) ? (
            <label className="flex items-center gap-2 text-xs font-medium text-[var(--ink-primary)]">
              <input
                type="checkbox"
                checked={options.gifCombineMultiple}
                onChange={(e) => onUpdate({ gifCombineMultiple: e.target.checked })}
                className="h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--accent-primary)]"
              />
              <span>
                {hasMultiPagePdf
                  ? 'Combine PDF pages into one animated GIF'
                  : 'Combine queued files into one animated GIF'}
              </span>
            </label>
          ) : null}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="gif-delay-slider" className="font-medium text-[var(--ink-secondary)]">
                Frame duration
              </label>
              <span className="font-mono-data font-medium text-[var(--ink-primary)]">
                {options.gifFrameDelayMs} ms
              </span>
            </div>
            <input
              id="gif-delay-slider"
              type="range"
              min={50}
              max={2000}
              step={50}
              value={options.gifFrameDelayMs}
              onChange={(e) => onUpdate({ gifFrameDelayMs: Number(e.target.value) })}
              className="studio-range"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-[var(--ink-secondary)]">
            <input
              type="checkbox"
              checked={options.gifLoop}
              onChange={(e) => onUpdate({ gifLoop: e.target.checked })}
              className="h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--accent-primary)]"
            />
            <span>Loop animation continuously</span>
          </label>
        </div>
      ) : null}

      {showPdfOptions ? (
        <div className="space-y-3 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-3">
          {hasMultipleFiles ? (
            <label className="flex items-center gap-2 text-xs font-medium text-[var(--ink-primary)]">
              <input
                type="checkbox"
                checked={options.pdfCombineMultiple}
                onChange={(e) => onUpdate({ pdfCombineMultiple: e.target.checked })}
                className="h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--accent-primary)]"
              />
              <span>Merge all queued files into one PDF</span>
            </label>
          ) : null}

          <div className="space-y-1.5">
            <span className="block text-xs font-medium text-[var(--ink-secondary)]">
              Page size
            </span>
            <SegmentedControl
              label="PDF page size"
              value={options.pdfPageSize}
              options={PDF_SIZE_OPTIONS}
              onChange={(pdfPageSize) => onUpdate({ pdfPageSize })}
              fullWidth
            />
          </div>

          {options.pdfPageSize !== 'fit' ? (
            <div className="space-y-1.5">
              <span className="block text-xs font-medium text-[var(--ink-secondary)]">
                Orientation
              </span>
              <SegmentedControl
                label="PDF orientation"
                value={options.pdfOrientation}
                options={PDF_ORIENTATION_OPTIONS}
                onChange={(pdfOrientation) => onUpdate({ pdfOrientation })}
                fullWidth
              />
            </div>
          ) : null}

          <div className="space-y-1.5">
            <span className="block text-xs font-medium text-[var(--ink-secondary)]">
              Page margin
            </span>
            <SegmentedControl
              label="PDF page margin"
              value={options.pdfMargin}
              options={PDF_MARGIN_OPTIONS}
              onChange={(pdfMargin) => onUpdate({ pdfMargin })}
              fullWidth
            />
          </div>
        </div>
      ) : null}

      <div className="space-y-2.5">
        <span className="block text-xs font-medium text-[var(--ink-secondary)]">
          Output dimensions
        </span>
        <SegmentedControl
          label="Resize mode"
          value={options.resizeMode}
          options={RESIZE_OPTIONS}
          onChange={(resizeMode) => onUpdate({ resizeMode })}
          fullWidth
        />

        {options.resizeMode === 'scale' ? (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--ink-secondary)]">Scale factor</span>
              <span className="font-mono-data font-medium text-[var(--ink-primary)]">
                {options.scalePercent}%
              </span>
            </div>
            <input
              type="range"
              aria-label="Scale percentage"
              min={10}
              max={200}
              step={5}
              value={options.scalePercent}
              onChange={(e) => onUpdate({ scalePercent: Number(e.target.value) })}
              className="studio-range"
            />
          </div>
        ) : null}

        {options.resizeMode === 'custom' ? (
          <div className="space-y-2.5 pt-1">
            <div className="flex flex-wrap gap-1.5">
              {RESIZE_PRESETS.map((preset) => {
                const isActive =
                  options.customWidth === preset.width &&
                  (preset.square ? options.customHeight === preset.height : true)
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      if (preset.square) {
                        onUpdate({
                          resizeMode: 'custom',
                          customWidth: preset.width,
                          customHeight: preset.height,
                          maintainAspect: false,
                        })
                        return
                      }
                      const aspect =
                        activeItem?.width && activeItem?.height
                          ? activeItem.height / activeItem.width
                          : 9 / 16
                      onUpdate({
                        resizeMode: 'custom',
                        customWidth: preset.width,
                        customHeight: Math.max(1, Math.round(preset.width * aspect)),
                        maintainAspect: true,
                      })
                    }}
                    className={[
                      'rounded-md border px-2 py-1 text-[11px] font-medium transition-colors',
                      isActive
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary-soft)] text-[var(--ink-primary)]'
                        : 'border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]',
                    ].join(' ')}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="resize-width" className="block text-[11px] text-[var(--ink-secondary)]">
                  Width (px)
                </label>
                <input
                  id="resize-width"
                  type="number"
                  min={1}
                  max={8192}
                  value={options.customWidth ?? ''}
                  placeholder={activeItem?.width ? String(activeItem.width) : 'Auto'}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null
                    if (
                      val &&
                      options.maintainAspect &&
                      activeItem?.width &&
                      activeItem?.height
                    ) {
                      const ratio = activeItem.height / activeItem.width
                      onUpdate({
                        customWidth: val,
                        customHeight: Math.max(1, Math.round(val * ratio)),
                      })
                    } else {
                      onUpdate({ customWidth: val })
                    }
                  }}
                  className="font-mono-data w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-xs text-[var(--ink-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="resize-height" className="block text-[11px] text-[var(--ink-secondary)]">
                  Height (px)
                </label>
                <input
                  id="resize-height"
                  type="number"
                  min={1}
                  max={8192}
                  value={options.customHeight ?? ''}
                  placeholder={activeItem?.height ? String(activeItem.height) : 'Auto'}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null
                    if (
                      val &&
                      options.maintainAspect &&
                      activeItem?.width &&
                      activeItem?.height
                    ) {
                      const ratio = activeItem.width / activeItem.height
                      onUpdate({
                        customHeight: val,
                        customWidth: Math.max(1, Math.round(val * ratio)),
                      })
                    } else {
                      onUpdate({ customHeight: val })
                    }
                  }}
                  className="font-mono-data w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-xs text-[var(--ink-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-[var(--ink-secondary)]">
              <input
                type="checkbox"
                checked={options.maintainAspect}
                onChange={(e) => onUpdate({ maintainAspect: e.target.checked })}
                className="h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--accent-primary)]"
              />
              <span>Lock aspect ratio</span>
            </label>
          </div>
        ) : null}
      </div>

      <p className="border-t border-[var(--border-hairline)] pt-3 text-[11px] leading-relaxed text-[var(--ink-muted)]">
        EXIF orientation is applied automatically; camera EXIF and GPS metadata are stripped on re-encode.
      </p>
    </section>
  )
}
