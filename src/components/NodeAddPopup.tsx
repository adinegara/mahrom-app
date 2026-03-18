import { useState, useMemo, useRef, useEffect } from 'react'
import { useAppStore } from '@/store'
import { RELATION_OPTIONS, type RelationType } from '@/lib/types'
import { BASE_RELATIONS, resolveRelation } from '@/lib/resolve'

interface NodeAddPopupProps {
  nodeId: string
  direction: 'up' | 'down' | 'side'
  x: number
  y: number
  onClose: () => void
}

export function NodeAddPopup({ nodeId, direction, x, y, onClose }: NodeAddPopupProps) {
  const [search, setSearch] = useState('')
  const [customName, setCustomName] = useState('')
  const popupRef = useRef<HTMLDivElement>(null)
  const addRelation = useAppStore(s => s.addRelation)
  const addRelationToNode = useAppStore(s => s.addRelationToNode)
  const userGender = useAppStore(s => s.userGender)
  const nodes = useAppStore(s => s.nodes)

  // Click-away handler
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handler)
    }
  }, [onClose])

  // Get the parent node's relation type to the user
  const parentRelationType = useMemo(() => {
    if (nodeId === 'user') return null
    const node = nodes.find(n => n.id === nodeId)
    return node?.relationType ?? null
  }, [nodeId, nodes])

  const resolvedOptions = useMemo(() => {
    // Filter base relations by direction
    let bases = BASE_RELATIONS.filter(b => b.direction === direction)

    // Gender filter
    if (userGender === 'male') {
      bases = bases.filter(b => b.type !== 'husband')
    } else {
      bases = bases.filter(b => b.type !== 'wife')
    }

    const results: {
      baseLabel: string
      baseLabelId: string
      resolvedType: RelationType
      resolvedLabel: string
      resolvedLabelId: string
      gender: 'male' | 'female'
    }[] = []

    for (const base of bases) {
      let resolvedType: RelationType

      if (!parentRelationType) {
        // From user node — base relation is the direct relation
        resolvedType = base.type as RelationType
      } else {
        const resolved = resolveRelation(parentRelationType, base.type)
        if (!resolved) continue // skip unresolvable combinations
        resolvedType = resolved
      }

      const resolvedOption = RELATION_OPTIONS.find(o => o.type === resolvedType)
      if (!resolvedOption) continue

      results.push({
        baseLabel: base.label,
        baseLabelId: base.labelId,
        resolvedType,
        resolvedLabel: resolvedOption.label,
        resolvedLabelId: resolvedOption.labelId,
        gender: resolvedOption.gender,
      })
    }

    // Apply search filter
    if (search) {
      const q = search.toLowerCase()
      return results.filter(r =>
        r.resolvedLabel.toLowerCase().includes(q) ||
        r.resolvedLabelId.toLowerCase().includes(q) ||
        r.baseLabel.toLowerCase().includes(q) ||
        r.baseLabelId.toLowerCase().includes(q)
      )
    }

    return results
  }, [direction, userGender, parentRelationType, search])

  const handleAdd = (resolvedType: RelationType) => {
    if (nodeId === 'user') {
      addRelation(resolvedType, customName || undefined)
    } else {
      // Connect to the clicked parent node with the resolved type
      // e.g. clicking "daughter" on father → creates sister node connected to father
      addRelationToNode(nodeId, resolvedType, customName || undefined)
    }
    onClose()
  }

  const style: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(x, window.innerWidth - 300),
    top: Math.min(y, window.innerHeight - 400),
    zIndex: 100,
  }

  return (
    <div ref={popupRef} style={style}
      className="w-72 max-h-[60vh] bg-white rounded-2xl border-2 border-[var(--color-ink)]
        shadow-[4px_4px_0px_var(--color-ink)] flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b-2 border-[var(--color-doodle-border)]">
        <span className="font-[var(--font-doodle)] text-sm font-bold">
          Tambah {direction === 'up' ? '↑ Atas' : direction === 'down' ? '↓ Bawah' : '↔ Samping'}
        </span>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-md border border-[var(--color-doodle-border)] flex items-center justify-center
            cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Name input */}
      <div className="px-3 pt-2">
        <input
          type="text"
          value={customName}
          onChange={e => setCustomName(e.target.value)}
          placeholder="Nama (opsional)..."
          className="w-full px-2 py-1.5 border-2 border-[var(--color-doodle-border)] rounded-lg text-xs
            font-[var(--font-doodle)] focus:outline-none focus:border-[var(--color-ink)] bg-white"
        />
      </div>

      {/* Search */}
      <div className="px-3 pt-1.5">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari..."
          autoFocus
          className="w-full px-2 py-1.5 border-2 border-[var(--color-doodle-border)] rounded-lg text-xs
            focus:outline-none focus:border-[var(--color-ink)] bg-white"
        />
      </div>

      {/* Options */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {resolvedOptions.map(option => (
          <button
            key={option.resolvedType}
            onClick={() => handleAdd(option.resolvedType)}
            className={`w-full flex items-center gap-2 px-2 py-2 rounded-xl border-2 cursor-pointer
              transition-all hover:shadow-[2px_2px_0px] active:shadow-none text-left
              ${option.gender === 'male'
                ? 'border-[var(--color-male)]/30 hover:bg-[var(--color-male-light)] hover:shadow-[var(--color-male)]'
                : 'border-[var(--color-female)]/30 hover:bg-[var(--color-female-light)] hover:shadow-[var(--color-female)]'
              }`}
          >
            <span className={`w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0
              ${option.gender === 'male' ? 'bg-[var(--color-male)]' : 'bg-[var(--color-female)]'}`}>
              {option.gender === 'male' ? '♂' : '♀'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-xs text-[var(--color-ink)] truncate">
                {option.baseLabelId}
              </div>
              {parentRelationType ? (
                <div className="text-[10px] text-[var(--color-ink-light)] truncate">
                  → {option.resolvedLabelId}
                </div>
              ) : (
                <div className="text-[10px] text-[var(--color-ink-light)] truncate">
                  {option.resolvedLabel}
                </div>
              )}
            </div>
          </button>
        ))}
        {resolvedOptions.length === 0 && (
          <div className="text-center text-[var(--color-ink-light)] text-xs py-3 font-[var(--font-doodle)]">
            Tidak ada relasi tersedia
          </div>
        )}
      </div>
    </div>
  )
}
