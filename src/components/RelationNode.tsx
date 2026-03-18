import type { PersonNode, MahramResult } from '@/lib/types'
import { useAppStore } from '@/store'

interface RelationNodeProps {
  node: PersonNode
  mahramResult: MahramResult
  onAddClick?: (nodeId: string, direction: 'up' | 'down' | 'side', e: React.MouseEvent) => void
}

function getMahramColor(result: MahramResult) {
  if (!result.isMahram) return { bg: '#fef2f2', border: '#f44336', badge: '#f44336', text: 'Bukan Mahram' }
  switch (result.category) {
    case 'mahram_nasab':
      return { bg: '#f0fdf4', border: '#4caf50', badge: '#4caf50', text: 'Mahram Nasab' }
    case 'mahram_susuan':
      return { bg: '#f0f9ff', border: '#2196f3', badge: '#2196f3', text: 'Mahram Sesusuan' }
    case 'mahram_pernikahan':
      return { bg: '#fefce8', border: '#eab308', badge: '#eab308', text: 'Mahram Pernikahan' }
    case 'mahram_sementara':
      return { bg: '#fff7ed', border: '#ff9800', badge: '#ff9800', text: 'Mahram Sementara' }
    default:
      return { bg: '#fef2f2', border: '#f44336', badge: '#f44336', text: 'Bukan Mahram' }
  }
}

export function RelationNode({ node, mahramResult, onAddClick }: RelationNodeProps) {
  const removeNode = useAppStore(s => s.removeNode)
  const userGender = useAppStore(s => s.userGender)
  const colors = getMahramColor(mahramResult)

  const isMale = node.gender === 'male'
  const genderColor = isMale ? 'var(--color-male)' : 'var(--color-female)'

  // Hide mahram status when relation is same gender as user or is spouse
  const isSameGender = node.gender === userGender
  const isSpouse = node.relationType === 'wife' || node.relationType === 'husband'

  return (
    <div
      className="relative group"
      style={{ minWidth: 140 }}
    >
      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); removeNode(node.id) }}
        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs
          flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity
          cursor-pointer z-10 border-2 border-white shadow-sm"
      >
        x
      </button>

      {/* Card */}
      <div
        className="rounded-2xl border-2 p-3 transition-shadow hover:shadow-lg relative overflow-hidden"
        style={{
          backgroundColor: isSameGender || isSpouse ? '#f9fafb' : colors.bg,
          borderColor: genderColor,
          boxShadow: `3px 3px 0px ${genderColor}40`,
        }}
      >
        {/* Gender indicator strip */}
        <div
          className="absolute top-0 left-0 w-full h-1"
          style={{ backgroundColor: genderColor }}
        />

        {/* Avatar placeholder */}
        <div className="flex items-center gap-2 mb-2 mt-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: genderColor }}
          >
            {isMale ? '♂' : '♀'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-[var(--font-doodle)] text-base font-bold text-[var(--color-ink)] truncate">
              {node.name}
            </div>
          </div>
        </div>

        {isSameGender || isSpouse ? (
          /* Same gender or spouse — no mahram status needed */
          <div className="rounded-lg px-2 py-1 text-center bg-gray-100">
            <div className="font-[var(--font-doodle)] text-sm text-[var(--color-ink-light)]">
              {isSpouse ? (isMale ? 'Suami' : 'Istri') : `Sesama ${isMale ? 'laki-laki' : 'perempuan'}`}
            </div>
          </div>
        ) : (
          <>
            {/* Mahram badge */}
            <div
              className="rounded-lg px-2 py-1 text-center"
              style={{ backgroundColor: `${colors.badge}20` }}
            >
              <div
                className="font-[var(--font-doodle)] text-sm font-bold"
                style={{ color: colors.badge }}
              >
                {mahramResult.isMahram ? '✓ ' : '✗ '}{colors.text}
              </div>
            </div>

            {/* Reason */}
            <div className="mt-1.5 text-[10px] text-[var(--color-ink-light)] leading-tight line-clamp-2">
              {mahramResult.reason}
            </div>

            {/* Condition */}
            {mahramResult.condition && (
              <div className="mt-1 text-[10px] text-orange-600 italic leading-tight">
                * {mahramResult.condition}
              </div>
            )}
          </>
        )}
      </div>
      {/* Directional add buttons */}
      {onAddClick && (
        <>
          {/* Top — parents/up */}
          <button
            onClick={(e) => { e.stopPropagation(); onAddClick(node.id, 'up', e) }}
            className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full
              bg-[var(--color-ink)] text-white text-xs flex items-center justify-center
              opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer
              z-10 border-2 border-white shadow-sm hover:scale-110"
          >
            +
          </button>
          {/* Bottom — children/down */}
          <button
            onClick={(e) => { e.stopPropagation(); onAddClick(node.id, 'down', e) }}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full
              bg-[var(--color-ink)] text-white text-xs flex items-center justify-center
              opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer
              z-10 border-2 border-white shadow-sm hover:scale-110"
          >
            +
          </button>
          {/* Right — siblings/side */}
          <button
            onClick={(e) => { e.stopPropagation(); onAddClick(node.id, 'side', e) }}
            className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 rounded-full
              bg-[var(--color-ink)] text-white text-xs flex items-center justify-center
              opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer
              z-10 border-2 border-white shadow-sm hover:scale-110"
          >
            +
          </button>
        </>
      )}
    </div>
  )
}
