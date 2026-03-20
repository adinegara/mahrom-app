import { useState, useRef, useEffect, useMemo } from 'react'
import { useAppStore } from '@/store'
import { RELATION_OPTIONS, type RelationType } from '@/lib/types'
import { type BaseRelation, resolveRelation, resolveFosterRelation } from '@/lib/resolve'

interface NodeAddPopupProps {
  nodeId: string
  direction: 'up' | 'down' | 'side'
  x: number
  y: number
  onClose: () => void
}

/**
 * Family-chart pattern:
 *  up   → father / mother / foster_father / foster_mother
 *  side → husband / wife / foster_brother / foster_sister
 *  down → son / daughter / foster_son / foster_daughter
 */
const DIRECTION_BASES: Record<'up' | 'down' | 'side', { type: BaseRelation | 'foster_father' | 'foster_mother' | 'foster_son' | 'foster_daughter' | 'foster_brother' | 'foster_sister'; labelId: string; gender: 'male' | 'female'; isFoster?: boolean }[]> = {
  up: [
    { type: 'father', labelId: 'Bapak', gender: 'male' },
    { type: 'mother', labelId: 'Ibu', gender: 'female' },
    { type: 'foster_father', labelId: 'Bapak Susuan', gender: 'male', isFoster: true },
    { type: 'foster_mother', labelId: 'Ibu Susuan', gender: 'female', isFoster: true },
  ],
  side: [
    { type: 'husband', labelId: 'Suami', gender: 'male' },
    { type: 'wife', labelId: 'Istri', gender: 'female' },
    { type: 'foster_brother', labelId: 'Sdr Susuan (lk)', gender: 'male', isFoster: true },
    { type: 'foster_sister', labelId: 'Sdr Susuan (pr)', gender: 'female', isFoster: true },
  ],
  down: [
    { type: 'son', labelId: 'Anak Lk', gender: 'male' },
    { type: 'daughter', labelId: 'Anak Pr', gender: 'female' },
    { type: 'foster_son', labelId: 'Anak Susuan (lk)', gender: 'male', isFoster: true },
    { type: 'foster_daughter', labelId: 'Anak Susuan (pr)', gender: 'female', isFoster: true },
  ],
}

export function NodeAddPopup({ nodeId, direction, x, y, onClose }: NodeAddPopupProps) {
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

  const parentRelationType = useMemo(() => {
    if (nodeId === 'user') return null
    const node = nodes.find(n => n.id === nodeId)
    return node?.relationType ?? null
  }, [nodeId, nodes])

  // Resolve base relations for this direction into actual relation types
  const options = useMemo(() => {
    const bases = DIRECTION_BASES[direction]

    return bases
      .filter(b => {
        // Filter out inappropriate spouse options based on user gender
        if (direction === 'side') {
          if (userGender === 'male' && b.type === 'husband') return false
          if (userGender === 'female' && b.type === 'wife') return false
        }
        return true
      })
      .map(b => {
        let resolvedType: RelationType
        let resolvedLabelId: string

        if (b.isFoster) {
          // Foster relations are universal — resolve based on parent node type
          resolvedType = resolveFosterRelation(parentRelationType, b.type as 'foster_father' | 'foster_mother' | 'foster_son' | 'foster_daughter' | 'foster_brother' | 'foster_sister')
          const opt = RELATION_OPTIONS.find(o => o.type === resolvedType)
          resolvedLabelId = opt?.labelId ?? b.labelId
        } else if (!parentRelationType) {
          // From user node — base relation is the direct relation
          resolvedType = b.type as RelationType
          resolvedLabelId = b.labelId
        } else {
          const resolved = resolveRelation(parentRelationType, b.type as BaseRelation, userGender ?? undefined)
          // Fall back to base type when no mapping exists
          resolvedType = resolved ?? b.type as RelationType
          const opt = RELATION_OPTIONS.find(o => o.type === resolvedType)
          resolvedLabelId = opt?.labelId ?? b.labelId
        }

        return {
          baseType: b.type,
          baseLabelId: b.labelId,
          resolvedType,
          resolvedLabelId,
          gender: b.gender,
          isFoster: b.isFoster,
        }
      })
      .filter((o): o is NonNullable<typeof o> => o !== null)
  }, [direction, userGender, parentRelationType])

  const handleAdd = (resolvedType: RelationType) => {
    if (nodeId === 'user') {
      addRelation(resolvedType, customName || undefined)
    } else {
      addRelationToNode(nodeId, resolvedType, customName || undefined)
    }
    onClose()
  }

  // Position popup near the button, clamped to viewport
  const popupW = 240
  const popupH = 280
  const left = Math.min(Math.max(x - popupW / 2, 8), window.innerWidth - popupW - 8)
  const top = Math.min(Math.max(y, 8), window.innerHeight - popupH - 8)

  const dirLabel = direction === 'up' ? 'Orang Tua' : direction === 'down' ? 'Anak' : 'Pasangan'

  return (
    <div ref={popupRef}
      className="fixed z-[100] w-[220px] bg-white rounded-2xl border-2 border-[var(--color-ink)]
        shadow-[4px_4px_0px_var(--color-ink)] flex flex-col overflow-hidden"
      style={{ left, top }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-doodle-border)]">
        <span className="font-[var(--font-doodle)] text-sm font-bold text-[var(--color-ink)]">
          + {dirLabel}
        </span>
        <button
          onClick={onClose}
          className="w-5 h-5 rounded-md border border-[var(--color-doodle-border)] flex items-center justify-center
            cursor-pointer hover:bg-gray-50 text-[10px] text-[var(--color-ink-light)]"
        >
          ✕
        </button>
      </div>

      {/* Name input */}
      <div className="px-3 pt-2">
        <input
          type="text"
          value={customName}
          onChange={e => setCustomName(e.target.value)}
          placeholder="Nama (opsional)..."
          autoFocus
          className="w-full px-2 py-1.5 border-2 border-[var(--color-doodle-border)] rounded-lg text-xs
            font-[var(--font-doodle)] focus:outline-none focus:border-[var(--color-ink)] bg-white"
        />
      </div>

      {/* Options — simple 2 buttons */}
      <div className="p-3 flex flex-col gap-2 max-h-[200px] overflow-y-auto">
        {options.map(option => (
          <button
            key={option.resolvedType}
            onClick={() => handleAdd(option.resolvedType)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 cursor-pointer
              transition-all hover:shadow-[2px_2px_0px] active:shadow-none text-left
              ${option.gender === 'male'
                ? 'border-[var(--color-male)]/40 hover:bg-[var(--color-male-light)] hover:shadow-[var(--color-male)]'
                : 'border-[var(--color-female)]/40 hover:bg-[var(--color-female-light)] hover:shadow-[var(--color-female)]'
              }`}
          >
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0
              ${option.gender === 'male' ? 'bg-[var(--color-male)]' : 'bg-[var(--color-female)]'}`}>
              {option.gender === 'male' ? '♂' : '♀'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-[var(--font-doodle)] font-bold text-sm text-[var(--color-ink)]">
                  {option.baseLabelId}
                </span>
                {option.isFoster && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-blue-100 text-blue-700">
                    SUSUAN
                  </span>
                )}
              </div>
              {parentRelationType && (
                <div className="text-[10px] text-[var(--color-ink-light)] truncate">
                  → {option.resolvedLabelId}
                </div>
              )}
            </div>
          </button>
        ))}
        {options.length === 0 && (
          <div className="text-center text-[var(--color-ink-light)] text-xs py-2 font-[var(--font-doodle)]">
            Tidak tersedia
          </div>
        )}
      </div>
    </div>
  )
}
