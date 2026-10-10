import type { Bend } from '../lib/bend'
import { MAX_ANGLE, PRESETS, type Field, type Profile, type Unit } from '../lib/model'
import type { T } from '../i18n'
import NumberField from './NumberField'

type Props = {
  profile: Profile
  unit: Unit
  bad: Set<Field>
  t: T
  onChange: (p: Profile) => void
}

export default function ProfileEditor({ profile, unit, bad, t, onChange }: Props) {
  const { lengths, bends } = profile
  const setLen = (i: number, v: number) => onChange({ lengths: lengths.map((l, j) => (j === i ? v : l)), bends })
  const setBend = (i: number, patch: Partial<Bend>) => onChange({ lengths, bends: bends.map((b, j) => (j === i ? { ...b, ...patch } : b)) })
  const add = () => {
    const last = bends[bends.length - 1]
    onChange({ lengths: [...lengths, lengths[lengths.length - 1]], bends: [...bends, { angle: 90, dir: last?.dir ?? 1 }] })
  }
  // Removing flange i also removes the bend that joined it to the previous flange.
  const remove = (i: number) =>
    onChange({ lengths: lengths.filter((_, j) => j !== i), bends: bends.filter((_, j) => j !== Math.max(0, i - 1)) })
  const reverse = () => onChange({ lengths: [...lengths].reverse(), bends: [...bends].reverse() })

  return (
    <div className="section">
      <h3>{t('Flange profile')}</h3>
      <div className="row">
        <select
          aria-label={t('Preset')}
          value=""
          onChange={(e) => {
            const p = PRESETS.find((x) => x.id === e.target.value)
            if (p) onChange(structuredClone(p.profile))
          }}
        >
          <option value="">{t('Load a preset…')}</option>
          {PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {t(p.name)}
            </option>
          ))}
        </select>
        <button className="small" onClick={reverse} disabled={bends.length === 0}>
          {t('Reverse')}
        </button>
      </div>
      <p className="hint">{t('Flange lengths are measured the way the "Dimensions are" setting says. Each bend turns the sheet by its angle.')}</p>
      {lengths.map((len, i) => (
        <div key={i}>
          {i > 0 && (
            <div className="card bendrow">
              <div className="grid2">
                <NumberField label={t('Bend {0} angle', i)} value={bends[i - 1].angle} unit={null} suffix="°" bad={bad.has(`ang${i - 1}`)} onChange={(v) => setBend(i - 1, { angle: v })} />
                <label className="field">
                  <span>{t('Direction')}</span>
                  <select value={bends[i - 1].dir} onChange={(e) => setBend(i - 1, { dir: +e.target.value === -1 ? -1 : 1 })}>
                    <option value={1}>{t('Up')}</option>
                    <option value={-1}>{t('Down')}</option>
                  </select>
                </label>
              </div>
              <p className="hint" style={{ margin: 0 }}>{t('Up to {0}°. Hems and 180° folds need a separate allowance.', MAX_ANGLE)}</p>
            </div>
          )}
          <div className="row">
            <div style={{ flex: 1 }}>
              <NumberField label={t('Flange {0} length', i + 1)} value={len} unit={unit} suffix={unit} bad={bad.has(`len${i}`)} onChange={(v) => setLen(i, v)} />
            </div>
            <button className="small danger" aria-label={t('Remove flange {0}', i + 1)} disabled={lengths.length <= 1} onClick={() => remove(i)}>
              {t('Remove')}
            </button>
          </div>
        </div>
      ))}
      <button onClick={add}>{t('Add bend and flange')}</button>
    </div>
  )
}
