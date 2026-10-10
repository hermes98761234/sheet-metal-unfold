import type { Bend } from './bend'

export type Pt = { x: number; y: number }

export type ProfileGeometry = {
  /** Sampled centre line of the sheet (y up). */
  path: Pt[]
  /** Midpoint of each flange's straight part, with a unit normal for label placement. */
  labels: { at: Pt; normal: Pt }[]
}

/**
 * Walks the sheet's centre line: straight, arc, straight, … Starts heading +x.
 * dir +1 turns counter-clockwise (up), −1 clockwise (down).
 */
export function profileGeometry(straights: number[], bends: Bend[], radius: number, thickness: number): ProfileGeometry {
  const rc = radius + thickness / 2
  let x = 0
  let y = 0
  let h = 0
  const path: Pt[] = [{ x, y }]
  const labels: ProfileGeometry['labels'] = []
  straights.forEach((s0, i) => {
    const s = Math.max(0, s0)
    labels.push({ at: { x: x + (Math.cos(h) * s) / 2, y: y + (Math.sin(h) * s) / 2 }, normal: { x: -Math.sin(h), y: Math.cos(h) } })
    x += Math.cos(h) * s
    y += Math.sin(h) * s
    path.push({ x, y })
    const b = bends[i]
    if (!b) return
    const th = (b.angle * Math.PI) / 180
    const cx = x - b.dir * Math.sin(h) * rc
    const cy = y + b.dir * Math.cos(h) * rc
    const a0 = Math.atan2(y - cy, x - cx)
    const steps = Math.max(2, Math.ceil(b.angle / 6))
    for (let j = 1; j <= steps; j++) {
      const a = a0 + b.dir * th * (j / steps)
      path.push({ x: cx + rc * Math.cos(a), y: cy + rc * Math.sin(a) })
    }
    h += b.dir * th
    x = path[path.length - 1].x
    y = path[path.length - 1].y
  })
  return { path, labels }
}
