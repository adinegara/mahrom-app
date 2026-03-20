import type { Gender } from './types'

const API_BASE = 'https://api.dicebear.com/9.x'
const DEFAULT_STYLE = 'adventurer'

/** All available DiceBear styles */
export const AVATAR_STYLES: { value: string; label: string }[] = [
  // Character styles
  { value: 'adventurer', label: 'Adventurer' },
  { value: 'adventurer-neutral', label: 'Adventurer Neutral' },
  { value: 'avataaars', label: 'Avataaars' },
  { value: 'avataaars-neutral', label: 'Avataaars Neutral' },
  { value: 'big-ears', label: 'Big Ears' },
  { value: 'big-ears-neutral', label: 'Big Ears Neutral' },
  { value: 'big-smile', label: 'Big Smile' },
  { value: 'bottts', label: 'Bottts' },
  { value: 'bottts-neutral', label: 'Bottts Neutral' },
  { value: 'croodles', label: 'Croodles' },
  { value: 'croodles-neutral', label: 'Croodles Neutral' },
  { value: 'dylan', label: 'Dylan' },
  { value: 'fun-emoji', label: 'Fun Emoji' },
  { value: 'lorelei', label: 'Lorelei' },
  { value: 'lorelei-neutral', label: 'Lorelei Neutral' },
  { value: 'micah', label: 'Micah' },
  { value: 'miniavs', label: 'Miniavs' },
  { value: 'notionists', label: 'Notionists' },
  { value: 'notionists-neutral', label: 'Notionists Neutral' },
  { value: 'open-peeps', label: 'Open Peeps' },
  { value: 'personas', label: 'Personas' },
  { value: 'pixel-art', label: 'Pixel Art' },
  { value: 'pixel-art-neutral', label: 'Pixel Art Neutral' },
  // Minimalist styles
  { value: 'glass', label: 'Glass' },
  { value: 'icons', label: 'Icons' },
  { value: 'identicon', label: 'Identicon' },
  { value: 'initials', label: 'Initials' },
  { value: 'rings', label: 'Rings' },
  { value: 'shapes', label: 'Shapes' },
  { value: 'thumbs', label: 'Thumbs' },
]

/** Avatar options — style + seed + any style-specific params */
export interface AvatarOptions {
  style?: string
  seed?: string
  flip?: boolean
  [key: string]: unknown
}

/**
 * Parse stored avatar data — could be a JSON options string or a simple seed string.
 */
export function parseAvatarData(data: string | undefined): AvatarOptions | null {
  if (!data) return null
  try {
    const parsed = JSON.parse(data)
    if (typeof parsed === 'object' && parsed !== null) return parsed as AvatarOptions
  } catch (_e) {
    // Not JSON — treat as seed string
  }
  return { seed: data }
}

/**
 * Build a DiceBear avatar URL from options.
 * Passes through all options as query params (works for any style).
 */
export function buildAvatarUrl(options: AvatarOptions): string {
  const style = (options.style as string) || DEFAULT_STYLE
  const params = new URLSearchParams()

  const skipKeys = new Set(['style'])

  for (const [key, val] of Object.entries(options)) {
    if (skipKeys.has(key)) continue
    if (val === undefined || val === null || val === '') continue
    if (typeof val === 'boolean') {
      if (val) params.set(key, 'true')
    } else if (Array.isArray(val)) {
      if (val.length > 0) params.set(key, val.join(','))
    } else {
      params.set(key, String(val))
    }
  }

  return `${API_BASE}/${style}/svg?${params.toString()}`
}

/**
 * Generate a DiceBear avatar URL for a person.
 * Supports both legacy seed strings and new AvatarOptions JSON.
 */
export function getAvatarUrl(defaultSeed: string, gender?: Gender, avatarSeed?: string): string {
  const parsed = parseAvatarData(avatarSeed)
  if (parsed) {
    if (gender === 'female' && !parsed.flip) parsed.flip = true
    if (!parsed.seed) parsed.seed = defaultSeed
    return buildAvatarUrl(parsed)
  }
  const params = new URLSearchParams({ seed: defaultSeed })
  if (gender === 'female') params.set('flip', 'true')
  return `${API_BASE}/${DEFAULT_STYLE}/svg?${params.toString()}`
}
