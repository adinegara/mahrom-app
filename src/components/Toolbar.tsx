import { useMemo, useState } from 'react'
import { useAppStore } from '@/store'
import { RELATION_OPTIONS } from '@/lib/types'

type ListFilter = 'mahram' | 'nonMahram' | null

export function Toolbar() {
  const reset = useAppStore(s => s.reset)
  const nodes = useAppStore(s => s.nodes)
  const edges = useAppStore(s => s.edges)
  const userGender = useAppStore(s => s.userGender)
  const [open, setOpen] = useState(false)
  const [showList, setShowList] = useState<ListFilter>(null)

  const { mahramCount, nonMahramCount, mahramList, nonMahramList } = useMemo(() => {
    let mahram = 0
    let nonMahram = 0
    const mList: { name: string; relation: string }[] = []
    const nmList: { name: string; relation: string }[] = []

    for (const edge of edges) {
      const node = nodes.find(n => n.id === edge.toId)
      if (node && node.gender !== userGender && edge.relationType !== 'wife' && edge.relationType !== 'husband') {
        const option = RELATION_OPTIONS.find(o => o.type === edge.relationType)
        const relation = node.relationLabel || option?.labelId || edge.relationType
        if (edge.mahramResult.isMahram) {
          mahram++
          mList.push({ name: node.name, relation })
        } else {
          nonMahram++
          nmList.push({ name: node.name, relation })
        }
      }
    }
    return { mahramCount: mahram, nonMahramCount: nonMahram, mahramList: mList, nonMahramList: nmList }
  }, [edges, nodes, userGender])

  const toggleList = (filter: ListFilter) => {
    setShowList(prev => prev === filter ? null : filter)
  }

  return (
    <>
      {/* Toggle tab - only visible when collapsed */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed top-12 left-0 z-50 bg-white border-2 border-l-0 border-[var(--color-ink)] rounded-r-xl shadow-[2px_2px_0px_var(--color-ink)] px-2 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-[var(--color-ink)]">
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
          </svg>
        </button>
      )}

      {/* Backdrop overlay - click to close */}
      {open && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => { setOpen(false); setShowList(null) }}
        />
      )}

      {/* Sliding panel */}
      <div
        className={`fixed top-0 left-0 z-40 h-full w-56 bg-white/95 backdrop-blur-sm border-r-2 border-[var(--color-ink)] shadow-[3px_0px_0px_var(--color-ink)] transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col gap-3 px-4 pt-12 pb-4 h-full">
          {/* Logo */}
          <div className="px-2 py-3">
            <div className="flex items-center gap-2">
              <h1 className="font-[var(--font-doodle)] text-2xl font-bold text-[var(--color-ink)] leading-tight">Mahrom</h1>
              <span className="text-[9px] font-semibold uppercase tracking-wider bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md leading-none">beta</span>
            </div>
            <p className="text-[10px] text-[var(--color-ink-light)] -mt-0.5">bukan Muhrim</p>
          </div>

          {/* Stats */}
          {nodes.length > 0 && (
            <div className="border-t border-[var(--color-doodle-border)] pt-3 text-xs space-y-1">
              <button
                onClick={() => toggleList('mahram')}
                className={`flex items-center gap-1.5 w-full text-left cursor-pointer rounded px-2 py-1 transition-colors ${showList === 'mahram' ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}
              >
                <span className="w-2 h-2 rounded-full bg-[var(--color-mahram-yes)] shrink-0" />
                <span className="text-[var(--color-ink-light)]">Mahram: {mahramCount}</span>
                {mahramCount > 0 && (
                  <svg viewBox="0 0 20 20" fill="currentColor" className={`w-3 h-3 ml-auto text-[var(--color-ink-light)] transition-transform ${showList === 'mahram' ? 'rotate-180' : ''}`}>
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              {/* Mahram list */}
              {showList === 'mahram' && mahramList.length > 0 && (
                <div className="pl-5 space-y-1 max-h-36 overflow-y-auto">
                  {mahramList.map((item, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full mt-1 shrink-0 bg-[var(--color-mahram-yes)]" />
                      <div className="min-w-0">
                        <span className="text-[var(--color-ink)] font-medium block truncate">{item.name}</span>
                        <span className="text-[var(--color-ink-light)] block truncate">{item.relation}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => toggleList('nonMahram')}
                className={`flex items-center gap-1.5 w-full text-left cursor-pointer rounded px-2 py-1 transition-colors ${showList === 'nonMahram' ? 'bg-red-50' : 'hover:bg-gray-50'}`}
              >
                <span className="w-2 h-2 rounded-full bg-[var(--color-mahram-no)] shrink-0" />
                <span className="text-[var(--color-ink-light)]">Bukan: {nonMahramCount}</span>
                {nonMahramCount > 0 && (
                  <svg viewBox="0 0 20 20" fill="currentColor" className={`w-3 h-3 ml-auto text-[var(--color-ink-light)] transition-transform ${showList === 'nonMahram' ? 'rotate-180' : ''}`}>
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              {/* Non-mahram list */}
              {showList === 'nonMahram' && nonMahramList.length > 0 && (
                <div className="pl-5 space-y-1 max-h-36 overflow-y-auto">
                  {nonMahramList.map((item, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full mt-1 shrink-0 bg-[var(--color-mahram-no)]" />
                      <div className="min-w-0">
                        <span className="text-[var(--color-ink)] font-medium block truncate">{item.name}</span>
                        <span className="text-[var(--color-ink-light)] block truncate">{item.relation}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Reset */}
          <button
            onClick={() => { if (confirm('Reset semua data?')) reset() }}
            className="border-t border-[var(--color-doodle-border)] pt-3 px-2 py-2 text-xs text-red-400 hover:text-red-500 cursor-pointer transition-colors flex items-center gap-1.5"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" />
            </svg>
            Reset
          </button>

          {/* Credit */}
          <div className="flex flex-col items-center gap-0.5 text-[9px] text-[var(--color-ink-light)] px-2 pb-2">
            <span className="opacity-50">Created and crafted by</span>
            <a href="https://instagram.com/netizenz" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
              </svg>
              <span className="font-medium">@netizenz</span>
            </a>
            <span className="opacity-40 italic">DM me if you spot any mistakes</span>
          </div>
        </div>
      </div>
    </>
  )
}
