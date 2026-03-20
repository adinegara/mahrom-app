import { useState, useEffect, useCallback, useRef } from 'react'
import {
  type AvatarOptions,
  parseAvatarData,
  buildAvatarUrl,
  AVATAR_STYLES,
} from '@/lib/avatar'
import type { Gender } from '@/lib/types'

interface AvatarEditorProps {
  nodeId: string
  gender?: Gender
  currentData: string
  onUpdate: (optionsJson: string) => void
}

interface SchemaProperty {
  type: string
  default?: unknown
  enum?: string[]
  items?: { type: string; enum?: string[] }
  minimum?: number
  maximum?: number
}

interface StyleSchema {
  properties: Record<string, SchemaProperty>
}

// Properties to skip (not useful for visual editing)
const SKIP_PROPS = new Set([
  'seed', 'flip', 'rotate', 'scale', 'radius', 'size',
  'translateX', 'translateY', 'clip', 'randomizeIds',
  'backgroundColor', 'backgroundType', 'backgroundRotation',
  'base',
])

// Labels for common property names
const PROP_LABELS: Record<string, string> = {
  hair: 'Rambut', hairColor: 'Warna Rambut', eyes: 'Mata', eyebrows: 'Alis',
  mouth: 'Mulut', nose: 'Hidung', skinColor: 'Warna Kulit', glasses: 'Kacamata',
  earrings: 'Anting', beard: 'Jenggot', brows: 'Alis', lips: 'Bibir',
  body: 'Badan', face: 'Wajah', head: 'Kepala', accessories: 'Aksesoris',
  facialHair: 'Rambut Wajah', clothing: 'Pakaian', clothingColor: 'Warna Pakaian',
  mask: 'Masker', gesture: 'Gestur', bodyIcon: 'Ikon Badan',
  headContrastColor: 'Warna Kontras', features: 'Fitur Wajah',
  top: 'Atas', topColor: 'Warna Atas', hatColor: 'Warna Topi',
  glassesProbability: 'Prob. Kacamata', beardProbability: 'Prob. Jenggot',
  facialHairProbability: 'Prob. Rambut Wajah', maskProbability: 'Prob. Masker',
  accessoriesProbability: 'Prob. Aksesoris', gestureProbability: 'Prob. Gestur',
  featuresProbability: 'Prob. Fitur', earringsProbability: 'Prob. Anting',
  bodyIconProbability: 'Prob. Ikon',
}

// Schema cache
const schemaCache = new Map<string, StyleSchema>()

async function fetchSchema(style: string): Promise<StyleSchema | null> {
  if (schemaCache.has(style)) return schemaCache.get(style)!
  try {
    const res = await fetch(`https://api.dicebear.com/9.x/${style}/schema.json`)
    if (!res.ok) return null
    const schema = await res.json()
    schemaCache.set(style, schema)
    return schema
  } catch (_e) {
    return null
  }
}

type OptionCategory = {
  label: string
  props: { key: string; label: string; schema: SchemaProperty }[]
}

function categorizeProps(schema: StyleSchema): OptionCategory[] {
  const visual: OptionCategory['props'] = []
  const colors: OptionCategory['props'] = []
  const probabilities: OptionCategory['props'] = []

  for (const [key, prop] of Object.entries(schema.properties)) {
    if (SKIP_PROPS.has(key)) continue

    const label = PROP_LABELS[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())

    if (key.endsWith('Probability')) {
      probabilities.push({ key, label, schema: prop })
    } else if (key.toLowerCase().includes('color')) {
      colors.push({ key, label, schema: prop })
    } else {
      visual.push({ key, label, schema: prop })
    }
  }

  const categories: OptionCategory[] = []
  if (visual.length) categories.push({ label: 'Tampilan', props: visual })
  if (colors.length) categories.push({ label: 'Warna', props: colors })
  if (probabilities.length) categories.push({ label: 'Probabilitas', props: probabilities })
  return categories
}

function getEnumValues(prop: SchemaProperty): string[] | null {
  if (prop.items?.enum) return prop.items.enum
  if (prop.enum) return prop.enum
  return null
}

