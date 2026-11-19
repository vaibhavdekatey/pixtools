export type QrContentMode = 'text' | 'wifi' | 'email' | 'phone' | 'vcard' | 'event'

export type QrErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H'

export type QrWifiEncryption = 'WPA' | 'WEP' | 'nopass'

export type QrModuleStyle = 'square' | 'rounded' | 'dots'

export type QrExportFormat = 'svg' | 'png' | 'jpg'

export interface QrWifiPayload {
  ssid: string
  password: string
  encryption: QrWifiEncryption
  hidden: boolean
}

export interface QrEmailPayload {
  to: string
  subject: string
  body: string
}

export interface QrVcardPayload {
  firstName: string
  lastName: string
  organization: string
  phone: string
  email: string
  website: string
}

export interface QrEventPayload {
  title: string
  start: string
  end: string
  location: string
  description: string
}

export interface QrLogoConfig {
  dataUrl: string | null
  fileName: string
  sizePercent: number
  padding: boolean
}

export interface QrSettings {
  mode: QrContentMode
  text: string
  wifi: QrWifiPayload
  email: QrEmailPayload
  phone: string
  vcard: QrVcardPayload
  event: QrEventPayload
  size: number
  margin: number
  errorCorrection: QrErrorCorrectionLevel
  moduleStyle: QrModuleStyle
  foregroundColor: string
  backgroundColor: string
  transparentBackground: boolean
  logo: QrLogoConfig
}

export interface QrGeneratedOutput {
  payload: string
  moduleCount: number
  svgMarkup: string
  svgByteSize: number
  contrastRatio: number
  isInverted: boolean
  isLowContrast: boolean
}
