import { useMemo } from 'react'
import { useAppStore } from '@/store'

export function Toolbar() {
  const zoom = useAppStore(s => s.zoom)
  const setZoom = useAppStore(s => s.setZoom)
  const setCanvasOffset = useAppStore(s => s.setCanvasOffset)
  const reset = useAppStore(s => s.reset)
  const nodes = useAppStore(s => s.nodes)
  const edges = useAppStore(s => s.edges)
  const userGender = useAppStore(s => s.userGender)

  // Only count opposite-gender relations for mahram stats
  const { mahramCount, nonMahramCount } = useMemo(() => {
    let mahram = 0
    let nonMahram = 0
    for (const edge of edges) {
      const node = nodes.find(n => n.id === edge.toId)
      if (node && node.gender !== userGender && edge.relationType !== 'wife' && edge.relationType !== 'husband') {
        if (edge.mahramResult.isMahram) mahram++
        else nonMahram++
      }
    }
    return { mahramCount: mahram, nonMahramCount: nonMahram }
  }, [edges, nodes, userGender])

  return (
    <div className="fixed top-4 left-4 z-40 flex flex-col gap-2">
      {/* Title */}
      <div className="bg-white rounded-xl border-2 border-[var(--color-ink)] shadow-[3px_3px_0px_var(--color-ink)] px-4 py-2">
        <h1 className="font-[var(--font-doodle)] text-xl font-bold text-[var(--color-ink)]">Mahrom</h1>
      </div>

      {/* Stats */}
      {nodes.length > 0 && (
        <div className="bg-white rounded-xl border-2 border-[var(--color-doodle-border)] shadow-[2px_2px_0px_var(--color-doodle-border)] px-3 py-2 text-xs space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--color-mahram-yes)]" />
            <span className="text-[var(--color-ink-light)]">Mahram: {mahramCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--color-mahram-no)]" />
            <span className="text-[var(--color-ink-light)]">Bukan: {nonMahramCount}</span>
          </div>
        </div>
      )}

      {/* Zoom controls */}
      <div className="bg-white rounded-xl border-2 border-[var(--color-doodle-border)] shadow-[2px_2px_0px_var(--color-doodle-border)] flex flex-col">
        <button
          onClick={() => setZoom(zoom + 0.15)}
          className="px-3 py-2 text-[var(--color-ink)] hover:bg-gray-50 cursor-pointer rounded-t-lg transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path d="M12 5v14m-7-7h14" strokeLinecap="round" />
          </svg>
        </button>
        <div className="px-3 py-1 text-center text-[10px] text-[var(--color-ink-light)] border-y border-[var(--color-doodle-border)]">
          {Math.round(zoom * 100)}%
        </div>
        <button
          onClick={() => setZoom(zoom - 0.15)}
          className="px-3 py-2 text-[var(--color-ink)] hover:bg-gray-50 cursor-pointer rounded-b-lg transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path d="M5 12h14" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Reset view */}
      <button
        onClick={() => setCanvasOffset(0, 0)}
        className="bg-white rounded-xl border-2 border-[var(--color-doodle-border)] shadow-[2px_2px_0px_var(--color-doodle-border)]
          px-3 py-2 text-xs text-[var(--color-ink-light)] hover:bg-gray-50 cursor-pointer transition-colors"
        title="Reset view"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4m0 12v4m-10-10h4m12 0h4" strokeLinecap="round" />
        </svg>
      </button>

      {/* Reset all */}
      <button
        onClick={() => { if (confirm('Reset semua data?')) reset() }}
        className="bg-white rounded-xl border-2 border-red-200 shadow-[2px_2px_0px_rgba(244,67,54,0.2)]
          px-3 py-2 text-xs text-red-400 hover:bg-red-50 cursor-pointer transition-colors"
        title="Reset semua"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}