export function AvatarEditor({ nodeId, gender, currentData, onUpdate }: AvatarEditorProps) {
  const [options, setOptions] = useState<AvatarOptions>(() => {
    const parsed = parseAvatarData(currentData)
    return parsed || { seed: currentData || nodeId }
  })
  const [schema, setSchema] = useState<StyleSchema | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'style' | 'customize'>('style')
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  const currentStyle = options.style || 'adventurer'

  // Fetch schema when style changes
  useEffect(() => {
    setLoading(true)
    fetchSchema(currentStyle).then(s => {
      setSchema(s)
      setLoading(false)
    })
  }, [currentStyle])

  const pushUpdate = useCallback((opts: AvatarOptions) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onUpdate(JSON.stringify(opts))
    }, 150)
  }, [onUpdate])

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  const update = (patch: Record<string, unknown>) => {
    setOptions(prev => {
      const next = { ...prev, ...patch } as AvatarOptions
      pushUpdate(next)
      return next
    })
  }

  const previewUrl = buildAvatarUrl({
    ...options,
    flip: gender === 'female' ? true : options.flip,
    seed: options.seed || nodeId,
  })

  const randomize = () => {
    const newSeed = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const newOpts: AvatarOptions = { style: currentStyle, seed: newSeed }
    setOptions(newOpts)
    pushUpdate(newOpts)
  }

  const categories = schema ? categorizeProps(schema) : []
  const hasCustomize = categories.some(c => c.props.length > 0)

  return (
    <div className="avatar-editor" style={{ fontFamily: 'var(--font-sans, Open Sans, sans-serif)' }}>
      {/* Preview */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-20 h-20 rounded-[12px] border-[2.5px] overflow-hidden shrink-0"
          style={{
            borderColor: gender === 'male' ? 'var(--color-male, #4a90d9)' : 'var(--color-female, #d94a8c)',
            backgroundColor: gender === 'male' ? 'var(--color-male-light, #e8f0fe)' : 'var(--color-female-light, #fde8ef)',
            boxShadow: gender === 'male'
              ? '3px 3px 0px color-mix(in srgb, var(--color-male, #4a90d9) 50%, black)'
              : '3px 3px 0px color-mix(in srgb, var(--color-female, #d94a8c) 50%, black)',
          }}
        >
          <img src={previewUrl} alt="Avatar preview" className="w-full h-full" />
        </div>
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="text-sm font-bold text-center" style={{ color: 'var(--color-ink-light, #6b6b6b)' }}>
            {AVATAR_STYLES.find(s => s.value === currentStyle)?.label || currentStyle}
          </div>
          <button
            type="button"
            onClick={randomize}
            className="w-full py-1.5 px-3 rounded-[10px] border-2 cursor-pointer
              hover:border-[var(--color-ink)] active:translate-y-[1px] transition-all font-bold text-sm"
            style={{
              color: 'var(--color-ink, #333)',
              borderColor: 'var(--color-doodle-border, #d4d4d4)',
              boxShadow: '2px 2px 0px var(--color-doodle-border, #d4d4d4)',
              fontFamily: 'var(--font-sans, Open Sans, sans-serif)',
            }}
          >
            Acak
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3 pb-1" style={{ borderBottom: '2px solid var(--color-doodle-border, #d4d4d4)' }}>
        <button
          type="button"
          onClick={() => setActiveTab('style')}
          className="flex-1 py-1.5 text-sm font-bold rounded-t-[10px] cursor-pointer transition-all"
          style={{
            fontFamily: 'var(--font-doodle, Caveat, cursive)',
            ...(activeTab === 'style'
              ? { background: 'var(--color-canvas, #faf9f6)', color: 'var(--color-ink, #2d2d2d)', borderBottom: '2.5px solid var(--color-ink, #2d2d2d)' }
              : { color: 'var(--color-ink-light, #6b6b6b)' }
            ),
          }}
        >
          Gaya
        </button>
        {hasCustomize && (
          <button
            type="button"
            onClick={() => setActiveTab('customize')}
            className="flex-1 py-1.5 text-sm font-bold rounded-t-[10px] cursor-pointer transition-all"
            style={{
              fontFamily: 'var(--font-sans, Open Sans, sans-serif)',
              ...(activeTab === 'customize'
                ? { background: 'var(--color-canvas, #faf9f6)', color: 'var(--color-ink, #2d2d2d)', borderBottom: '2.5px solid var(--color-ink, #2d2d2d)' }
                : { color: 'var(--color-ink-light, #6b6b6b)' }
              ),
            }}
          >
            Kustomisasi
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div style={{ overflowY: 'auto' }}>
        {activeTab === 'style' && (
          <div className="grid grid-cols-3 gap-1.5 pr-1">
            {AVATAR_STYLES.map(s => {
              const seed = options.seed || nodeId
              const url = `https://api.dicebear.com/9.x/${s.value}/svg?seed=${encodeURIComponent(seed)}${gender === 'female' ? '&flip=true' : ''}`
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => {
                    const newOpts: AvatarOptions = { style: s.value, seed: options.seed || nodeId }
                    setOptions(newOpts)
                    pushUpdate(newOpts)
                    setActiveTab('customize')
                  }}
                  className={`flex flex-col items-center gap-1 p-1.5 rounded-[10px] border-2 cursor-pointer transition-all hover:scale-[1.03]
                    ${currentStyle === s.value
                      ? 'ring-2 ring-offset-1'
                      : 'hover:border-[var(--color-ink-light)]'
                    }`}
                  style={{
                    borderColor: currentStyle === s.value ? 'var(--color-ink, #2d2d2d)' : 'var(--color-doodle-border, #d4d4d4)',
                    boxShadow: currentStyle === s.value ? '3px 3px 0px var(--color-ink, #2d2d2d)' : '2px 2px 0px var(--color-doodle-border, #d4d4d4)',
                    ...(currentStyle === s.value ? { ringColor: 'var(--color-ink, #2d2d2d)' } : {}),
                  }}
                >
                  <img src={url} alt={s.label} className="w-12 h-12 rounded" loading="lazy" />
                  <span className="text-[11px] font-bold leading-tight text-center" style={{ color: 'var(--color-ink-light, #6b6b6b)' }}>
                    {s.label}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {activeTab === 'customize' && (
          <div className="space-y-4">
            {loading && <div className="text-xs text-gray-400 text-center py-4">Memuat opsi...</div>}
            {!loading && categories.map(cat => (
              <div key={cat.label}>
                <div className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-ink-light, #6b6b6b)' }}>
                  {cat.label}
                </div>
                <div className="space-y-3">
                  {cat.props.map(({ key, label, schema: prop }) => {
                    const enumVals = getEnumValues(prop)
                    const currentVal = (options as Record<string, unknown>)[key]

                    // Probability slider
                    if (key.endsWith('Probability')) {
                      const val = typeof currentVal === 'number' ? currentVal : (typeof prop.default === 'number' ? prop.default : 50)
                      return (
                        <div key={key}>
                          <label className="text-sm font-bold mb-1 flex items-center justify-between" style={{ color: 'var(--color-ink, #2d2d2d)' }}>
                            <span>{label}</span>
                            <span className="text-xs" style={{ color: 'var(--color-ink-light, #6b6b6b)' }}>{val}%</span>
                          </label>
                          <input
                            type="range"
                            min={prop.minimum ?? 0}
                            max={prop.maximum ?? 100}
                            value={val}
                            onChange={e => update({ [key]: Number(e.target.value) })}
                            className="w-full h-1.5 rounded-lg appearance-none bg-gray-200 accent-[var(--color-primary)]"
                          />
                        </div>
                      )
                    }

                    // Color picker (hex array)
                    if (key.toLowerCase().includes('color') && prop.type === 'array') {
                      const colorEnums = prop.items?.enum || []
                      if (colorEnums.length === 0) return null
                      const selectedColor = typeof currentVal === 'string' ? currentVal : (Array.isArray(currentVal) ? String(currentVal[0]) : '')
                      return (
                        <div key={key}>
                          <label className="text-sm font-bold mb-1 block" style={{ color: 'var(--color-ink, #2d2d2d)' }}>{label}</label>
                          <div className="flex flex-wrap gap-1.5">
                            {colorEnums.filter((c: string) => c !== 'transparent').map((color: string) => (
                              <button
                                key={color}
                                type="button"
                                onClick={() => update({ [key]: color })}
                                className={`w-7 h-7 rounded-full border-2 cursor-pointer transition-all hover:scale-110`}
                                style={{
                                  backgroundColor: `#${color}`,
                                  borderColor: color === selectedColor ? 'var(--color-ink, #2d2d2d)' : 'var(--color-doodle-border, #d4d4d4)',
                                  boxShadow: color === selectedColor ? '2px 2px 0px var(--color-ink, #2d2d2d)' : 'none',
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )
                    }

                    // Visual variant picker (enum with image previews)
                    if (enumVals && enumVals.length > 0) {
                      const selectedVal = typeof currentVal === 'string' ? currentVal : (Array.isArray(currentVal) ? String(currentVal[0]) : '')
                      return (
                        <div key={key}>
                          <label className="text-sm font-bold mb-1 block" style={{ color: 'var(--color-ink, #2d2d2d)' }}>{label}</label>
                          <div className="grid grid-cols-4 gap-1.5">
                            {enumVals.map((val: string) => {
                              const previewOpts: Record<string, unknown> = {
                                ...options,
                                style: currentStyle,
                                [key]: val,
                                seed: options.seed || nodeId,
                                flip: gender === 'female' ? true : undefined,
                              }
                              // Set probability to 100 for this property so preview shows it
                              const probKey = key + 'Probability'
                              if (schema?.properties[probKey]) {
                                previewOpts[probKey] = 100
                              }
                              return (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => {
                                    const patch: Record<string, unknown> = { [key]: val }
                                    if (schema?.properties[probKey]) {
                                      patch[probKey] = 100
                                    }
                                    update(patch)
                                  }}
                                  className={`w-full aspect-square rounded-[10px] border-2 overflow-hidden cursor-pointer transition-all hover:scale-105`}
                                  style={{
                                    borderColor: val === selectedVal ? 'var(--color-ink, #2d2d2d)' : 'var(--color-doodle-border, #d4d4d4)',
                                    boxShadow: val === selectedVal ? '3px 3px 0px var(--color-ink, #2d2d2d)' : '2px 2px 0px var(--color-doodle-border, #d4d4d4)',
                                  }}
                                >
                                  <img
                                    src={buildAvatarUrl(previewOpts as AvatarOptions)}
                                    alt={val}
                                    className="w-full h-full"
                                    loading="lazy"
                                  />
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    }

                    return null
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
