import { describe, expect, it } from 'vitest'
import { DEFAULT_STATE, fromUnit, invalidFields, loadState, PRESETS, toUnit } from './model'

describe('model', () => {
  it('converts units', () => {
    expect(toUnit(25.4, 'in')).toBe(1)
    expect(fromUnit(2, 'in')).toBeCloseTo(50.8, 9)
    expect(toUnit(7, 'mm')).toBe(7)
  })
  it('default state is valid', () => {
    expect(invalidFields(DEFAULT_STATE).size).toBe(0)
  })
  it('flags bad fields', () => {
    const bad = invalidFields({ ...DEFAULT_STATE, thickness: 0, profile: { lengths: [10, NaN], bends: [{ angle: 180, dir: 1 }] } })
    expect([...bad].sort()).toEqual(['ang0', 'len1', 'thickness'])
  })
  it('presets are well formed', () => {
    for (const p of PRESETS) expect(p.profile.bends).toHaveLength(p.profile.lengths.length - 1)
  })
  it('falls back to defaults without storage', () => {
    expect(loadState()).toEqual(DEFAULT_STATE)
  })
})
