/** Sheet-metal bend maths. All lengths share one unit (the app stores millimetres). */

export type DimType = 'outside' | 'inside' | 'flat'
export type Hardness = 'soft' | 'medium' | 'hard'

const rad = (deg: number) => (deg * Math.PI) / 180

/**
 * Bend allowance: the arc length of the neutral line through a bend.
 * BA = θ · (R + K·T), θ = angle the sheet is bent through (180° − included angle).
 */
export function bendAllowance(angleDeg: number, radius: number, thickness: number, k: number): number {
  return rad(angleDeg) * (radius + k * thickness)
}

/** Outside setback: from the tangent point to the outer virtual sharp, tan(θ/2)·(R + T). */
export function outsideSetback(angleDeg: number, radius: number, thickness: number): number {
  return Math.tan(rad(angleDeg) / 2) * (radius + thickness)
}

/** Inside setback: from the tangent point to the inner virtual sharp, tan(θ/2)·R. */
export function insideSetback(angleDeg: number, radius: number): number {
  return Math.tan(rad(angleDeg) / 2) * radius
}

/** Bend deduction (bend allowance subtracted from the sum of the outside dimensions): BD = 2·OSSB − BA. */
export function bendDeduction(angleDeg: number, radius: number, thickness: number, k: number): number {
  return 2 * outsideSetback(angleDeg, radius, thickness) - bendAllowance(angleDeg, radius, thickness, k)
}

/** Setback that a flange dimension of the given type loses at one bend. */
export function setback(type: DimType, angleDeg: number, radius: number, thickness: number): number {
  if (type === 'outside') return outsideSetback(angleDeg, radius, thickness)
  if (type === 'inside') return insideSetback(angleDeg, radius)
  return 0
}

/**
 * Typical air-bending K-factors by inside radius / thickness ratio
 * (R ≤ T, T < R ≤ 3T, R > 3T) for soft, medium and hard materials.
 */
export const K_TABLE: Record<Hardness, [number, number, number]> = {
  soft: [0.33, 0.4, 0.5],
  medium: [0.38, 0.43, 0.5],
  hard: [0.4, 0.45, 0.5],
}

export function kFactor(hardness: Hardness, radius: number, thickness: number): number {
  const ratio = radius / thickness
  const row = K_TABLE[hardness]
  return ratio <= 1 ? row[0] : ratio <= 3 ? row[1] : row[2]
}

/**
 * K-factor measured from a test bend: bend a coupon with two outside flange lengths,
 * measure its flat length, and recover K from BA = 2·OSSB − (L1 + L2 − flat).
 */
export function kFromTestBend(
  outside1: number,
  outside2: number,
  flatLength: number,
  angleDeg: number,
  radius: number,
  thickness: number,
): number {
  const bd = outside1 + outside2 - flatLength
  const ba = 2 * outsideSetback(angleDeg, radius, thickness) - bd
  return (ba / rad(angleDeg) - radius) / thickness
}

export type Bend = { angle: number; dir: 1 | -1 }

export type FlatParams = {
  thickness: number
  radius: number
  k: number
  dimType: DimType
  lengths: number[]
  bends: Bend[]
}

export type BendInfo = {
  angle: number
  dir: 1 | -1
  allowance: number
  deduction: number
  outsideSetback: number
  /** Distance from the start of the flat pattern to the bend line (centre of the bend zone). */
  lineAt: number
  zoneStart: number
  zoneEnd: number
}

export type FlatResult = {
  bends: BendInfo[]
  /** Straight (tangent-to-tangent) length of every flange. */
  straights: number[]
  flatLength: number
  /** Sum of the flange dimensions as entered. */
  entered: number
  /** Entered total minus flat length. */
  totalDeduction: number
  /** Indices of flanges whose straight length came out negative. */
  tooShort: number[]
}

/** Flat pattern length and bend line positions for a profile of flanges joined by bends. */
export function computeFlat(p: FlatParams): FlatResult {
  const n = p.lengths.length
  const sb = (i: number) => setback(p.dimType, p.bends[i].angle, p.radius, p.thickness)
  const straights = p.lengths.map((len, i) => len - (i > 0 ? sb(i - 1) : 0) - (i < n - 1 ? sb(i) : 0))
  const bends: BendInfo[] = []
  let pos = 0
  for (let i = 0; i < n; i++) {
    pos += straights[i]
    if (i < n - 1) {
      const b = p.bends[i]
      const allowance = bendAllowance(b.angle, p.radius, p.thickness, p.k)
      bends.push({
        angle: b.angle,
        dir: b.dir,
        allowance,
        deduction: bendDeduction(b.angle, p.radius, p.thickness, p.k),
        outsideSetback: outsideSetback(b.angle, p.radius, p.thickness),
        lineAt: pos + allowance / 2,
        zoneStart: pos,
        zoneEnd: pos + allowance,
      })
      pos += allowance
    }
  }
  const flatLength = pos
  const entered = p.lengths.reduce((a, b) => a + b, 0)
  return {
    bends,
    straights,
    flatLength,
    entered,
    totalDeduction: entered - flatLength,
    tooShort: straights.flatMap((s, i) => (s < -1e-9 ? [i] : [])),
  }
}
