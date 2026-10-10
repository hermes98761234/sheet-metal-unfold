/** Press-brake V-die suggestion (air bending, 90°) from common shop rules of thumb. */

export const STANDARD_V = [4, 5, 6, 7, 8, 10, 12, 14, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200]

/** Ideal V opening as a multiple of sheet thickness: 6T up to 3 mm, 8T to 10 mm, 10T to 12 mm, else 12T. */
export function vFactor(thicknessMm: number): number {
  return thicknessMm < 3 ? 6 : thicknessMm <= 10 ? 8 : thicknessMm <= 12 ? 10 : 12
}

export type DieSuggestion = {
  /** Ideal V opening, factor × thickness. */
  ideal: number
  /** Nearest standard die opening. */
  v: number
  /** Next smaller / larger standard openings. */
  alternatives: number[]
  /** Minimum flange length that still sits on the die shoulders, ≈ 0.7·V. */
  minFlange: number
  /** Inside radius an air bend in this die forms naturally, ≈ 0.16·V. */
  naturalRadius: number
  /** Bending force per metre of bend length, kN/m: 1.42·UTS·T² / V. */
  forcePerMetre: number
}

export function suggestDie(thicknessMm: number, utsMpa: number): DieSuggestion {
  const ideal = vFactor(thicknessMm) * thicknessMm
  let idx = 0
  STANDARD_V.forEach((v, i) => {
    if (Math.abs(Math.log(v / ideal)) < Math.abs(Math.log(STANDARD_V[idx] / ideal))) idx = i
  })
  const v = STANDARD_V[idx]
  return {
    ideal,
    v,
    alternatives: [STANDARD_V[idx - 1], STANDARD_V[idx + 1]].filter((x): x is number => x !== undefined),
    minFlange: 0.7 * v,
    naturalRadius: 0.16 * v,
    forcePerMetre: (1.42 * utsMpa * thicknessMm * thicknessMm) / v,
  }
}

/** Total bending force in kN for a bend of the given length (mm). */
export function totalForceKn(forcePerMetre: number, bendLengthMm: number): number {
  return (forcePerMetre * bendLengthMm) / 1000
}

export const kNToTonnes = (kn: number) => kn / 9.80665
