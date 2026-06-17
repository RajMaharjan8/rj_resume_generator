import {
  ACCENT_PRESETS,
  FONT_OPTIONS,
  RESUME_PRESETS,
  type ResumePreset,
  type ResumeSettings,
  type TemplateId,
} from '../../types'

interface Props {
  settings: ResumeSettings
  onChange: (s: ResumeSettings) => void
  // Apply a starter preset: replaces the resume content and its suggested look.
  onPreset?: (preset: ResumePreset) => void
}

const TEMPLATES: { id: TemplateId; label: string }[] = [
  { id: 'modern', label: 'Modern' },
  { id: 'classic', label: 'Classic' },
  { id: 'compact', label: 'Compact' },
  { id: 'sidebar', label: 'Sidebar' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'elegant', label: 'Elegant' },
]

export default function Customizer({ settings, onChange, onPreset }: Props) {
  const set = <K extends keyof ResumeSettings>(key: K, value: ResumeSettings[K]) =>
    onChange({ ...settings, [key]: value })

  return (
    <div className="customizer">
      {onPreset && (
        <div className="cz-group cz-group-wide">
          <span className="cz-label">Start from</span>
          <select
            className="select"
            value=""
            onChange={(e) => {
              const preset = RESUME_PRESETS.find((p) => p.id === e.target.value)
              if (
                preset &&
                window.confirm(
                  `Replace the current resume with the "${preset.label}" starter? Your saved sections in the library are kept.`,
                )
              ) {
                onPreset(preset)
              }
            }}
          >
            <option value="" disabled>
              Pick a starting point…
            </option>
            {RESUME_PRESETS.map((p) => (
              <option key={p.id} value={p.id} title={p.blurb}>
                {p.label} — {p.blurb}
              </option>
            ))}
          </select>
        </div>
      )}

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
