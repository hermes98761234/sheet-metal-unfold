import type { FlatResult } from '../lib/bend'
import type { ProfileGeometry } from '../lib/geometry'
import { toUnit, type Unit } from '../lib/model'
import type { T } from '../i18n'

const num = (mm: number, unit: Unit) => String(+toUnit(mm, unit).toFixed(unit === 'in' ? 3 : 2))

/** Cross-section of the formed part to scale: the sheet as a stroke of its thickness. */
export function ProfileView({ geo, thickness, unit, t }: { geo: ProfileGeometry; thickness: number; unit: Unit; t: T }) {
  const xs = geo.path.map((p) => p.x)
  const ys = geo.path.map((p) => -p.y)
  const size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 10)
  const pad = size * 0.12 + thickness
  const x0 = Math.min(...xs) - pad
  const y0 = Math.min(...ys) - pad
  const w = Math.max(...xs) - Math.min(...xs) + 2 * pad
  const h = Math.max(...ys) - Math.min(...ys) + 2 * pad
  const fs = size * 0.05
  return (
    <svg className="diagram" viewBox={`${x0} ${y0} ${w} ${h}`} role="img" aria-label={t('Cross-section of the formed part')}>
      <polyline points={geo.path.map((p) => `${p.x},${-p.y}`).join(' ')} fill="none" stroke="var(--accent)" strokeWidth={thickness} strokeLinejoin="round" strokeLinecap="butt" />
      <polyline points={geo.path.map((p) => `${p.x},${-p.y}`).join(' ')} fill="none" stroke="var(--chart-bg)" strokeWidth={thickness * 0.08} opacity=".6" />
      {geo.labels.map((l, i) => {
        const d = thickness / 2 + fs * 1.4
        return (
          <g key={i}>
            <circle cx={l.at.x + l.normal.x * d} cy={-(l.at.y + l.normal.y * d)} r={fs * 0.85} fill="var(--panel2)" stroke="var(--grid-strong)" strokeWidth={fs * 0.06} />
            <text x={l.at.x + l.normal.x * d} y={-(l.at.y + l.normal.y * d) + fs * 0.35} fontSize={fs} textAnchor="middle" fill="var(--chart-fg)">
              {i + 1}
            </text>
          </g>
        )
      })}
      <text x={x0 + pad * 0.3} y={y0 + h - pad * 0.25} fontSize={fs} fill="var(--chart-fg)">
        {t('T = {0} {1}', num(thickness, unit), unit)}
      </text>
    </svg>
  )
}

/** The flat blank to scale: outline, shaded bend zones and dashed bend lines. */
export function FlatView({ flat, width, unit, t }: { flat: FlatResult; width: number; unit: Unit; t: T }) {
  const L = flat.flatLength
  const size = Math.max(L, width)
  const m = size * 0.1
  const fs = size * 0.035
  return (
    <svg className="diagram" viewBox={`${-m} ${-m * 1.2} ${L + 2 * m} ${width + 3.2 * m}`} role="img" aria-label={t('Flat pattern')}>
      <rect x={0} y={0} width={L} height={width} fill="var(--panel2)" stroke="var(--fg)" strokeWidth={size * 0.004} />
      {flat.bends.map((b, i) => (
        <g key={i}>
          <rect x={b.zoneStart} y={0} width={b.allowance} height={width} fill="var(--accent)" opacity=".18" />
          <line x1={b.lineAt} y1={-m * 0.25} x2={b.lineAt} y2={width + m * 0.25} stroke="var(--ref-line)" strokeWidth={size * 0.005} strokeDasharray={`${size * 0.02} ${size * 0.01}`} />
          <text x={b.lineAt} y={-m * 0.4} fontSize={fs} textAnchor="middle" fill="var(--chart-fg)">
            {t('B{0}', i + 1)}
          </text>
          <text x={b.lineAt} y={width + m * 0.7} fontSize={fs * 0.9} textAnchor="middle" fill="var(--chart-fg)">
            {num(b.lineAt, unit)}
          </text>
        </g>
      ))}
      <text x={L / 2} y={width + m * 1.5} fontSize={fs * 1.1} textAnchor="middle" fill="var(--fg)">
        {t('{0} × {1} {2}', num(L, unit), num(width, unit), unit)}
      </text>
    </svg>
  )
}
