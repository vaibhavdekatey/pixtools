import type {
  QrContentMode,
  QrEmailPayload,
  QrEventPayload,
  QrSettings,
  QrVcardPayload,
  QrWifiEncryption,
  QrWifiPayload,
} from '../../types/qr'
import { SegmentedControl, type SegmentedOption } from '../common/SegmentedControl'

const MODE_OPTIONS: readonly SegmentedOption<QrContentMode>[] = [
  { value: 'text', label: 'URL / Text' },
  { value: 'wifi', label: 'Wi-Fi' },
  { value: 'vcard', label: 'vCard' },
  { value: 'event', label: 'Event' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
]

const WIFI_ENCRYPTION_OPTIONS: readonly SegmentedOption<QrWifiEncryption>[] = [
  { value: 'WPA', label: 'WPA/WPA2' },
  { value: 'WEP', label: 'WEP' },
  { value: 'nopass', label: 'Open' },
]

const FIELD_CLASS =
  'w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:border-[var(--accent-primary)] focus:outline-none'

interface QrPayloadFormProps {
  settings: QrSettings
  encodedPayload: string
  onChangeMode: (mode: QrContentMode) => void
  onChangeText: (text: string) => void
  onChangeWifi: (patch: Partial<QrWifiPayload>) => void
  onChangeEmail: (patch: Partial<QrEmailPayload>) => void
  onChangePhone: (phone: string) => void
  onChangeVcard: (patch: Partial<QrVcardPayload>) => void
  onChangeEvent: (patch: Partial<QrEventPayload>) => void
}

export function QrPayloadForm({
  settings,
  encodedPayload,
  onChangeMode,
  onChangeText,
  onChangeWifi,
  onChangeEmail,
  onChangePhone,
  onChangeVcard,
  onChangeEvent,
}: QrPayloadFormProps) {
  return (
    <section aria-labelledby="qr-content-heading" className="space-y-3.5">
      <div className="flex items-center justify-between gap-2">
        <h2 id="qr-content-heading" className="text-sm font-semibold text-[var(--ink-primary)]">
          QR content
        </h2>
        <span className="font-mono-data text-xs text-[var(--ink-secondary)]">
          {encodedPayload.length} chars
        </span>
      </div>

      <div
        role="group"
        aria-label="QR content type"
        className="grid grid-cols-3 gap-1 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-recessed)] p-1"
      >
        {MODE_OPTIONS.map((option) => {
          const isActive = option.value === settings.mode
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChangeMode(option.value)}
              className={[
                'whitespace-nowrap rounded-md px-2.5 py-1.5 text-center text-xs font-medium transition-colors sm:text-sm',
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

      {settings.mode === 'text' ? (
        <div className="space-y-1.5">
          <label htmlFor="qr-text-input" className="block text-xs font-medium text-[var(--ink-secondary)]">
            Destination URL or plain text
          </label>
          <textarea
            id="qr-text-input"
            rows={3}
            value={settings.text}
            onChange={(e) => onChangeText(e.target.value)}
            placeholder="https://example.com or any text"
            className={`${FIELD_CLASS} resize-y`}
          />
        </div>
      ) : null}

      {settings.mode === 'wifi' ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="qr-wifi-ssid" className="block text-xs font-medium text-[var(--ink-secondary)]">
              Network name (SSID)
            </label>
            <input
              id="qr-wifi-ssid"
              type="text"
              value={settings.wifi.ssid}
              onChange={(e) => onChangeWifi({ ssid: e.target.value })}
              placeholder="Studio Guest Wi-Fi"
              className={FIELD_CLASS}
            />
          </div>

          <div className="space-y-1.5">
            <span className="block text-xs font-medium text-[var(--ink-secondary)]">Security</span>
            <SegmentedControl
              label="Wi-Fi security type"
              value={settings.wifi.encryption}
              options={WIFI_ENCRYPTION_OPTIONS}
              onChange={(encryption) => onChangeWifi({ encryption })}
              fullWidth
            />
          </div>

          {settings.wifi.encryption !== 'nopass' ? (
            <div className="space-y-1.5">
              <label htmlFor="qr-wifi-pass" className="block text-xs font-medium text-[var(--ink-secondary)]">
                Password
              </label>
              <input
                id="qr-wifi-pass"
                type="text"
                value={settings.wifi.password}
                onChange={(e) => onChangeWifi({ password: e.target.value })}
                placeholder="Enter Wi-Fi password"
                className={FIELD_CLASS}
              />
            </div>
          ) : null}

          <label className="flex items-center gap-2 text-xs text-[var(--ink-secondary)]">
            <input
              type="checkbox"
              checked={settings.wifi.hidden}
              onChange={(e) => onChangeWifi({ hidden: e.target.checked })}
              className="h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--accent-primary)]"
            />
            <span>Hidden SSID network</span>
          </label>
        </div>
      ) : null}

      {settings.mode === 'vcard' ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label htmlFor="qr-vcard-first" className="block text-xs font-medium text-[var(--ink-secondary)]">
                First name
              </label>
              <input
                id="qr-vcard-first"
                type="text"
                value={settings.vcard.firstName}
                onChange={(e) => onChangeVcard({ firstName: e.target.value })}
                placeholder="Maya"
                className={FIELD_CLASS}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="qr-vcard-last" className="block text-xs font-medium text-[var(--ink-secondary)]">
                Last name
              </label>
              <input
                id="qr-vcard-last"
                type="text"
                value={settings.vcard.lastName}
                onChange={(e) => onChangeVcard({ lastName: e.target.value })}
                placeholder="Lin"
                className={FIELD_CLASS}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="qr-vcard-org" className="block text-xs font-medium text-[var(--ink-secondary)]">
              Organization (optional)
            </label>
            <input
              id="qr-vcard-org"
              type="text"
              value={settings.vcard.organization}
              onChange={(e) => onChangeVcard({ organization: e.target.value })}
              placeholder="Northline Studio"
              className={FIELD_CLASS}
            />
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="qr-vcard-phone" className="block text-xs font-medium text-[var(--ink-secondary)]">
                Phone
              </label>
              <input
                id="qr-vcard-phone"
                type="tel"
                value={settings.vcard.phone}
                onChange={(e) => onChangeVcard({ phone: e.target.value })}
                placeholder="+1 555 014 8900"
                className={FIELD_CLASS}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="qr-vcard-email" className="block text-xs font-medium text-[var(--ink-secondary)]">
                Email
              </label>
              <input
                id="qr-vcard-email"
                type="email"
                value={settings.vcard.email}
                onChange={(e) => onChangeVcard({ email: e.target.value })}
                placeholder="maya@example.com"
                className={FIELD_CLASS}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="qr-vcard-url" className="block text-xs font-medium text-[var(--ink-secondary)]">
              Website (optional)
            </label>
            <input
              id="qr-vcard-url"
              type="url"
              value={settings.vcard.website}
              onChange={(e) => onChangeVcard({ website: e.target.value })}
              placeholder="https://example.com"
              className={FIELD_CLASS}
            />
          </div>
        </div>
      ) : null}

      {settings.mode === 'event' ? (
        <div className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="qr-event-title" className="block text-xs font-medium text-[var(--ink-secondary)]">
              Event title
            </label>
            <input
              id="qr-event-title"
              type="text"
              value={settings.event.title}
              onChange={(e) => onChangeEvent({ title: e.target.value })}
              placeholder="Design review"
              className={FIELD_CLASS}
            />
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="qr-event-start" className="block text-xs font-medium text-[var(--ink-secondary)]">
                Starts
              </label>
              <input
                id="qr-event-start"
                type="datetime-local"
                value={settings.event.start}
                onChange={(e) => onChangeEvent({ start: e.target.value })}
                className={FIELD_CLASS}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="qr-event-end" className="block text-xs font-medium text-[var(--ink-secondary)]">
                Ends
              </label>
              <input
                id="qr-event-end"
                type="datetime-local"
                value={settings.event.end}
                onChange={(e) => onChangeEvent({ end: e.target.value })}
                className={FIELD_CLASS}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="qr-event-location" className="block text-xs font-medium text-[var(--ink-secondary)]">
              Location (optional)
            </label>
            <input
              id="qr-event-location"
              type="text"
              value={settings.event.location}
              onChange={(e) => onChangeEvent({ location: e.target.value })}
              placeholder="Studio B, 4th Floor"
              className={FIELD_CLASS}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="qr-event-desc" className="block text-xs font-medium text-[var(--ink-secondary)]">
              Notes (optional)
            </label>
            <textarea
              id="qr-event-desc"
              rows={2}
              value={settings.event.description}
              onChange={(e) => onChangeEvent({ description: e.target.value })}
              placeholder="Agenda or join instructions"
              className={`${FIELD_CLASS} resize-y`}
            />
          </div>
        </div>
      ) : null}

      {settings.mode === 'email' ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="qr-email-to" className="block text-xs font-medium text-[var(--ink-secondary)]">
              Recipient address
            </label>
            <input
              id="qr-email-to"
              type="email"
              value={settings.email.to}
              onChange={(e) => onChangeEmail({ to: e.target.value })}
              placeholder="hello@example.com"
              className={FIELD_CLASS}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="qr-email-subject" className="block text-xs font-medium text-[var(--ink-secondary)]">
              Subject (optional)
            </label>
            <input
              id="qr-email-subject"
              type="text"
              value={settings.email.subject}
              onChange={(e) => onChangeEmail({ subject: e.target.value })}
              placeholder="Project inquiry"
              className={FIELD_CLASS}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="qr-email-body" className="block text-xs font-medium text-[var(--ink-secondary)]">
              Message body (optional)
            </label>
            <textarea
              id="qr-email-body"
              rows={2}
              value={settings.email.body}
              onChange={(e) => onChangeEmail({ body: e.target.value })}
              placeholder="Prefilled message text"
              className={`${FIELD_CLASS} resize-y`}
            />
          </div>
        </div>
      ) : null}

      {settings.mode === 'phone' ? (
        <div className="space-y-1.5">
          <label htmlFor="qr-phone-input" className="block text-xs font-medium text-[var(--ink-secondary)]">
            Phone number (with country code)
          </label>
          <input
            id="qr-phone-input"
            type="tel"
            value={settings.phone}
            onChange={(e) => onChangePhone(e.target.value)}
            placeholder="+1 555 014 8900"
            className={FIELD_CLASS}
          />
        </div>
      ) : null}

      {settings.mode !== 'text' && encodedPayload ? (
        <div className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-recessed)] px-2.5 py-2">
          <p className="text-[11px] font-medium text-[var(--ink-secondary)]">Encoded payload</p>
          <p className="font-mono-data mt-0.5 break-all whitespace-pre-wrap text-xs text-[var(--ink-primary)]">
            {encodedPayload}
          </p>
        </div>
      ) : null}
    </section>
  )
}
