declare module 'gifenc' {
  export type PaletteFormat = 'rgb565' | 'rgb444' | 'rgba4444'
  export type RgbaColor = [number, number, number] | [number, number, number, number]

  export interface QuantizeOptions {
    format?: PaletteFormat
    clearAlpha?: boolean
    clearAlphaColor?: number
    clearAlphaThreshold?: number
    oneBitAlpha?: boolean | number
    useSqrt?: boolean
  }

  export interface WriteFrameOptions {
    palette?: RgbaColor[] | null
    first?: boolean
    transparent?: boolean
    transparentIndex?: number
    delay?: number
    repeat?: number
    colorDepth?: number
    dispose?: number
  }

  export interface GifEncoderInstance {
    reset(): void
    finish(): void
    bytes(): Uint8Array
    bytesView(): Uint8Array
    writeHeader(): void
    writeFrame(index: Uint8Array, width: number, height: number, opts?: WriteFrameOptions): void
  }

  export function GIFEncoder(opts?: { initialCapacity?: number; auto?: boolean }): GifEncoderInstance
  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    options?: QuantizeOptions
  ): RgbaColor[]
  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: RgbaColor[],
    format?: PaletteFormat
  ): Uint8Array
}
