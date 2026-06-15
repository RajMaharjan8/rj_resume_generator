import {
  ACCENT_PRESETS,
  FONT_OPTIONS,
  type ResumeSettings,
  type TemplateId,
} from '../../types'

interface Props {
  settings: ResumeSettings
  onChange: (s: ResumeSettings) => void
}

const TEMPLATES: { id: TemplateId; label: string }[] = [
  { id: 'modern', label: 'Modern' },
  { id: 'classic', label: 'Classic' },
  { id: 'compact', label: 'Compact' },
]

export default function Customizer({ settings, onChange }: Props) {
  const set = <K extends keyof ResumeSettings>(key: K, value: ResumeSettings[K]) =>
    onChange({ ...settings, [key]: value })

  return (
    <div className="customizer">
      <div className="cz-group">
        <span className="cz-label">Template</span>
        <div className="seg">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`seg-btn ${settings.template === t.id ? 'active' : ''}`}
              onClick={() => set('template', t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="cz-group">
        <span className="cz-label">Accent</span>
        <div className="swatches">
          {ACCENT_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              className={`swatch ${settings.accent === c ? 'active' : ''}`}
              style={{ background: c }}
              onClick={() => set('accent', c)}
              title={c}
            />
          ))}
          <input
            type="color"
            className="color-input"
            value={settings.accent}
            onChange={(e) => set('accent', e.target.value)}
            title="Custom color"
          />
        </div>
      </div>

      <div className="cz-group">
        <span className="cz-label">Font</span>
        <select
          className="select"
          value={settings.fontFamily}
          onChange={(e) => set('fontFamily', e.target.value)}
        >
          {FONT_OPTIONS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <div className="cz-group">
        <span className="cz-label">Size {Math.round(settings.fontScale * 100)}%</span>
        <input
          type="range"
          min={0.8}
          max={1.2}
          step={0.05}
          value={settings.fontScale}
          onChange={(e) => set('fontScale', Number(e.target.value))}
        />
      </div>
    </div>
  )
}
