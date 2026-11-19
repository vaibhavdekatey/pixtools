import { useId } from 'react'
import type {
  QrErrorCorrectionLevel,
  QrLogoConfig,
  QrModuleStyle,
  QrSettings,
} from '../../types/qr'
import { SegmentedControl, type SegmentedOption } from '../common/SegmentedControl'
import { TrashIcon, UploadIcon } from '../icons/Icons'

const SIZE_OPTIONS: readonly SegmentedOption<string>[] = [
  { value: '256', label: '256 px' },
  { value: '512', label: '512 px' },
  { value: '1024', label: '1024 px' },
  { value: '2048', label: '2048 px' },
]

const ECC_OPTIONS: readonly SegmentedOption<QrErrorCorrectionLevel>[] = [
  { value: 'L', label: 'L (7%)' },
  { value: 'M', label: 'M (15%)' },
  { value: 'Q', label: 'Q (25%)' },
  { value: 'H', label: 'H (30%)' },
]

const MARGIN_OPTIONS: readonly SegmentedOption<string>[] = [
  { value: '0', label: '0' },
  { value: '2', label: '2' },
  { value: '4', label: '4' },
  { value: '6', label: '6' },
]

const MODULE_STYLE_OPTIONS: readonly SegmentedOption<QrModuleStyle>[] = [
  { value: 'square', label: 'Square' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'dots', label: 'Dots' },
]

const COLOR_SWATCHES = [
  { label: 'Ink / Paper', fg: '#16202a', bg: '#ffffff' },
  { label: 'Pure Black', fg: '#000000', bg: '#ffffff' },
  { label: 'Cobalt', fg: '#0f52ba', bg: '#ffffff' },
  { label: 'Teal', fg: '#0f766e', bg: '#f8fafc' },
] as const

interface QrStyleControlsProps {
  settings: QrSettings
  fileNameBase: string
  onChangeFileNameBase: (value: string) => void
  onUpdateSettings: (patch: Partial<QrSettings>) => void
  onSelectLogoFile: (file: File) => void
  onUpdateLogo: (patch: Partial<QrLogoConfig>) => void
  onClearLogo: () => void
}

