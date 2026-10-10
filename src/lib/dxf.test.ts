import { describe, expect, it } from 'vitest'
import { computeFlat } from './bend'
import { flatPatternDxf } from './dxf'

describe('flatPatternDxf', () => {
  const flat = computeFlat({ thickness: 2, radius: 2, k: 0.4, dimType: 'outside', lengths: [20, 50, 20], bends: [{ angle: 90, dir: 1 }, { angle: 90, dir: 1 }] })
  const dxf = flatPatternDxf(flat, 100, ['BEND 1 UP 90', 'BEND 2 UP 90'])
  const pairs = dxf.trimEnd().split('\n').reduce<[string, string][]>((acc, v, i, a) => (i % 2 ? acc : [...acc, [v.trim(), a[i + 1]]]), [])
  it('has the expected entities', () => {
    expect(pairs.filter(([c, v]) => c === '0' && v === 'LINE')).toHaveLength(4 + 2)
    expect(pairs.filter(([c, v]) => c === '0' && v === 'TEXT')).toHaveLength(2)
    expect(pairs[pairs.length - 1]).toEqual(['0', 'EOF'])
  })
  it('puts the bend lines at the right x', () => {
    const xs = pairs.filter(([c]) => c === '10').map(([, v]) => +v)
    expect(xs.some((x) => Math.abs(x - flat.bends[0].lineAt) < 1e-4)).toBe(true)
    expect(xs.some((x) => Math.abs(x - flat.bends[1].lineAt) < 1e-4)).toBe(true)
  })
  it('outlines the full flat length', () => {
    const xs = pairs.filter(([c]) => c === '11').map(([, v]) => +v)
    expect(Math.max(...xs)).toBeCloseTo(flat.flatLength, 4)
  })
})
