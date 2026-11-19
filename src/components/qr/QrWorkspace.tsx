import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import type { QrExportFormat, QrLogoConfig, QrSettings } from '../../types/qr'
import { copyBlobToClipboard, copyTextToClipboard, downloadBlob } from '../../utils/download'
import { sanitizeFileBase } from '../../utils/format'
import { buildQrPayload, generateQrOutput, renderQrRasterBlob } from '../../utils/qrGenerator'
import { QrPayloadForm } from './QrPayloadForm'
import { QrPreviewStage } from './QrPreviewStage'
import { QrStyleControls } from './QrStyleControls'

const INITIAL_QR_SETTINGS: QrSettings = {
  mode: 'text',
  text: 'https://pixtools.local',
  wifi: {
    ssid: '',
    password: '',
    encryption: 'WPA',
    hidden: false,
  },
  email: {
    to: '',
    subject: '',
    body: '',
  },
  phone: '',
  vcard: {
    firstName: '',
    lastName: '',
    organization: '',
    phone: '',
    email: '',
    website: '',
  },
  event: {
    title: '',
    start: '',
    end: '',
    location: '',
    description: '',
  },
  size: 1024,
  margin: 4,
  errorCorrection: 'M',
  moduleStyle: 'square',
  foregroundColor: '#16202a',
  backgroundColor: '#ffffff',
  transparentBackground: false,
  logo: {
    dataUrl: null,
    fileName: '',
    sizePercent: 22,
    padding: true,
  },
}