export function QrStyleControls({
  settings,
  fileNameBase,
  onChangeFileNameBase,
  onUpdateSettings,
  onSelectLogoFile,
  onUpdateLogo,
  onClearLogo,
}: QrStyleControlsProps) {
  const logoInputId = useId()

  function handleLogoInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      onSelectLogoFile(file)
      e.target.value = ''
    }
  }

  return (
    <section
      aria-labelledby="qr-style-heading"
      className="space-y-4 pt-2"
    >
      <h2 id="qr-style-heading" className="text-sm font-semibold text-[var(--ink-primary)]">
        Output &amp; geometry
      </h2>

      <div className="space-y-1.5">
        <span className="block text-xs font-medium text-[var(--ink-secondary)]">
          Module shape
        </span>
        <SegmentedControl
          label="QR module shape"
          value={settings.moduleStyle}
          options={MODULE_STYLE_OPTIONS}
          onChange={(moduleStyle) => onUpdateSettings({ moduleStyle })}
          fullWidth
        />
      </div>

      <div className="space-y-1.5">
        <span className="block text-xs font-medium text-[var(--ink-secondary)]">
          Raster export size (PNG &amp; JPG)
        </span>
        <SegmentedControl
          label="Export pixel size"
          value={String(settings.size)}
          options={SIZE_OPTIONS}
          onChange={(val) => onUpdateSettings({ size: Number(val) })}
          fullWidth
        />
      </div>

      <div className="grid grid-cols-1 gap-3.5">
        <div className="space-y-1.5">
          <span className="block text-xs font-medium text-[var(--ink-secondary)]">
            Error correction
          </span>
          <SegmentedControl
            label="Error correction level"
            value={settings.errorCorrection}
            options={ECC_OPTIONS}
            onChange={(errorCorrection) => onUpdateSettings({ errorCorrection })}
            fullWidth
          />
        </div>

        <div className="space-y-1.5">
          <span className="block text-xs font-medium text-[var(--ink-secondary)]">
            Quiet zone (modules)
          </span>
          <SegmentedControl
            label="Quiet zone margin"
            value={String(settings.margin)}
            options={MARGIN_OPTIONS}
            onChange={(val) => onUpdateSettings({ margin: Number(val) })}
            fullWidth
          />
        </div>
      </div>

      {/* Optional Center Logo Overlay */}
      <div className="space-y-2.5 rounded-xl bg-[var(--bg-elevated)] p-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-[var(--ink-primary)]">
            Center logo overlay (optional)
          </span>
          {settings.logo.dataUrl ? (
            <button
              type="button"
              onClick={onClearLogo}
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--danger)] hover:opacity-80"
            >
              <TrashIcon width={13} height={13} />
              <span>Remove</span>
            </button>
          ) : null}
        </div>

        <input
          id={logoInputId}
          type="file"
          accept=".png,.svg,.jpg,.jpeg,.webp,image/png,image/svg+xml,image/jpeg,image/webp"
          onChange={handleLogoInputChange}
          className="sr-only"
        />

        {settings.logo.dataUrl ? (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <img
                src={settings.logo.dataUrl}
                alt="QR center logo"
                className="h-9 w-9 rounded border border-[var(--border-hairline)] bg-white object-contain p-0.5"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-[var(--ink-primary)]">
                  {settings.logo.fileName}
                </p>
                <p className="text-[11px] text-[var(--ink-secondary)]">
                  Error correction auto-set to H (30%) for scan reliability
                </p>
              </div>
              <label
                htmlFor={logoInputId}
                className="shrink-0 cursor-pointer rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs font-medium text-[var(--ink-primary)] hover:bg-[var(--bg-canvas)]"
              >
                Replace
              </label>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="qr-logo-size" className="text-[var(--ink-secondary)]">
                  Logo size
                </label>
                <span className="font-mono-data text-[var(--ink-primary)]">
                  {settings.logo.sizePercent}%
                </span>
              </div>
              <input
                id="qr-logo-size"
                type="range"
                min={14}
                max={28}
                step={1}
                value={settings.logo.sizePercent}
                onChange={(e) => onUpdateLogo({ sizePercent: Number(e.target.value) })}
                className="studio-range"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-[var(--ink-secondary)]">
              <input
                type="checkbox"
                checked={settings.logo.padding}
                onChange={(e) => onUpdateLogo({ padding: e.target.checked })}
                className="h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--accent-primary)]"
              />
              <span>Clear modules around logo with quiet frame</span>
            </label>
          </div>
        ) : (
          <label
            htmlFor={logoInputId}
            className="flex cursor-pointer items-center justify-between gap-2 rounded-lg bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--ink-secondary)] transition-colors hover:bg-[var(--bg-recessed)] hover:text-[var(--ink-primary)]"
          >
            <span>Add a PNG, SVG, JPG, or WebP emblem</span>
            <span className="inline-flex items-center gap-1 font-medium text-[var(--accent-primary)]">
              <UploadIcon width={14} height={14} />
              <span>Upload</span>
            </span>
          </label>
        )}
      </div>

      <div className="space-y-2">
        <span className="text-xs font-medium text-[var(--ink-secondary)]">Palette presets</span>
        <div className="flex flex-wrap gap-1.5">
          {COLOR_SWATCHES.map((swatch) => {
            const isSelected =
              settings.foregroundColor.toLowerCase() === swatch.fg &&
              settings.backgroundColor.toLowerCase() === swatch.bg
            return (
              <button
                key={swatch.label}
                type="button"
                onClick={() =>
                  onUpdateSettings({
                    foregroundColor: swatch.fg,
                    backgroundColor: swatch.bg,
                  })
                }
                className={[
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  isSelected
                    ? 'bg-[#2a3f54] text-[#e0f2fe]'
                    : 'bg-[var(--bg-elevated)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]',
                ].join(' ')}
              >
                <span
                  className="inline-block h-3 w-3 rounded-xs border border-white/25"
                  style={{ backgroundColor: swatch.fg }}
                />
                <span>{swatch.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="qr-fg-color" className="block text-xs font-medium text-[var(--ink-secondary)]">
            Modules color
          </label>
          <div className="flex items-center gap-2 rounded-lg bg-[var(--bg-elevated)] px-2.5 py-1.5">
            <input
              id="qr-fg-color"
              type="color"
              value={settings.foregroundColor}
              onChange={(e) => onUpdateSettings({ foregroundColor: e.target.value })}
              className="h-6 w-7 shrink-0 rounded border-0 bg-transparent p-0"
            />
            <input
              type="text"
              aria-label="Modules color hex"
              value={settings.foregroundColor}
              onChange={(e) => onUpdateSettings({ foregroundColor: e.target.value })}
              className="font-mono-data min-w-0 flex-1 bg-transparent text-xs text-[var(--ink-primary)] focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="qr-bg-color" className="block text-xs font-medium text-[var(--ink-secondary)]">
            Background
          </label>
          <div
            className={[
              'flex items-center gap-2 rounded-lg bg-[var(--bg-elevated)] px-2.5 py-1.5',
              settings.transparentBackground ? 'opacity-55' : '',
            ].join(' ')}
          >
            <input
              id="qr-bg-color"
              type="color"
              value={settings.backgroundColor}
              onChange={(e) => onUpdateSettings({ backgroundColor: e.target.value })}
              className="h-6 w-7 shrink-0 rounded border-0 bg-transparent p-0"
            />
            <input
              type="text"
              aria-label="Background color hex"
              value={settings.backgroundColor}
              onChange={(e) => onUpdateSettings({ backgroundColor: e.target.value })}
              className="font-mono-data min-w-0 flex-1 bg-transparent text-xs text-[var(--ink-primary)] focus:outline-none"
            />
          </div>
        </div>
      </div>

      <label className="flex items-start gap-2.5 text-xs text-[var(--ink-secondary)]">
        <input
          type="checkbox"
          checked={settings.transparentBackground}
          onChange={(e) => onUpdateSettings({ transparentBackground: e.target.checked })}
          className="mt-0.5 h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--accent-primary)]"
        />
        <span>
          Transparent background for SVG &amp; PNG (JPG export still uses the solid background color)
        </span>
      </label>

      <div className="space-y-1.5">
        <label htmlFor="qr-filename" className="block text-xs font-medium text-[var(--ink-secondary)]">
          Export file name
        </label>
        <input
          id="qr-filename"
          type="text"
          value={fileNameBase}
          onChange={(e) => onChangeFileNameBase(e.target.value)}
          placeholder="qr-code"
          className="w-full rounded-lg bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--ink-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
        />
      </div>
    </section>
  )
}
