import { useState } from 'react'
import { kFromTestBend, type FlatResult } from '../lib/bend'
import { kNToTonnes, totalForceKn, type DieSuggestion } from '../lib/die'
import { toUnit, type Unit } from '../lib/model'
import type { T } from '../i18n'
import NumberField from './NumberField'

const num = (mm: number, unit: Unit, d = unit === 'in' ? 4 : 3) => String(+toUnit(mm, unit).toFixed(d))

export function BendTable({ flat, k, unit, t }: { flat: FlatResult; k: number; unit: Unit; t: T }) {
  if (flat.bends.length === 0) return <p className="hint">{t('No bends: the flat pattern is the flange itself.')}</p>
  return (
    <div className="scroll-x">
      <table className="data">
        <thead>
          <tr>
            <td>{t('Bend')}</td>
            <td>{t('Angle')}</td>
            <td>{t('Allowance')}</td>
            <td>{t('Deduction')}</td>
            <td>{t('Setback')}</td>
            <td>{t('Line at')}</td>
          </tr>
        </thead>
        <tbody>
          {flat.bends.map((b, i) => (
            <tr key={i}>
              <td>
                {i + 1} {b.dir > 0 ? '↑' : '↓'}
              </td>
              <td>{+b.angle.toFixed(2)}°</td>
              <td>{num(b.allowance, unit)}</td>
              <td>{num(b.deduction, unit)}</td>
              <td>{num(b.outsideSetback, unit)}</td>
              <td>{num(b.lineAt, unit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hint">{t('K-factor {0}. Allowance is the neutral-line arc; deduction = 2 × setback − allowance.', +k.toFixed(3))}</p>
    </div>
  )
}

export function DieBox({
  die, thickness, radius, width, flangeMin, unit, t,
}: {
  die: DieSuggestion
  thickness: number
  radius: number
  width: number
  flangeMin: number
  unit: Unit
  t: T
}) {
  const kn = totalForceKn(die.forcePerMetre, width)
  const vForRadius = radius / 0.16
  const radiusOff = Math.abs(radius - die.naturalRadius) / die.naturalRadius > 0.3
  return (
    <div>
      <p className="verdict">{t('Use a V-die of about {0} {1}', num(die.v, unit, unit === 'in' ? 3 : 0), unit)}</p>
      <table className="data">
        <tbody>
          <tr>
            <td>{t('Rule of thumb')}</td>
            <td>{t('{0} × thickness = {1} {2}', +(die.ideal / thickness).toFixed(1), num(die.ideal, unit, 2), unit)}</td>
          </tr>
          <tr>
            <td>{t('Other standard openings')}</td>
            <td>{die.alternatives.map((v) => num(v, unit, unit === 'in' ? 3 : 0)).join(', ')} {unit}</td>
          </tr>
          <tr>
            <td>{t('Minimum flange')}</td>
            <td>
              {num(die.minFlange, unit, 2)} {unit}
            </td>
          </tr>
          <tr>
            <td>{t('Radius this die forms')}</td>
            <td>
              ≈ {num(die.naturalRadius, unit, 2)} {unit}
            </td>
          </tr>
          <tr>
            <td>{t('Bending force')}</td>
            <td>
              {+die.forcePerMetre.toFixed(0)} {t('kN/m')} · {+kn.toFixed(1)} kN ({+kNToTonnes(kn).toFixed(1)} {t('t')}) {t('for {0} {1}', num(width, unit, 1), unit)}
            </td>
          </tr>
        </tbody>
      </table>
      {radiusOff && (
        <p className="hint warn-text">
          {t('Your inside radius differs from what this die forms. For R = {0} {1} an air-bend die of about V {2} {1} fits better.', num(radius, unit, 2), unit, num(vForRadius, unit, unit === 'in' ? 3 : 0))}
        </p>
      )}
      {flangeMin < die.minFlange && (
        <p className="hint warn-text">
          {t('The shortest flange ({0} {1}) is below the die minimum; use a narrower die or expect a poor bend.', num(flangeMin, unit, 2), unit)}
        </p>
      )}
      <p className="hint">{t('Air bending, 90°, rules of thumb. Check your press brake chart.')}</p>
    </div>
  )
}

export function Calibrator({
  thickness, radius, unit, onUse, t,
}: {
  thickness: number
  radius: number
  unit: Unit
  onUse: (k: number) => void
  t: T
}) {
  const [l1, setL1] = useState(40)
  const [l2, setL2] = useState(60)
  const [flat, setFlat] = useState(96)
  const [angle, setAngle] = useState(90)
  const valid = [l1, l2, flat, angle].every(Number.isFinite) && angle > 0 && angle < 180 && thickness > 0 && radius >= 0
  const k = valid ? kFromTestBend(l1, l2, flat, angle, radius, thickness) : NaN
  const ok = Number.isFinite(k) && k >= 0 && k <= 1
  return (
    <details className="box">
      <summary>{t('Find K-factor from a test bend')}</summary>
      <p className="hint">{t('Bend a scrap piece, measure its two outside flanges and the flat length before bending. Uses the thickness and radius on the left.')}</p>
      <div className="grid2">
        <NumberField label={t('Outside flange A')} value={l1} unit={unit} suffix={unit} bad={!Number.isFinite(l1)} onChange={setL1} />
        <NumberField label={t('Outside flange B')} value={l2} unit={unit} suffix={unit} bad={!Number.isFinite(l2)} onChange={setL2} />
        <NumberField label={t('Measured flat length')} value={flat} unit={unit} suffix={unit} bad={!Number.isFinite(flat)} onChange={setFlat} />
        <NumberField label={t('Bend angle')} value={angle} unit={null} suffix="°" bad={!(angle > 0 && angle < 180)} onChange={setAngle} />
      </div>
      <div className="row">
        <span className={ok ? 'ok-text' : 'err-text'}>{ok ? t('K = {0}', +k.toFixed(3)) : t('No valid K from these numbers.')}</span>
        <button disabled={!ok} onClick={() => onUse(+k.toFixed(3))}>
          {t('Use this K')}
        </button>
      </div>
    </details>
  )
}