export default function QrWorkspace() {
  const [settings, setSettings] = useState<QrSettings>(INITIAL_QR_SETTINGS)
  const [fileNameBase, setFileNameBase] = useState('qr-code')
  const [busyFormat, setBusyFormat] = useState<QrExportFormat | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const [copiedFeedback, setCopiedFeedback] = useState<'svg' | 'png' | null>(null)
  const [mobileStyleOpen, setMobileStyleOpen] = useState(false)
  const copyTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current)
      }
    }
  }, [])

  const deferredSettings = useDeferredValue(settings)
  const livePayload = buildQrPayload(settings)

  const qrGeneration = useMemo(() => {
    try {
      const output = generateQrOutput(deferredSettings)
      return { output, error: null as string | null }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Input exceeds maximum QR capacity. Shorten text or lower error correction.'
      return { output: null, error: message }
    }
  }, [deferredSettings])

  function updateSettings(patch: Partial<QrSettings>) {
    setExportError(null)
    setSettings((prev) => ({ ...prev, ...patch }))
  }

  function handleSelectLogoFile(file: File) {
    setExportError(null)
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setExportError('Unable to read logo image file.')
        return
      }
      setSettings((prev) => ({
        ...prev,
        errorCorrection: 'H',
        logo: {
          ...prev.logo,
          dataUrl: reader.result as string,
          fileName: file.name,
        },
      }))
    }
    reader.onerror = () => {
      setExportError('Unable to read logo image file.')
    }
    reader.readAsDataURL(file)
  }

  function handleUpdateLogo(patch: Partial<QrLogoConfig>) {
    setSettings((prev) => ({
      ...prev,
      logo: { ...prev.logo, ...patch },
    }))
  }

  function handleClearLogo() {
    setSettings((prev) => ({
      ...prev,
      logo: {
        ...prev.logo,
        dataUrl: null,
        fileName: '',
      },
    }))
  }

  function showCopiedBadge(kind: 'svg' | 'png') {
    if (copyTimerRef.current !== null) {
      window.clearTimeout(copyTimerRef.current)
    }
    setCopiedFeedback(kind)
    copyTimerRef.current = window.setTimeout(() => {
      setCopiedFeedback(null)
    }, 1800)
  }

  async function handleDownload(format: QrExportFormat) {
    if (!qrGeneration.output) return
    setExportError(null)
    setBusyFormat(format)

    try {
      const stem = sanitizeFileBase(fileNameBase, 'qr-code')
      if (format === 'svg') {
        const blob = new Blob([qrGeneration.output.svgMarkup], {
          type: 'image/svg+xml;charset=utf-8',
        })
        downloadBlob(blob, `${stem}.svg`)
        return
      }
      const rasterBlob = await renderQrRasterBlob(settings, format)
      downloadBlob(rasterBlob, `${stem}.${format}`)
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Unable to export QR code.')
    } finally {
      setBusyFormat(null)
    }
  }

  async function handleCopySvg() {
    if (!qrGeneration.output) return
    setExportError(null)
    try {
      const ok = await copyTextToClipboard(qrGeneration.output.svgMarkup)
      if (!ok) {
        setExportError('Clipboard access is unavailable in this browser context.')
        return
      }
      showCopiedBadge('svg')
    } catch {
      setExportError('Unable to copy SVG markup to clipboard.')
    }
  }

  async function handleCopyPng() {
    if (!qrGeneration.output) return
    setExportError(null)
    try {
      const pngBlob = await renderQrRasterBlob(settings, 'png')
      const ok = await copyBlobToClipboard(pngBlob)
      if (!ok) {
        setExportError('Image clipboard copy is not supported in this browser; use Download PNG.')
        return
      }
      showCopiedBadge('png')
    } catch {
      setExportError('Unable to copy PNG image to clipboard.')
    }
  }

  const combinedError = qrGeneration.error ?? exportError

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(340px,430px)_minmax(0,1fr)]">
      <div className="space-y-5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 sm:p-5">
        <QrPayloadForm
          settings={settings}
          encodedPayload={livePayload}
          onChangeMode={(mode) => updateSettings({ mode })}
          onChangeText={(text) => updateSettings({ text })}
          onChangeWifi={(patch) =>
            setSettings((prev) => ({ ...prev, wifi: { ...prev.wifi, ...patch } }))
          }
          onChangeEmail={(patch) =>
            setSettings((prev) => ({ ...prev, email: { ...prev.email, ...patch } }))
          }
          onChangePhone={(phone) => updateSettings({ phone })}
          onChangeVcard={(patch) =>
            setSettings((prev) => ({ ...prev, vcard: { ...prev.vcard, ...patch } }))
          }
          onChangeEvent={(patch) =>
            setSettings((prev) => ({ ...prev, event: { ...prev.event, ...patch } }))
          }
        />

        <div className="border-t border-[var(--border-hairline)] pt-3 lg:hidden">
          <button
            type="button"
            aria-expanded={mobileStyleOpen}
            onClick={() => setMobileStyleOpen((prev) => !prev)}
            className="flex w-full items-center justify-between rounded-md border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3 py-2 text-left text-xs font-medium text-[var(--ink-primary)]"
          >
            <span>
              {settings.moduleStyle} modules, {settings.size} px, ECC {settings.errorCorrection}
            </span>
            <span className="font-semibold text-[var(--accent-primary)]">
              {mobileStyleOpen ? 'Hide style' : 'Customize'}
            </span>
          </button>
        </div>

        <div className={mobileStyleOpen ? 'block' : 'hidden lg:block'}>
          <QrStyleControls
            settings={settings}
            fileNameBase={fileNameBase}
            onChangeFileNameBase={setFileNameBase}
            onUpdateSettings={updateSettings}
            onSelectLogoFile={handleSelectLogoFile}
            onUpdateLogo={handleUpdateLogo}
            onClearLogo={handleClearLogo}
          />
        </div>
      </div>

      <div className="lg:sticky lg:top-[73px]">
        <QrPreviewStage
          output={qrGeneration.output}
          settings={settings}
          errorMessage={combinedError}
          busyFormat={busyFormat}
          copiedFeedback={copiedFeedback}
          onDownload={handleDownload}
          onCopySvg={handleCopySvg}
          onCopyPng={handleCopyPng}
        />
      </div>
    </div>
  )
}
