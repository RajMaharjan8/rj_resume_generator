import { useEffect, useRef } from 'react'
import { newId } from '../../types'
import type { PortfolioItem, ServiceItem, SkillItem, Widget } from './model'
import { useImageUpload } from './useImageUpload'
import { ImageIcon, PlusIcon, TrashIcon } from '../../components/atoms/icons'

interface Props {
  widget: Widget
  onChange: (w: Widget) => void
}

// A contentEditable line/area that commits on blur (keeps cursor stable).
function Editable({
  html,
  tag = 'div',
  className,
  placeholder,
  onCommit,
}: {
  html: string
  tag?: 'div' | 'h1' | 'h2' | 'h3' | 'span'
  className?: string
  placeholder?: string
  onCommit: (html: string) => void
}) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== html) ref.current.innerHTML = html
  }, [html])
  const Tag = tag as 'div'
  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`ce ${className ?? ''}`}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onBlur={(e) => onCommit((e.target as HTMLElement).innerHTML)}
    />
  )
}

export default function WidgetEditor({ widget: w, onChange }: Props) {
  const img = useImageUpload()
  const set = (patch: Partial<Widget>) => onChange({ ...w, ...patch })

  switch (w.type) {
    case 'heading': {
      const Tag = `h${w.level ?? 2}` as 'h2'
      return (
        <Editable
          tag={Tag}
          className={`pf-w-heading pf-align-${w.align ?? 'left'}`}
          html={w.text ?? ''}
          placeholder="Heading…"
          onCommit={(html) => set({ text: html.replace(/<[^>]+>/g, '') })}
        />
      )
    }
    case 'text':
      return (
        <Editable
          className={`pf-w-text pf-align-${w.align ?? 'left'}`}
          html={w.html ?? ''}
          placeholder="Write something…"
          onCommit={(html) => set({ html })}
        />
      )
    case 'button':
      return (
        <div className={`pf-w-btn-wrap pf-align-${w.align ?? 'left'}`}>
          <span className="pf-btn ce-btn">
            <Editable
              tag="span"
              html={w.text ?? ''}
              placeholder="Button"
              onCommit={(html) => set({ text: html.replace(/<[^>]+>/g, '') })}
            />
          </span>
          <input
            className="ce-url"
            value={w.url ?? ''}
            placeholder="Link URL or email"
            onChange={(e) => set({ url: e.target.value })}
          />
        </div>
      )
    case 'icon':
      return (
        <div className={`pf-w-icon pf-align-${w.align ?? 'left'}`}>
          <input
            className="ce-icon"
            value={w.text ?? ''}
            maxLength={3}
            onChange={(e) => set({ text: e.target.value })}
          />
        </div>
      )
    case 'image': {
      const shape = w.shape ?? (w.rounded ? 'rounded' : 'square')
      const width = w.width ?? 100
      return (
        <div className={`cw-image pf-align-${w.align ?? 'left'}`}>
          {w.src ? (
            <img
              className={`pf-w-image shape-${shape}`}
              style={{ width: `${width}%` }}
              src={w.src}
              alt={w.alt ?? ''}
            />
          ) : (
            <button type="button" className="cw-img-drop" onClick={() => img.pick((src) => set({ src }))}>
              <ImageIcon /> {img.busy ? 'Processing…' : 'Upload image'}
            </button>
          )}
          {w.src && (
            <div className="cw-img-controls">
              <div className="cw-img-actions">
                <button type="button" onClick={() => img.pick((src) => set({ src }))}>Replace</button>
                <button type="button" onClick={() => set({ src: '' })}>Remove</button>
              </div>
              <div className="cw-img-row">
                <span className="cw-img-lbl">Shape</span>
                <div className="seg sm cw-shape-seg">
                  {(['square', 'rounded', 'circle'] as const).map((sh) => (
                    <button
                      key={sh}
                      type="button"
                      className={`seg-btn ${shape === sh ? 'active' : ''}`}
                      onClick={() => set({ shape: sh, rounded: undefined })}
                    >
                      {sh === 'square' ? 'Square' : sh === 'rounded' ? 'Rounded' : 'Circle'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="cw-img-row">
                <span className="cw-img-lbl">Size</span>
                <input
                  type="range"
                  min={20}
                  max={100}
                  value={width}
                  onChange={(e) => set({ width: Number(e.target.value) })}
                />
                <span className="cw-img-val">{width}%</span>
              </div>
            </div>
          )}
          {img.error && <p className="cw-err">{img.error}</p>}
        </div>
      )
    }
    case 'spacer':
      return (
        <div className="cw-spacer" style={{ height: w.height ?? 32 }}>
          <input
            type="range"
            min={8}
            max={200}
            value={w.height ?? 32}
            onChange={(e) => set({ height: Number(e.target.value) })}
          />
          <span>{w.height ?? 32}px spacer</span>
        </div>
      )
    case 'video':
      return (
        <div className="cw-video">
          <input
            className="input"
            value={w.url ?? ''}
            placeholder="YouTube or Vimeo URL"
            onChange={(e) => set({ url: e.target.value })}
          />
          {w.url && <p className="cw-hint">Video embeds in the preview & exported site.</p>}
        </div>
      )
    case 'skillbar':
      return <SkillEditor skills={w.skills ?? []} onChange={(skills) => set({ skills })} />
    case 'services':
      return <ServicesEditor items={w.services ?? []} onChange={(services) => set({ services })} />
    case 'gallery':
      return <ItemsEditor items={w.items ?? []} onChange={(items) => set({ items })} gallery />
    case 'portfolio':
      return <ItemsEditor items={w.items ?? []} onChange={(items) => set({ items })} />
    case 'contact':
      return <ContactEditor widget={w} onChange={onChange} />
    default:
      return <div className="cw-unknown">Unsupported widget</div>
  }
}

function SkillEditor({ skills, onChange }: { skills: SkillItem[]; onChange: (s: SkillItem[]) => void }) {
  const upd = (id: string, patch: Partial<SkillItem>) =>
    onChange(skills.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  return (
    <div className="cw-skills">
      {skills.map((s) => (
        <div key={s.id} className="cw-skill-row">
          <input value={s.label} placeholder="Skill" onChange={(e) => upd(s.id, { label: e.target.value })} />
          <input
            type="number"
            min={0}
            max={100}
            value={s.pct}
            onChange={(e) => upd(s.id, { pct: Number(e.target.value) })}
          />
          <span>%</span>
          <button type="button" className="cw-x" onClick={() => onChange(skills.filter((x) => x.id !== s.id))}>
            <TrashIcon />
          </button>
        </div>
      ))}
      <button
        type="button"
        className="cw-add"
        onClick={() => onChange([...skills, { id: newId(), label: '', pct: 80 }])}
      >
        <PlusIcon /> Add skill
      </button>
    </div>
  )
}

function ServicesEditor({ items, onChange }: { items: ServiceItem[]; onChange: (s: ServiceItem[]) => void }) {
  const upd = (id: string, patch: Partial<ServiceItem>) =>
    onChange(items.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  return (
    <div className="cw-svc-grid">
      {items.map((s) => (
        <div key={s.id} className="cw-svc-card">
          <div className="cw-svc-top">
            <input className="cw-svc-icon" value={s.icon} maxLength={2} onChange={(e) => upd(s.id, { icon: e.target.value })} />
            <button type="button" className="cw-x" onClick={() => onChange(items.filter((x) => x.id !== s.id))}>
              <TrashIcon />
            </button>
          </div>
          <input className="cw-svc-title" value={s.title} placeholder="Service title" onChange={(e) => upd(s.id, { title: e.target.value })} />
          <textarea className="cw-svc-desc" value={s.desc} placeholder="Short description" rows={2} onChange={(e) => upd(s.id, { desc: e.target.value })} />
        </div>
      ))}
      <button
        type="button"
        className="cw-add cw-svc-add"
        onClick={() => onChange([...items, { id: newId(), icon: 'A', title: '', desc: '' }])}
      >
        <PlusIcon /> Add service
      </button>
    </div>
  )
}

function ItemsEditor({
  items,
  onChange,
  gallery,
}: {
  items: PortfolioItem[]
  onChange: (i: PortfolioItem[]) => void
  gallery?: boolean
}) {
  const img = useImageUpload()
  const upd = (id: string, patch: Partial<PortfolioItem>) =>
    onChange(items.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  return (
    <div className="cw-items">
      <div className="cw-item-grid">
        {items.map((it) => (
          <div key={it.id} className="cw-item">
            {it.image ? (
              <img src={it.image} alt={it.title} onClick={() => img.pick((image) => upd(it.id, { image }))} />
            ) : (
              <button type="button" className="cw-item-drop" onClick={() => img.pick((image) => upd(it.id, { image }))}>
                <ImageIcon />
              </button>
            )}
            <input value={it.title} placeholder="Title" onChange={(e) => upd(it.id, { title: e.target.value })} />
            {!gallery && (
              <input value={it.link} placeholder="Link (optional)" onChange={(e) => upd(it.id, { link: e.target.value })} />
            )}
            <button type="button" className="cw-x" onClick={() => onChange(items.filter((x) => x.id !== it.id))}>
              <TrashIcon />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="cw-item-add"
          onClick={() => onChange([...items, { id: newId(), image: '', title: '', link: '' }])}
        >
          <PlusIcon /> Add item
        </button>
      </div>
      {img.error && <p className="cw-err">{img.error}</p>}
    </div>
  )
}

function ContactEditor({ widget: w, onChange }: { widget: Widget; onChange: (w: Widget) => void }) {
  const cols = w.cols ?? []
  const upd = (id: string, patch: Partial<(typeof cols)[number]>) =>
    onChange({ ...w, cols: cols.map((c) => (c.id === id ? { ...c, ...patch } : c)) })
  return (
    <div className="cw-contact">
      <div className="cw-contact-cols">
        {cols.map((c) => (
          <div key={c.id} className="cw-contact-col">
            <input value={c.label} placeholder="Label" onChange={(e) => upd(c.id, { label: e.target.value })} />
            <input value={c.value} placeholder="Value" onChange={(e) => upd(c.id, { value: e.target.value })} />
          </div>
        ))}
      </div>
      <div className="cw-contact-btn">
        <input value={w.text ?? ''} placeholder="Button label" onChange={(e) => onChange({ ...w, text: e.target.value })} />
        <input value={w.url ?? ''} placeholder="Button link" onChange={(e) => onChange({ ...w, url: e.target.value })} />
      </div>
    </div>
  )
}
