import { importanceLabels, importanceLevels } from "./types"
import type { Importance } from "./types"

type ImportanceSelectProps = {
  id: string
  form: string
  value: Importance
  onChange: (value: Importance) => void
  autoFocus?: boolean
}

function ImportanceSelect({ id, form, value, onChange, autoFocus }: ImportanceSelectProps) {
  return (
    <>
      <label className="visually-hidden" htmlFor={id}>Importance</label>
      <select id={id} form={form} value={value} autoFocus={autoFocus}
        onChange={(event) => onChange(Number(event.target.value) as Importance)}>
        {importanceLevels.map((level) => (
          <option key={level} value={level}>{level} · {importanceLabels[level]}</option>
        ))}
      </select>
    </>
  )
}

export default ImportanceSelect
