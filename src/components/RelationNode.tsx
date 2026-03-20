import type { PersonNode, MahramResult } from '@/lib/types'
import { useAppStore } from '@/store'
import { getAvatarUrl } from '@/lib/avatar'

interface RelationNodeProps {
  node: PersonNode
  mahramResult: MahramResult
  onAddClick?: (nodeId: string, direction: 'up' | 'down' | 'side', e: React.MouseEvent) => void
  onEditClick?: (nodeId: string, e: React.MouseEvent) => void
  isActive?: boolean
}

function getMahramColor(result: MahramResult, gender?: string) {
  if (!result.isMahram) {
    // Spouse gets gender color
    if (result.label === 'Pasangan (Halal)') {
      return { badge: gender === 'male' ? '#4a90d9' : '#e87fa0', text: 'Pasangan (Halal)' }
    }
    return { badge: '#f44336', text: 'Bukan Mahram' }
  }
  switch (result.category) {
    case 'mahram_nasab':
      return { badge: '#4caf50', text: 'Mahram Nasab' }
    case 'mahram_susuan':
      return { badge: '#2196f3', text: 'Mahram Susuan' }
    case 'mahram_pernikahan':
      return { badge: '#eab308', text: 'Mahram Pernikahan' }
    case 'mahram_sementara':
      return { badge: '#ff9800', text: 'Mahram Sementara' }
    default:
      return { badge: '#f44336', text: 'Bukan Mahram' }
  }
}

function getHukumText(result: MahramResult): string {
  if (!result.isMahram && result.category === 'bukan_mahram') {
    return 'Boleh dinikahi'
  }
  switch (result.category) {
    case 'mahram_nasab':
    case 'mahram_susuan':
    case 'mahram_pernikahan':
      return 'Haram dinikahi selamanya'
    case 'mahram_sementara':
      return 'Haram dinikahi sementara'
    default:
      return ''
  }
}

export function RelationNode({ node, mahramResult, onAddClick, onEditClick, isActive }: RelationNodeProps) {
  const removeNode = useAppStore(s => s.removeNode)
  const userGender = useAppStore(s => s.userGender)
  const colors = getMahramColor(mahramResult, node.gender)

  const isMale = node.gender === 'male'
  const genderColor = isMale ? 'var(--color-male)' : 'var(--color-female)'
  const genderBg = isMale ? 'var(--color-male-light)' : 'var(--color-female-light)'

  const isSameGender = node.gender === userGender
  const isSpouse = node.relationType === 'wife' || node.relationType === 'husband'
  const showMahram = !isSameGender && !isSpouse

  return (
    <div className="relative group" style={{ width: 120 }}>
      {/* Action buttons (top-right): edit + delete */}
      <div className={`absolute -top-2 -right-2 z-10 flex gap-1 transition-opacity
        ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        {onEditClick && (
          <button
            onClick={(e) => { e.stopPropagation(); onEditClick(node.id, e) }}
            className="w-6 h-6 rounded-full bg-[var(--color-ink)] text-white text-[10px]
              flex items-center justify-center cursor-pointer border-2 border-white shadow-sm hover:scale-110"
          >
            ✎
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); removeNode(node.id) }}
          className="w-6 h-6 rounded-full bg-red-500 text-white text-xs
            flex items-center justify-center cursor-pointer border-2 border-white shadow-sm hover:scale-110"
        >
          ✕
        </button>
      </div>

      {/* Card — uniform box */}
      <div className="flex flex-col items-center">
        {/* Avatar box */}
        <div
          className="w-[120px] h-[80px] rounded-2xl border-2 flex items-center justify-center overflow-hidden"
          style={{
            backgroundColor: genderBg,
            borderColor: genderColor,
            boxShadow: `3px 3px 0px ${genderColor}40`,
          }}
        >
          <img
            src={getAvatarUrl(`${node.name}-${node.relationType}`, node.gender, node.avatarSeed)}
            alt={node.name}
            className="w-16 h-16 rounded-xl"
            draggable={false}
          />
        </div>

        {/* Name */}
        <div className="mt-2 max-w-[160px] font-[var(--font-doodle)] text-sm font-bold text-[var(--color-ink)] text-center leading-tight break-words">
          {node.name}
        </div>

        {/* Mahram info */}
        {showMahram ? (
          <div className="mt-1.5 max-w-[180px] flex flex-col items-center gap-1">
            {/* Badge */}
            <div
              className="px-2 py-0.5 rounded-lg text-[10px] font-bold text-center break-words leading-tight"
              style={{ backgroundColor: `${colors.badge}20`, color: colors.badge }}
            >
              {mahramResult.isMahram ? '✓' : '✗'} {colors.text}
            </div>

            {/* Hukum */}
            <div
              className="text-[10px] font-bold text-center leading-tight"
              style={{ color: colors.badge }}
            >
              {getHukumText(mahramResult)}
            </div>

            {/* Reason */}
            <div className="text-[9px] text-[var(--color-ink-light)] text-center leading-tight break-words">
              {mahramResult.reason}
            </div>

            {/* Condition */}
            {mahramResult.condition && (
              <div className="text-[9px] text-orange-600 italic text-center leading-tight break-words">
                * {mahramResult.condition}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-1 max-w-[160px] px-2 py-0.5 rounded-lg text-[10px] text-center break-words leading-tight" style={{ backgroundColor: genderBg, color: 'var(--color-ink-light)' }}>
            {isSpouse ? (isMale ? 'Suami' : 'Istri') : `Sesama ${isMale ? 'lk' : 'pr'}`}
          </div>
        )}
      </div>

      {/* Directional add buttons */}
      {onAddClick && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onAddClick(node.id, 'up', e) }}
            className={`absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full
              bg-[var(--color-ink)] text-white text-xs flex items-center justify-center
              transition-opacity cursor-pointer
              z-10 border-2 border-white shadow-sm hover:scale-110
              ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          >
            +
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onAddClick(node.id, 'down', e) }}
            className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full
              bg-[var(--color-ink)] text-white text-xs flex items-center justify-center
              transition-opacity cursor-pointer
              z-10 border-2 border-white shadow-sm hover:scale-110
              ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          >
            +
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onAddClick(node.id, 'side', e) }}
            className={`absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 rounded-full
              bg-[var(--color-ink)] text-white text-xs flex items-center justify-center
              transition-opacity cursor-pointer
              z-10 border-2 border-white shadow-sm hover:scale-110
              ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          >
            +
          </button>
        </>
      )}
    </div>
  )
}
