import { useState } from 'react'
import { fromUnit, toUnit, type Unit } from '../lib/model'

type Props = {
  label: string
  /** Value in millimetres, or a plain number when `unit` is null. */
  value: number
  unit: Unit | null
  bad: boolean
  suffix?: string
  onChange: (v: number) => void
}

/**
 * A number shown in the chosen unit and stored in mm. While focused it keeps the raw text,
 * so typing "1" on the way to "1.5" isn't reformatted. Unparsable input gives NaN, which validation flags.
 */
export default function NumberField({ label, value, unit, bad, suffix, onChange }: Props) {
  const [draft, setDraft] = useState<string | null>(null)
  const conv = (v: number) => (unit ? toUnit(v, unit) : v)
  const shown = Number.isFinite(value) ? String(+conv(value).toFixed(4)) : ''
  return (
    <label className="field">
      <span>
        {label}
        {suffix ? ` (${suffix})` : ''}
      </span>
      <input
        type="number"
        inputMode="decimal"
        step="any"
        className={bad ? 'bad' : undefined}
        aria-invalid={bad}
        value={draft ?? shown}
        onChange={(e) => {
          const v = e.target.value.trim()
          setDraft(e.target.value)
          onChange(v === '' ? NaN : unit ? fromUnit(Number(v), unit) : Number(v))
        }}
        onBlur={() => setDraft(null)}
      />
    </label>
  )
}
