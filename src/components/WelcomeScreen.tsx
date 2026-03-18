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

const HeartIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
)

const StarIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
)

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
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
      <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none">
        <OrbitingCircles radius={280} speed={0.3} iconSize={40}>
          <HeartIcon />
          <StarIcon />
          <MoonIcon />
          <HeartIcon />
          <StarIcon />
          <MoonIcon />
        </OrbitingCircles>
        <OrbitingCircles radius={200} speed={0.5} reverse iconSize={30}>
          <MoonIcon />
          <StarIcon />
          <HeartIcon />
          <MoonIcon />
        </OrbitingCircles>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 p-8 max-w-md w-full">
        {/* Title */}
        <div className="text-center">
          <h1 className="font-[var(--font-doodle)] text-5xl font-bold text-[var(--color-ink)] mb-2">
            Mahrom App
          </h1>
          <p className="text-[var(--color-ink-light)] text-sm">
            Identifikasi hubungan mahram dalam Islam
          </p>
        </div>

        {/* Doodle illustration */}
        <div className="w-32 h-32 relative">
          <svg viewBox="0 0 120 120" className="w-full h-full">
            {/* Simple doodle person */}
            <circle cx="60" cy="35" r="18" fill="none" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M60 53 L60 80" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M60 62 L40 75" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M60 62 L80 75" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M60 80 L45 105" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M60 80 L75 105" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinecap="round" />
            {/* Question mark */}
            <text x="90" y="30" className="font-[var(--font-doodle)]" fontSize="24" fill="var(--color-ink-light)">?</text>
          </svg>
        </div>

        {/* Gender selection */}
        <div className="w-full">
          <label className="font-[var(--font-doodle)] text-xl text-[var(--color-ink)] block mb-3 text-center">
            Pilih jenis kelamin
          </label>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setGender('male')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl border-2 transition-all cursor-pointer font-medium
                ${gender === 'male'
                  ? 'bg-[var(--color-male-light)] border-[var(--color-male)] text-[var(--color-male)] shadow-[3px_3px_0px_var(--color-male)]'
                  : 'border-[var(--color-doodle-border)] hover:border-[var(--color-male)] text-[var(--color-ink-light)]'
                }`}
            >
              <MaleIcon /> Laki-laki
            </button>
            <button
              onClick={() => setGender('female')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl border-2 transition-all cursor-pointer font-medium
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
          className={`px-8 py-3 rounded-xl border-2 font-[var(--font-doodle)] text-xl transition-all cursor-pointer
            ${gender
              ? 'bg-[var(--color-ink)] text-white border-[var(--color-ink)] shadow-[3px_3px_0px_rgba(0,0,0,0.3)] hover:shadow-[1px_1px_0px_rgba(0,0,0,0.3)] active:shadow-none'
              : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
            }`}
        >
          Mulai Identifikasi
        </button>
      </div>
    </div>
  )
}
