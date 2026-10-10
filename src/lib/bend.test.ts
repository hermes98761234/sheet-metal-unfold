import { describe, expect, it } from 'vitest'
import {
  bendAllowance, bendDeduction, computeFlat, insideSetback, kFactor, kFromTestBend, outsideSetback, K_TABLE,
} from './bend'

describe('bend formulas', () => {
  // T = 2, R = 2, K = 0.4, 90°: BA = π/2 · 2.8, OSSB = R + T, BD = 2·OSSB − BA
  it('bend allowance', () => {
    expect(bendAllowance(90, 2, 2, 0.4)).toBeCloseTo((Math.PI / 2) * 2.8, 9)
    expect(bendAllowance(90, 2, 2, 0.4)).toBeCloseTo(4.39823, 5)
    expect(bendAllowance(180, 1, 1, 0.5)).toBeCloseTo(Math.PI * 1.5, 9)
    expect(bendAllowance(0, 2, 2, 0.4)).toBe(0)
  })
  it('setbacks', () => {
    expect(outsideSetback(90, 2, 2)).toBeCloseTo(4, 9)
    expect(insideSetback(90, 2)).toBeCloseTo(2, 9)
    expect(outsideSetback(45, 3, 1)).toBeCloseTo(4 * Math.tan(Math.PI / 8), 9)
  })
  it('bend deduction', () => {
    expect(bendDeduction(90, 2, 2, 0.4)).toBeCloseTo(3.60177, 5)
    // K = 0.5 and 90°: BD = 2(R+T) − π/2 (R + T/2)
    expect(bendDeduction(90, 1, 1, 0.5)).toBeCloseTo(4 - (Math.PI / 2) * 1.5, 9)
  })
})

describe('K-factor', () => {
  it('table lookup by R/T band', () => {
    expect(kFactor('soft', 1, 2)).toBe(K_TABLE.soft[0])
    expect(kFactor('soft', 2, 2)).toBe(0.33)
    expect(kFactor('medium', 4, 2)).toBe(0.43)
    expect(kFactor('hard', 6, 2)).toBe(0.45)
    expect(kFactor('hard', 7, 2)).toBe(0.5)
  })
  it('recovers K from a test bend', () => {
    const flat = computeFlat({ thickness: 1.5, radius: 3, k: 0.41, dimType: 'outside', lengths: [40, 60], bends: [{ angle: 90, dir: 1 }] })
    expect(kFromTestBend(40, 60, flat.flatLength, 90, 3, 1.5)).toBeCloseTo(0.41, 9)
    const flat2 = computeFlat({ thickness: 3, radius: 1, k: 0.33, dimType: 'outside', lengths: [30, 30], bends: [{ angle: 120, dir: 1 }] })
    expect(kFromTestBend(30, 30, flat2.flatLength, 120, 1, 3)).toBeCloseTo(0.33, 9)
  })
})

describe('computeFlat', () => {
  const base = { thickness: 2, radius: 2, k: 0.4 }
  it('U channel from outside dimensions', () => {
    const r = computeFlat({ ...base, dimType: 'outside', lengths: [20, 50, 20], bends: [{ angle: 90, dir: 1 }, { angle: 90, dir: 1 }] })
    expect(r.flatLength).toBeCloseTo(90 - 2 * 3.60177, 4)
    expect(r.totalDeduction).toBeCloseTo(2 * 3.60177, 4)
    expect(r.straights[0]).toBeCloseTo(16, 9)
    expect(r.straights[1]).toBeCloseTo(42, 9)
    expect(r.bends[0].lineAt).toBeCloseTo(16 + 4.39823 / 2, 4)
    expect(r.bends[1].lineAt).toBeCloseTo(16 + 4.39823 + 42 + 4.39823 / 2, 4)
    expect(r.tooShort).toEqual([])
  })
  it('inside dimensions give a longer pattern than outside for the same numbers', () => {
    const p = { ...base, lengths: [30, 50], bends: [{ angle: 90, dir: 1 as const }] }
    const inside = computeFlat({ ...p, dimType: 'inside' })
    expect(inside.flatLength).toBeCloseTo(30 + 50 - 4 + 4.39823, 4)
    expect(inside.flatLength).toBeGreaterThan(computeFlat({ ...p, dimType: 'outside' }).flatLength)
  })
  it('flat dimensions just add the allowance', () => {
    const r = computeFlat({ ...base, dimType: 'flat', lengths: [30, 50], bends: [{ angle: 90, dir: 1 }] })
    expect(r.flatLength).toBeCloseTo(80 + 4.39823, 4)
  })
  it('flags flanges too short for their bends', () => {
    const r = computeFlat({ ...base, dimType: 'outside', lengths: [3, 50], bends: [{ angle: 90, dir: 1 }] })
    expect(r.tooShort).toEqual([0])
  })
  it('a profile with no bends is its own length', () => {
    expect(computeFlat({ ...base, dimType: 'outside', lengths: [75], bends: [] }).flatLength).toBe(75)
  })
  it('zero angle bend adds nothing', () => {
    const r = computeFlat({ ...base, dimType: 'outside', lengths: [10, 10], bends: [{ angle: 1e-9, dir: 1 }] })
    expect(r.flatLength).toBeCloseTo(20, 6)
  })
})
