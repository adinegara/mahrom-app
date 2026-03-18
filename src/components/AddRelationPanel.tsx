import { useState, useMemo } from 'react'
import { useAppStore } from '@/store'
import { RELATION_OPTIONS, type RelationType } from '@/lib/types'

export function AddRelationPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedDirection, setSelectedDirection] = useState<'all' | 'up' | 'side' | 'down'>('all')
  const [customName, setCustomName] = useState('')
  const addRelation = useAppStore(s => s.addRelation)
  const userGender = useAppStore(s => s.userGender)

  const filteredOptions = useMemo(() => {
    let options = RELATION_OPTIONS

    // Filter out relations that don't make sense for the user's gender
    if (userGender === 'male') {
      options = options.filter(o => o.type !== 'husband')
    } else {
      options = options.filter(o => o.type !== 'wife')
    }

    if (selectedDirection !== 'all') {
      options = options.filter(o => o.direction === selectedDirection)
    }

    if (search) {
      const q = search.toLowerCase()
      options = options.filter(o =>
        o.label.toLowerCase().includes(q) ||
        o.labelId.toLowerCase().includes(q)
      )
    }

    return options
  }, [search, selectedDirection, userGender])

  const handleAdd = (type: RelationType) => {
    addRelation(type, customName || undefined)
    setCustomName('')
    setSearch('')
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[var(--color-ink)] text-white
          shadow-[3px_3px_0px_rgba(0,0,0,0.3)] border-2 border-[var(--color-ink)]
          flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-7 h-7">
          <path d="M12 5v14m-7-7h14" strokeLinecap="round" />
        </svg>
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 max-h-[70vh] bg-white rounded-2xl border-2 border-[var(--color-ink)]
      shadow-[4px_4px_0px_var(--color-ink)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-[var(--color-doodle-border)]">
        <h3 className="font-[var(--font-doodle)] text-xl font-bold">Tambah Relasi</h3>
        <button
          onClick={() => { setIsOpen(false); setSearch(''); setCustomName('') }}
          className="w-8 h-8 rounded-lg border-2 border-[var(--color-doodle-border)] flex items-center justify-center
            cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Custom name */}
      <div className="px-4 pt-3">
        <input
          type="text"
          value={customName}
          onChange={e => setCustomName(e.target.value)}
          placeholder="Nama (opsional)..."
          className="w-full px-3 py-2 border-2 border-[var(--color-doodle-border)] rounded-lg text-sm
            font-[var(--font-doodle)] focus:outline-none focus:border-[var(--color-ink)] bg-white"
        />
      </div>

      {/* Search */}
      <div className="px-4 pt-2">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari relasi..."
          className="w-full px-3 py-2 border-2 border-[var(--color-doodle-border)] rounded-lg text-sm
            focus:outline-none focus:border-[var(--color-ink)] bg-white"
        />
      </div>

      {/* Direction filter */}
      <div className="flex gap-1 px-4 pt-2">
        {([['all', 'Semua'], ['up', 'Atas ↑'], ['side', 'Samping ↔'], ['down', 'Bawah ↓']] as const).map(([dir, label]) => (
          <button
            key={dir}
            onClick={() => setSelectedDirection(dir)}
            className={`px-2 py-1 text-xs rounded-md border cursor-pointer transition-colors
              ${selectedDirection === dir
                ? 'bg-[var(--color-ink)] text-white border-[var(--color-ink)]'
                : 'border-[var(--color-doodle-border)] text-[var(--color-ink-light)] hover:bg-gray-50'
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Options list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
        {filteredOptions.map(option => (
          <button
            key={option.type}
            onClick={() => handleAdd(option.type)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 cursor-pointer
              transition-all hover:shadow-[2px_2px_0px] active:shadow-none text-left
              ${option.gender === 'male'
                ? 'border-[var(--color-male)]/30 hover:bg-[var(--color-male-light)] hover:shadow-[var(--color-male)]'
                : 'border-[var(--color-female)]/30 hover:bg-[var(--color-female-light)] hover:shadow-[var(--color-female)]'
              }`}
          >
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold
              ${option.gender === 'male' ? 'bg-[var(--color-male)]' : 'bg-[var(--color-female)]'}`}>
              {option.gender === 'male' ? '♂' : '♀'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-[var(--color-ink)] truncate">{option.labelId}</div>
              <div className="text-xs text-[var(--color-ink-light)] truncate">{option.label}</div>
            </div>
            <span className="text-xs text-[var(--color-ink-light)]">
              {option.direction === 'up' ? '↑' : option.direction === 'down' ? '↓' : '↔'}
            </span>
          </button>
        ))}
        {filteredOptions.length === 0 && (
          <div className="text-center text-[var(--color-ink-light)] text-sm py-4 font-[var(--font-doodle)]">
            Tidak ditemukan
          </div>
        )}
      </div>
    </div>
  )
}
