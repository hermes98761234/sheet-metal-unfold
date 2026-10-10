import type { Bend, DimType, Hardness } from './bend'

export type Lang = 'en' | 'uk'
export type Unit = 'mm' | 'in'
export type Theme = 'auto' | 'light' | 'dark'
export type KMode = 'table' | 'manual'

export const MM_PER_IN = 25.4
export const toUnit = (mm: number, u: Unit) => (u === 'in' ? mm / MM_PER_IN : mm)
export const fromUnit = (v: number, u: Unit) => (u === 'in' ? v * MM_PER_IN : v)

export type Material = {
  id: string
  name: string
  /** Ultimate tensile strength, MPa. */
  uts: number
  /** Density, kg/m³. */
  density: number
  hardness: Hardness
  /** Typical minimum inside bend radius as a multiple of thickness. */
  minRadius: number
}

export const MATERIALS: Material[] = [
  { id: 'mild', name: 'Mild steel', uts: 400, density: 7850, hardness: 'medium', minRadius: 0.5 },
  { id: 'ss304', name: 'Stainless steel 304', uts: 600, density: 7930, hardness: 'hard', minRadius: 1 },
  { id: 'spring', name: 'Spring steel', uts: 800, density: 7850, hardness: 'hard', minRadius: 2 },
  { id: 'al5052', name: 'Aluminium 5052-H32', uts: 230, density: 2680, hardness: 'soft', minRadius: 1 },
  { id: 'al6061', name: 'Aluminium 6061-T6', uts: 310, density: 2700, hardness: 'medium', minRadius: 3 },
  { id: 'copper', name: 'Copper', uts: 220, density: 8960, hardness: 'soft', minRadius: 0.5 },
  { id: 'brass', name: 'Brass', uts: 350, density: 8500, hardness: 'medium', minRadius: 0.5 },
]

export type Profile = { lengths: number[]; bends: Bend[] }

export type Preset = { id: string; name: string; profile: Profile }

const b90 = (dir: 1 | -1 = 1): Bend => ({ angle: 90, dir })

export const PRESETS: Preset[] = [
  { id: 'l', name: 'L bracket', profile: { lengths: [30, 50], bends: [b90()] } },
  { id: 'u', name: 'U channel', profile: { lengths: [20, 50, 20], bends: [b90(), b90()] } },
  { id: 'z', name: 'Z bracket', profile: { lengths: [20, 30, 20], bends: [b90(), b90(-1)] } },
  { id: 'hat', name: 'Hat channel', profile: { lengths: [15, 20, 40, 20, 15], bends: [b90(), b90(-1), b90(-1), b90()] } },
  { id: 'c', name: 'C channel with lips', profile: { lengths: [10, 40, 60, 40, 10], bends: [b90(), b90(), b90(), b90()] } },
  { id: 'v', name: '45° offset', profile: { lengths: [25, 35, 25], bends: [{ angle: 45, dir: 1 }, { angle: 45, dir: -1 }] } },
]

export type Settings = { lang: Lang; theme: Theme; unit: Unit }

export type AppState = {
  /** All lengths are stored in millimetres and converted for display. */
  thickness: number
  radius: number
  width: number
  material: string
  kMode: KMode
  kManual: number
  dimType: DimType
  profile: Profile
  settings: Settings
}

export const DEFAULT_STATE: AppState = {
  thickness: 2,
  radius: 2,
  width: 100,
  material: 'mild',
  kMode: 'table',
  kManual: 0.4,
  dimType: 'outside',
  profile: PRESETS[1].profile,
  settings: { lang: 'en', theme: 'auto', unit: 'mm' },
}

export const MAX_ANGLE = 170

export const materialOf = (id: string): Material => MATERIALS.find((m) => m.id === id) ?? MATERIALS[0]

export type Field = 'thickness' | 'radius' | 'width' | 'kManual' | `len${number}` | `ang${number}`

/** Fields holding unusable numbers; the calculation is skipped while any exist. */
export function invalidFields(s: AppState): Set<Field> {
  const bad = new Set<Field>()
  const pos = (v: number) => Number.isFinite(v) && v > 0
  if (!pos(s.thickness)) bad.add('thickness')
  if (!(Number.isFinite(s.radius) && s.radius >= 0)) bad.add('radius')
  if (!pos(s.width)) bad.add('width')
  if (s.kMode === 'manual' && !(Number.isFinite(s.kManual) && s.kManual >= 0 && s.kManual <= 1)) bad.add('kManual')
  s.profile.lengths.forEach((l, i) => !pos(l) && bad.add(`len${i}`))
  s.profile.bends.forEach((b, i) => !(Number.isFinite(b.angle) && b.angle > 0 && b.angle <= MAX_ANGLE) && bad.add(`ang${i}`))
  return bad
}

const KEY = 'sheet-metal-unfold:v1'

export function loadState(): AppState {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (!raw || typeof raw !== 'object') return DEFAULT_STATE
    const merged: AppState = { ...DEFAULT_STATE, ...raw, settings: { ...DEFAULT_STATE.settings, ...raw.settings } }
    const p = merged.profile
    const ok =
      p && Array.isArray(p.lengths) && Array.isArray(p.bends) && p.lengths.length >= 1 && p.bends.length === p.lengths.length - 1
    return ok ? merged : { ...merged, profile: DEFAULT_STATE.profile }
  } catch {
    return DEFAULT_STATE
  }
}

export function saveState(s: AppState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    // storage unavailable (private mode): settings just won't persist
  }
}
