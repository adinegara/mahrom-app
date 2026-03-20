import { useState } from 'react'
import { useAppStore } from '@/store'
import type { Gender } from '@/lib/types'
import { OrbitingCircles } from './OrbitingCircles'

const MaleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={2}>
    <circle cx="10" cy="14" r="5" />
    <path d="M15 9l5-5m0 0h-4m4 0v4" />
  </svg>
)

const FemaleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="9" r="5" />
    <path d="M12 14v7m-3-3h6" />
  </svg>
)

const AVATAR_SEEDS = ['Ahmad', 'Fatimah', 'Umar', 'Khadijah', 'Ali', 'Aisyah', 'Hasan', 'Zainab', 'Ibrahim', 'Maryam']

const Avatar = ({ seed }: { seed: string }) => (
  <img
    src={`https://api.dicebear.com/9.x/notionists/svg?seed=${seed}`}
    alt=""
    className="w-full h-full rounded-full"
  />
)

export function WelcomeScreen() {
  const [gender, setGender] = useState<Gender | null>(null)
  const [name, setName] = useState('')
  const setUserProfile = useAppStore(s => s.setUserProfile)

  const handleStart = () => {
    if (!gender) return
    setUserProfile(gender, name)
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[var(--color-canvas)]">
      {/* Orbiting decoration */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none scale-[0.65] sm:scale-75 md:scale-100">
        <OrbitingCircles radius={340} speed={0.3} iconSize={56} beamColor="#4a90d9">
          <Avatar seed={AVATAR_SEEDS[0]} />
          <Avatar seed={AVATAR_SEEDS[1]} />
          <Avatar seed={AVATAR_SEEDS[2]} />
          <Avatar seed={AVATAR_SEEDS[3]} />
          <Avatar seed={AVATAR_SEEDS[4]} />
          <Avatar seed={AVATAR_SEEDS[5]} />
        </OrbitingCircles>
        <OrbitingCircles radius={240} speed={0.5} reverse iconSize={48} beamColor="#e87fa0">
          <Avatar seed={AVATAR_SEEDS[6]} />
          <Avatar seed={AVATAR_SEEDS[7]} />
          <Avatar seed={AVATAR_SEEDS[8]} />
          <Avatar seed={AVATAR_SEEDS[9]} />
        </OrbitingCircles>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 p-8 max-w-md w-full">
        {/* Title */}
        <div className="text-center">
          <h1 className="font-[var(--font-doodle)] text-3xl font-bold text-[var(--color-ink)] mb-2">
            Mahrom App
          </h1>
          <p className="text-[var(--color-ink-light)] text-sm">
            Identifikasi hubungan mahram dalam Islam
          </p>
        </div>

        {/* Notionists illustration */}
        <div className="w-32 h-32 relative">
          <img
            src="https://api.dicebear.com/9.x/notionists/svg?seed=mahrom&backgroundColor=transparent"
            alt="Mahrom"
            className="w-full h-full"
          />
        </div>

        {/* Gender selection */}
        <div className="w-full">
          <label className="font-[var(--font-doodle)] text-xl text-[var(--color-ink)] block mb-3 text-center">
            Pilih jenis kelamin
          </label>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setGender('male')}
              style={{ padding: '14px 24px' }}
              className={`flex items-center justify-center gap-2 rounded-xl border-2 transition-all cursor-pointer font-medium text-sm w-40
                ${gender === 'male'
                  ? 'bg-[var(--color-male-light)] border-[var(--color-male)] text-[var(--color-male)] shadow-[3px_3px_0px_var(--color-male)]'
                  : 'border-[var(--color-doodle-border)] hover:border-[var(--color-male)] text-[var(--color-ink-light)]'
                }`}
            >
              <MaleIcon /> Laki-laki
            </button>
            <button
              onClick={() => setGender('female')}
              style={{ padding: '14px 24px' }}
              className={`flex items-center justify-center gap-2 rounded-xl border-2 transition-all cursor-pointer font-medium text-sm w-40
                ${gender === 'female'
                  ? 'bg-[var(--color-female-light)] border-[var(--color-female)] text-[var(--color-female)] shadow-[3px_3px_0px_var(--color-female)]'
                  : 'border-[var(--color-doodle-border)] hover:border-[var(--color-female)] text-[var(--color-ink-light)]'
                }`}
            >
              <FemaleIcon /> Perempuan
            </button>
          </div>
        </div>

        {/* Name input */}
        <div className="w-full">
          <label className="font-[var(--font-doodle)] text-xl text-[var(--color-ink)] block mb-2 text-center">
            Nama (opsional)
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Masukkan nama..."
            className="w-full px-4 py-3 border-2 border-[var(--color-doodle-border)] rounded-xl text-center
              font-[var(--font-doodle)] text-lg focus:outline-none focus:border-[var(--color-ink)]
              bg-white transition-colors placeholder:text-[var(--color-doodle-border)]"
          />
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={!gender}
          style={{ padding: '16px 40px' }}
          className={`rounded-xl border-2 font-[var(--font-doodle)] text-xl transition-all cursor-pointer
            ${gender
              ? 'bg-[var(--color-ink)] text-white border-[var(--color-ink)] shadow-[3px_3px_0px_rgba(0,0,0,0.3)] hover:shadow-[1px_1px_0px_rgba(0,0,0,0.3)] active:shadow-none'
              : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
            }`}
        >
          Mulai Identifikasi
        </button>

        {/* Credit */}
        <div className="flex flex-col items-center gap-1 text-[10px] text-[var(--color-ink-light)]">
          <span className="opacity-50">Created and crafted by</span>
          <a href="https://instagram.com/netizenz" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
            </svg>
            <span className="font-medium">@netizenz</span>
          </a>
          <span className="opacity-40 italic">DM me if you spot any mistakes</span>
        </div>
      </div>
    </div>
  )
}
