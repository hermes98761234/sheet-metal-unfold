import { useEffect, useMemo, useState } from 'react'
import { computeFlat, kFactor, type DimType } from './lib/bend'
import { suggestDie } from './lib/die'
import { flatPatternDxf } from './lib/dxf'
import { profileGeometry } from './lib/geometry'
import { DEFAULT_STATE, invalidFields, loadState, MATERIALS, materialOf, saveState, toUnit, type AppState, type Settings } from './lib/model'
import { tr, type T } from './i18n'
import NumberField from './components/NumberField'
import ProfileEditor from './components/ProfileEditor'
import { FlatView, ProfileView } from './components/Diagrams'
import { BendTable, Calibrator, DieBox } from './components/Panels'

export default function App() {
  const [state, setState] = useState<AppState>(loadState)
  const { settings, profile } = state
  const unit = settings.unit
  const t: T = (s, ...a) => tr(settings.lang, s, ...a)
  const bad = useMemo(() => invalidFields(state), [state])
  const update = (patch: Partial<AppState>) => setState((s) => ({ ...s, ...patch }))
  const setSettings = (patch: Partial<Settings>) => setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }))

  useEffect(() => saveState(state), [state])
  useEffect(() => {
    const root = document.documentElement
    if (settings.theme === 'auto') delete root.dataset.theme
    else root.dataset.theme = settings.theme
    root.lang = settings.lang
  }, [settings.theme, settings.lang])

  const mat = materialOf(state.material)
  const ok = bad.size === 0
  const k = state.kMode === 'table' ? kFactor(mat.hardness, state.radius, state.thickness) : state.kManual
  const flat = useMemo(
    () => (ok ? computeFlat({ thickness: state.thickness, radius: state.radius, k, dimType: state.dimType, lengths: profile.lengths, bends: profile.bends }) : null),
    [ok, state.thickness, state.radius, k, state.dimType, profile],
  )
  const geo = useMemo(
    () => (flat ? profileGeometry(flat.straights, profile.bends, state.radius, state.thickness) : null),
    [flat, profile.bends, state.radius, state.thickness],
  )
  const die = useMemo(() => (ok ? suggestDie(state.thickness, mat.uts) : null), [ok, state.thickness, mat.uts])

  const fmt = (mm: number, d = unit === 'in' ? 3 : 2) => `${+toUnit(mm, unit).toFixed(d)} ${unit}`
  const blocked = flat !== null && flat.tooShort.length > 0
  const mass = flat ? (flat.flatLength * state.width * state.thickness * mat.density) / 1e9 : 0
  const radiusLow = ok && state.radius < mat.minRadius * state.thickness

  const download = () => {
    if (!flat) return
    const labels = flat.bends.map((b, i) => `BEND ${i + 1} ${b.dir > 0 ? 'UP' : 'DOWN'} ${+b.angle.toFixed(1)} DEG R${+state.radius.toFixed(2)}`)
    const blob = new Blob([flatPatternDxf(flat, state.width, labels)], { type: 'application/dxf' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'flat-pattern.dxf'
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  const shortestFlange = Math.min(...profile.lengths)

  return (
    <div className="app">
      <header className="toolbar">
        <span className="brand">{t('Sheet metal unfold')}</span>
        <span className="hint">{t('Bend allowance, flat pattern, DXF and press-brake die.')}</span>
        <span className="spacer" />
        <label className="inline">
          {t('Units')}{' '}
          <select value={unit} onChange={(e) => setSettings({ unit: e.target.value === 'in' ? 'in' : 'mm' })}>
            <option value="mm">{t('Millimetres')}</option>
            <option value="in">{t('Inches')}</option>
          </select>
        </label>
        <label className="inline">
          {t('Language')}{' '}
          <select value={settings.lang} onChange={(e) => setSettings({ lang: e.target.value === 'uk' ? 'uk' : 'en' })}>
            <option value="en">English</option>
            <option value="uk">Українська</option>
          </select>
        </label>
        <label className="inline">
          {t('Theme')}{' '}
          <select value={settings.theme} onChange={(e) => setSettings({ theme: e.target.value === 'dark' ? 'dark' : e.target.value === 'light' ? 'light' : 'auto' })}>
            <option value="auto">{t('System')}</option>
            <option value="light">{t('Light')}</option>
            <option value="dark">{t('Dark')}</option>
          </select>
        </label>
      </header>
      <div className="body">
        <aside className="side">
          <div className="panel">
            <div className="section">
              <h3>{t('Sheet')}</h3>
              <label className="field">
                <span>{t('Material')}</span>
                <select value={state.material} onChange={(e) => update({ material: e.target.value })}>
                  {MATERIALS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {t(m.name)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid3">
                <NumberField label={t('Thickness')} value={state.thickness} unit={unit} suffix={unit} bad={bad.has('thickness')} onChange={(v) => update({ thickness: v })} />
                <NumberField label={t('Inside radius')} value={state.radius} unit={unit} suffix={unit} bad={bad.has('radius')} onChange={(v) => update({ radius: v })} />
                <NumberField label={t('Part width')} value={state.width} unit={unit} suffix={unit} bad={bad.has('width')} onChange={(v) => update({ width: v })} />
              </div>
              <button className="small" onClick={() => update({ radius: state.thickness * Math.max(1, mat.minRadius) })} disabled={!ok}>
                {t('Set radius to the minimum for this material')}
              </button>
            </div>
            <div className="section">
              <h3>{t('K-factor')}</h3>
              <div className="grid2">
                <label className="field">
                  <span>{t('Source')}</span>
                  <select value={state.kMode} onChange={(e) => update({ kMode: e.target.value === 'manual' ? 'manual' : 'table' })}>
                    <option value="table">{t('Table (air bending)')}</option>
                    <option value="manual">{t('Manual')}</option>
                  </select>
                </label>
                {state.kMode === 'manual' ? (
                  <NumberField label={t('K-factor')} value={state.kManual} unit={null} bad={bad.has('kManual')} onChange={(v) => update({ kManual: v })} />
                ) : (
                  <label className="field">
                    <span>{t('K-factor')}</span>
                    <input readOnly value={ok ? +k.toFixed(3) : ''} />
                  </label>
                )}
              </div>
              <p className="hint">{t('K locates the neutral line: 0.33 for tight bends up to 0.5 for large radii. It varies by shop and tooling, so calibrate with a test bend if accuracy matters.')}</p>
            </div>
            <div className="section">
              <h3>{t('Dimensions')}</h3>
              <label className="field">
                <span>{t('Dimensions are')}</span>
                <select value={state.dimType} onChange={(e) => update({ dimType: e.target.value as DimType })}>
                  <option value="outside">{t('Outside (to the outer virtual sharp)')}</option>
                  <option value="inside">{t('Inside (to the inner virtual sharp)')}</option>
                  <option value="flat">{t('Straight (tangent to tangent)')}</option>
                </select>
              </label>
            </div>
            <ProfileEditor profile={profile} unit={unit} bad={bad} t={t} onChange={(p) => update({ profile: p })} />
            <button className="small" onClick={() => setState({ ...DEFAULT_STATE, settings })}>
              {t('Reset')}
            </button>
          </div>
        </aside>
        <main className="main">
          <div className="box">
            <h3>{t('Result')}</h3>
            {!flat ? (
              <p className="verdict err">{t('Fix the highlighted fields.')}</p>
            ) : (
              <>
                <p className={`verdict ${blocked ? 'err' : 'ok'}`}>{t('Flat pattern length: {0}', fmt(flat.flatLength))}</p>
                <table className="data">
                  <tbody>
                    <tr>
                      <td>{t('Flat blank')}</td>
                      <td>{fmt(flat.flatLength)} × {fmt(state.width)}</td>
                    </tr>
                    <tr>
                      <td>{t('Sum of entered flanges')}</td>
                      <td>{fmt(flat.entered)}</td>
                    </tr>
                    <tr>
                      <td>{t('Total bend deduction')}</td>
                      <td>{fmt(flat.totalDeduction, 3)}</td>
                    </tr>
                    <tr>
                      <td>{t('Straight lengths')}</td>
                      <td>{flat.straights.map((s) => +toUnit(s, unit).toFixed(unit === 'in' ? 3 : 2)).join(' · ')} {unit}</td>
                    </tr>
                    <tr>
                      <td>{t('Blank mass')}</td>
                      <td>{+(unit === 'in' ? mass * 2.20462 : mass).toFixed(3)} {unit === 'in' ? t('lb') : t('kg')}</td>
                    </tr>
                  </tbody>
                </table>
                {flat.tooShort.map((i) => (
                  <p key={i} className="err-text">{t('Flange {0} is too short for its bends: its straight part would be negative.', i + 1)}</p>
                ))}
                {radiusLow && (
                  <p className="warn-text">{t('The radius is below the typical minimum for {0} ({1}); the outside may crack.', t(mat.name), fmt(mat.minRadius * state.thickness))}</p>
                )}
              </>
            )}
          </div>
          {flat && geo && (
            <>
              <div className="diagrams">
                <div className="box">
                  <h3>{t('Formed profile')}</h3>
                  <ProfileView geo={geo} thickness={state.thickness} unit={unit} t={t} />
                </div>
                <div className="box">
                  <h3>{t('Flat pattern')}</h3>
                  <FlatView flat={flat} width={state.width} unit={unit} t={t} />
                  <div className="row">
                    <button onClick={download} disabled={blocked}>
                      {t('Download DXF')}
                    </button>
                    <span className="hint">{t('Millimetres; layers CUT, BEND (dashed) and BEND_NOTES.')}</span>
                  </div>
                </div>
              </div>
              <div className="box">
                <h3>{t('Bends')}</h3>
                <BendTable flat={flat} k={k} unit={unit} t={t} />
              </div>
            </>
          )}
          {die && (
            <div className="box">
              <h3>{t('Press-brake V-die')}</h3>
              <DieBox die={die} thickness={state.thickness} radius={state.radius} width={state.width} flangeMin={shortestFlange} unit={unit} t={t} />
            </div>
          )}
          <Calibrator thickness={state.thickness} radius={state.radius} unit={unit} t={t} onUse={(kv) => update({ kMode: 'manual', kManual: kv })} />
        </main>
      </div>
      <p className="hint foot">
        {t('Estimates from standard formulas. Confirm with a test bend before cutting production parts.')}{' '}
        <a href="https://github.com/hermes98761234/sheet-metal-unfold">{t('Source on GitHub')}</a>
      </p>
    </div>
  )
}
