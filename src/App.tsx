import { Suspense, lazy, useEffect, useState } from 'react'
import { WorkbenchHeader, type ActiveToolTab } from './components/layout/WorkbenchHeader'

const ConverterWorkspace = lazy(() => import('./components/converter/ConverterWorkspace'))
const QrWorkspace = lazy(() => import('./components/qr/QrWorkspace'))

function readInitialTool(): ActiveToolTab {
  if (typeof window === 'undefined') return 'converter'
  return window.location.hash === '#qr' ? 'qr' : 'converter'
}

const workspaceFallback = (
  <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-sm text-[var(--ink-secondary)]">
    Loading workbench...
  </div>
)

export default function App() {
  const [activeTool, setActiveTool] = useState<ActiveToolTab>(readInitialTool)
  const [mountedTools, setMountedTools] = useState<Record<ActiveToolTab, boolean>>(() => {
    const initial = readInitialTool()
    return {
      converter: initial === 'converter',
      qr: initial === 'qr',
    }
  })

  useEffect(() => {
    const onHashChange = () => {
      const next: ActiveToolTab = window.location.hash === '#qr' ? 'qr' : 'converter'
      setActiveTool(next)
      setMountedTools((prev) => (prev[next] ? prev : { ...prev, [next]: true }))
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  function handleSelectTool(tool: ActiveToolTab) {
    setActiveTool(tool)
    setMountedTools((prev) => (prev[tool] ? prev : { ...prev, [tool]: true }))
    if (window.location.hash !== `#${tool}`) {
      window.history.replaceState(null, '', `#${tool}`)
    }
  }

  return (
    <div className="min-h-dvh bg-[var(--bg-canvas)] text-[var(--ink-primary)]">
      <WorkbenchHeader activeTool={activeTool} onSelectTool={handleSelectTool} />

      <main className="mx-auto max-w-[1380px] px-4 py-5 sm:px-6">
        <Suspense fallback={workspaceFallback}>
          {mountedTools.converter ? (
            <div className={activeTool === 'converter' ? 'block' : 'hidden'}>
              <ConverterWorkspace />
            </div>
          ) : null}
          {mountedTools.qr ? (
            <div className={activeTool === 'qr' ? 'block' : 'hidden'}>
              <QrWorkspace />
            </div>
          ) : null}
        </Suspense>
      </main>
    </div>
  )
}
