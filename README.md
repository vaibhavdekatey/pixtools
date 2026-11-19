# PixTools

A 100% client-side **File Converter** and **QR Code Generator** built with Vite, React, and TypeScript. Every conversion, preview, PDF render, GIF encoding, and QR export runs locally in the browser—no files or payloads are uploaded to a server.

## Features

### File Converter
- **Supported inputs:** `PNG`, `JPG` / `JPEG`, `WebP`, `GIF` (static & animated), `PDF` (single & multi-page), `SVG`, `BMP`, and `AVIF`
- **Supported outputs:** `PNG`, `JPG`, `WebP`, `GIF` (static & animated), and `PDF`
- **Live previews before downloading:**
  - **Before / After Split Comparison:** Interactive draggable divider (`Split`, `Output`, `Original`) with Grid / Light / Dark transparency backdrops, live byte size comparison, and `%` size delta
  - **PDF Sheet Preview:** Scaled paper preview (`Fit image`, `A4`, `Letter`) with orientation (`Auto`, `Portrait`, `Landscape`), margin guides, and page navigation
  - **Multi-page PDF & Animated GIF Inspector:** Page/frame thumbnail strip to inspect and download individual pages/frames or export all as a `.zip`
- **Conversion controls:**
  - Quality slider (`10%–100%`) for `JPG` and `WebP`
  - Matte background color picker for flattening transparency when exporting `JPG`
  - Resize modes: `Original`, `Scale %`, `Custom px` (with `1080p`, `720p`, `1080×1080`, `512×512` presets and aspect lock)
  - `SVG` rasterization scale (`1×`, `2×`, `4×`) and `PDF` render resolution (`72`, `144`, `216 DPI`)
  - Combine multiple files into a single multi-page `PDF` or animated `GIF` (configurable frame duration and looping)
  - Batch ZIP export with per-file progress and partial-failure reporting
  - Automatic EXIF orientation handling with camera EXIF/GPS metadata stripped on re-encode

### QR Generator
- **Payload presets:** `URL / Text`, `Wi-Fi` (`WPA/WPA2`, `WEP`, `Open`, hidden SSID), `vCard` (Contact), `Event` (`VEVENT` calendar), `Email`, and `Phone`
- **Geometry & styling:**
  - Module shapes: `Square`, `Rounded`, and `Dots`
  - Raster export sizes: `256`, `512`, `1024`, or `2048 px`
  - Error correction (`L`, `M`, `Q`, `H`) and quiet zone margin (`0`, `2`, `4`, `6` modules)
  - Optional center logo overlay (`PNG`, `SVG`, `JPG`, `WebP`) with size slider, quiet-frame cutout, and automatic `H (30%)` error correction
  - Custom foreground/background colors, palette presets, transparent `SVG`/`PNG` option, and live contrast-ratio scannability check
- **Exports:** Download `SVG`, `PNG`, or `JPG`, or copy `SVG` markup / `PNG` image directly to the clipboard

---

## Local Development

### Prerequisites
- **Node.js** `>= 22.12.0` (recommended `22.13+` for `pdfjs-dist`)
- **npm** `10+`

### Setup & Run
```bash
npm install
npm run dev
```

### Build & Preview Production Bundle
```bash
npm run build
npm run preview
```

`npm run build` runs TypeScript project checks (`tsc -b`) followed by `vite build`, outputting static assets to `dist/`.

---

## Hosting & Deployment

PixTools is a static single-page application (`dist/`). No backend server, environment variables, or API keys are required.

### Static Hosts (Vercel, Netlify, Cloudflare Pages)
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Node version:** `22`

### Subpath Hosting (e.g., GitHub Pages)
If hosting under a repository subpath such as `https://<user>.github.io/<repo>/`, set `base` in `vite.config.ts`:

```ts
export default defineConfig({
  base: '/<repo>/',
  // ...
})
```

### Server / CDN Notes
- Ensure `.mjs` files (including the bundled `pdf.worker.min-*.mjs` worker asset in `dist/assets/`) are served with a JavaScript MIME type (`application/javascript` or `text/javascript`). Modern static hosts (Vercel, Netlify, Cloudflare Pages, GitHub Pages, Nginx) do this by default.
- Tool navigation uses URL hashes (`#converter` and `#qr`), so no custom server-side SPA rewrite rules are required.

---

## Tech Stack & Project Structure

- **Framework:** React 19 + TypeScript + Vite 8 + Tailwind CSS v4
- **Client-side codecs (lazy-loaded on demand):**
  - `qrcode` — QR matrix generation
  - `pdfjs-dist` — PDF page rendering via Web Worker
  - `pdf-lib` — Client-side PDF assembly
  - `gifenc` & `omggif` — GIF89a encoding and multi-frame GIF decoding
  - `fflate` — In-browser ZIP archive packaging

```text
src/
├── App.tsx                       # Workbench shell & hash-based tool routing
├── index.css                     # Dark studio design tokens & optical mat utilities
├── types/                        # TypeScript interfaces for converter & QR state
├── utils/                        # QR builder, image/GIF/PDF codecs, ZIP/clipboard helpers
└── components/
    ├── common/                   # DropZone, SegmentedControl, NoticeBanner
    ├── layout/                   # WorkbenchHeader
    ├── converter/                # FileQueueList, FormatSelector, ConversionSettings, SplitCompareView, PdfPreviewView, PageArtifactStrip
    └── qr/                       # QrWorkspace, QrPayloadForm, QrStyleControls, QrPreviewStage
```
