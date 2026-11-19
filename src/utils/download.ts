export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function downloadZipArchive(
  entries: Array<{ fileName: string; blob: Blob }>,
  archiveName: string
): Promise<void> {
  const { zipSync } = await import('fflate')
  const fileMap: Record<string, Uint8Array> = {}
  const usedNames = new Set<string>()

  const buffers = await Promise.all(entries.map((entry) => entry.blob.arrayBuffer()))
  for (let i = 0; i < entries.length; i++) {
    let candidate = entries[i].fileName
    if (usedNames.has(candidate)) {
      const dot = candidate.lastIndexOf('.')
      const stem = dot > 0 ? candidate.slice(0, dot) : candidate
      const ext = dot > 0 ? candidate.slice(dot) : ''
      let counter = 2
      while (usedNames.has(`${stem}-${counter}${ext}`)) {
        counter++
      }
      candidate = `${stem}-${counter}${ext}`
    }
    usedNames.add(candidate)
    fileMap[candidate] = new Uint8Array(buffers[i])
  }

  const zipped = zipSync(fileMap, { level: 6 })
  const copy = new Uint8Array(zipped.byteLength)
  copy.set(zipped)
  downloadBlob(new Blob([copy.buffer], { type: 'application/zip' }), archiveName)
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!navigator.clipboard?.writeText) {
    return false
  }
  await navigator.clipboard.writeText(text)
  return true
}

export async function copyBlobToClipboard(blob: Blob): Promise<boolean> {
  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
    return false
  }
  await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
  return true
}
