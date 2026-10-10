import { describe, expect, it } from 'vitest'
import { profileGeometry } from './geometry'

describe('profileGeometry', () => {
  it('traces a U channel centre line', () => {
    const g = profileGeometry([16, 42, 16], [{ angle: 90, dir: 1 }, { angle: 90, dir: 1 }], 2, 2)
    const end = g.path[g.path.length - 1]
    // first bend ends at (19, 3), second at (16, 48), then 16 mm back west
    expect(end.x).toBeCloseTo(0, 9)
    expect(end.y).toBeCloseTo(48, 9)
    expect(g.path.some((p) => Math.abs(p.x - 19) < 1e-9 && Math.abs(p.y - 3) < 1e-9)).toBe(true)
    expect(g.labels).toHaveLength(3)
  })
  it('a Z bracket ends heading in the same direction it started', () => {
    const g = profileGeometry([10, 20, 10], [{ angle: 90, dir: 1 }, { angle: 90, dir: -1 }], 1, 1)
    const n = g.path.length
    expect(g.path[n - 1].x).toBeGreaterThan(g.path[n - 2].x)
    expect(g.path[n - 1].y).toBeCloseTo(g.path[n - 2].y, 9)
  })
  it('keeps the arc at the centre-line radius', () => {
    const g = profileGeometry([0, 0], [{ angle: 90, dir: -1 }], 1, 2)
    const end = g.path[g.path.length - 1]
    expect(end.x).toBeCloseTo(2, 9)
    expect(end.y).toBeCloseTo(-2, 9)
  })
})
