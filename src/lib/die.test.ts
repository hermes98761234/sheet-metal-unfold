import { describe, expect, it } from 'vitest'
import { kNToTonnes, suggestDie, totalForceKn, vFactor } from './die'

describe('die suggestion', () => {
  it('uses 6T/8T/10T/12T by thickness', () => {
    expect([1, 2.9, 3, 10, 11, 12, 15].map(vFactor)).toEqual([6, 6, 8, 8, 10, 10, 12])
  })
  it('2 mm mild steel', () => {
    const d = suggestDie(2, 400)
    expect(d.ideal).toBe(12)
    expect(d.v).toBe(12)
    expect(d.minFlange).toBeCloseTo(8.4, 9)
    expect(d.naturalRadius).toBeCloseTo(1.92, 9)
    expect(d.forcePerMetre).toBeCloseTo((1.42 * 400 * 4) / 12, 9)
    expect(d.alternatives).toEqual([10, 14])
  })
  it('picks the nearest standard opening', () => {
    expect(suggestDie(5, 400).v).toBe(40)
    expect(suggestDie(12.5, 400).v).toBe(160)
    expect(suggestDie(0.5, 300).v).toBe(4)
  })
  it('total force and unit conversion', () => {
    expect(totalForceKn(189.33, 1000)).toBeCloseTo(189.33, 9)
    expect(totalForceKn(100, 250)).toBeCloseTo(25, 9)
    expect(kNToTonnes(9.80665)).toBeCloseTo(1, 9)
  })
})
