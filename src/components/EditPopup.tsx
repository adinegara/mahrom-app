import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '@/store'
import { getAvatarUrl } from '@/lib/avatar'

interface EditPopupProps {
  nodeId: string
  x: number
  y: number
  onClose: () => void
}

export function EditPopup({ nodeId, x, y, onClose }: EditPopupProps) {
  const node = useAppStore(s => s.nodes.find(n => n.id === nodeId))
  const userName = useAppStore(s => s.userName)
  const userGender = useAppStore(s => s.userGender)
  const userAvatarSeed = useAppStore(s => s.userAvatarSeed)
  const updateNodeName = useAppStore(s => s.updateNodeName)
  const updateAvatarSeed = useAppStore(s => s.updateAvatarSeed)
  const removeNode = useAppStore(s => s.removeNode)

  const isUser = nodeId === 'user'
  const [name, setName] = useState(isUser ? userName : (node?.name || ''))
  const inputRef = useRef<HTMLInputElement>(null)

  // Current avatar seed for preview
  const currentSeed = isUser
    ? (userAvatarSeed || userName || 'Saya')
    : (node?.avatarSeed || `${node?.name}-${node?.relationType}`)
  const currentGender = isUser ? (userGender ?? undefined) : node?.gender

  const [previewSeed, setPreviewSeed] = useState(currentSeed)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const shuffleAvatar = () => {
    const newSeed = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setPreviewSeed(newSeed)
    updateAvatarSeed(nodeId, newSeed)
  }

  const handleSave = () => {
    if (isUser) {
      onClose()
      return
    }
    if (name.trim()) {
      updateNodeName(nodeId, name.trim())
    }
    onClose()
  }

  const handleDelete = () => {
    if (!isUser) {
      removeNode(nodeId)
    }
    onClose()
  }

  // Position the popup, clamping to viewport
  const popupWidth = 240
  const popupHeight = 260
  const left = Math.min(x, window.innerWidth - popupWidth - 16)
  const top = Math.min(y + 10, window.innerHeight - popupHeight - 16)

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Popup */}
      <div
        className="fixed z-50 bg-white rounded-2xl border-2 border-[var(--color-ink)] shadow-[4px_4px_0px_var(--color-ink)] p-4"
        style={{ left, top, width: popupWidth }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="font-[var(--font-doodle)] text-sm font-bold text-[var(--color-ink)]">
            Edit
          </span>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-[var(--color-ink-light)] text-white text-xs flex items-center justify-center cursor-pointer hover:bg-[var(--color-ink)]"
          >
            x
          </button>
        </div>

        {/* Avatar preview + shuffle */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-16 h-16 rounded-xl border-2 overflow-hidden shrink-0"
            style={{
              borderColor: currentGender === 'male' ? 'var(--color-male)' : 'var(--color-female)',
              backgroundColor: currentGender === 'male' ? 'var(--color-male-light)' : 'var(--color-female-light)',
            }}
          >
            <img
              src={getAvatarUrl('', currentGender, previewSeed)}
              alt="Avatar"
              className="w-full h-full"
              draggable={false}
            />
          </div>
          <button
            onClick={shuffleAvatar}
            className="flex-1 py-2 rounded-xl border-2 border-[var(--color-doodle-border)]
              font-[var(--font-doodle)] text-sm text-[var(--color-ink)] cursor-pointer
              hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            🎲 Ganti Avatar
          </button>
        </div>

        {/* Name input */}
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') onClose()
          }}
          className="w-full px-3 py-2 rounded-xl border-2 border-[var(--color-ink)] font-[var(--font-doodle)] text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)] mb-3"
          placeholder="Nama..."
          readOnly={isUser}
        />

        <div className="flex gap-2">
          {!isUser && (
            <button
              onClick={handleSave}
              className="flex-1 py-1.5 rounded-xl bg-[var(--color-primary)] text-white font-[var(--font-doodle)] text-sm font-bold cursor-pointer hover:opacity-90"
            >
              Simpan
            </button>
          )}
          {!isUser && (
            <button
              onClick={handleDelete}
              className="py-1.5 px-3 rounded-xl bg-red-100 text-red-600 font-[var(--font-doodle)] text-sm font-bold cursor-pointer hover:bg-red-200"
            >
              Hapus
            </button>
          )}
        </div>
      </div>
    </>
  )
}
