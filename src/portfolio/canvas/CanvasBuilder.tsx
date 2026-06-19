import { useRef, useState } from 'react'
import { ACCENT_PRESETS } from '../../types'
import {
  DESIGNS,
  PORTFOLIO_FONTS,
  type DesignId,
  type DesignMeta,
  type FooterLink,
  type PortfolioData,
} from '../types'
import { newId } from '../../types'
import {
  COLUMN_LAYOUTS,
  GRID,
  WIDGET_GROUPS,
  WIDGET_LABELS,
  newColumn,
  newRow,
  newSection,
  newWidget,
  sectionRows,
  type Column,
  type PageData,
  type Row,
  type Section,
  type Widget,
  type WidgetType,
} from './model'
import { buildDesignerPage, buildDesignSeed, blankPage } from './seed'
import WidgetEditor from './WidgetEditor'
import { footerInner, renderPageMain } from './renderPage'
import { siteCss, readableOn } from '../siteStyles'
import {
  ChevronIcon,
  GripIcon,
  LayoutIcon,
  PlusIcon,
  TrashIcon,
} from '../../components/atoms/icons'
import Footer from '../../components/atoms/Footer'
import { useAuth } from '../../auth/AuthContext'
import { GoogleIcon } from '../../components/atoms/icons'
import type { ResumeData } from '../../types'

interface Props {
  data: PortfolioData
  onChange: (data: PortfolioData) => void
  resume: ResumeData
  // Whether a user is signed in. When false, the builder still works but the
  // portfolio lives only in this browser — a banner makes that clear.
  signedIn?: boolean
  webBlocks?: { id: string; title: string }[]
}

export default function CanvasBuilder({ data, onChange, resume, signedIn = true }: Props) {
  const page: PageData = data.page ?? buildDesignerPage(resume)
  const [mode, setMode] = useState<'build' | 'preview'>('build')
  const [footerOpen, setFooterOpen] = useState(false)
  const [designOpen, setDesignOpen] = useState(false)

  const setPage = (p: PageData) => onChange({ ...data, page: p })
  const setSettings = (patch: Partial<PortfolioData['settings']>) =>
    onChange({ ...data, settings: { ...data.settings, ...patch } })

  // Apply a design. `withContent` also replaces the page with the design's
  // starter layout + its suggested accent/theme/font; otherwise it only swaps
  // the visual treatment and keeps the user's existing sections and colours.
  const applyDesign = (d: DesignMeta, withContent: boolean) => {
    if (withContent) {
      onChange({
        ...data,
        page: buildDesignSeed(d.id, resume),
        settings: {
          ...data.settings,
          design: d.id,
          accent: d.accent,
          theme: d.theme,
          fontFamily: d.fontFamily,
        },
      })
    } else {
      setSettings({ design: d.id })
    }
    setDesignOpen(false)
  }

  const updateSection = (s: Section) =>
    setPage({ ...page, sections: page.sections.map((x) => (x.id === s.id ? s : x)) })
  const removeSection = (id: string) =>
    setPage({ ...page, sections: page.sections.filter((x) => x.id !== id) })
  const moveSection = (id: string, dir: -1 | 1) => {
    const i = page.sections.findIndex((s) => s.id === id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= page.sections.length) return
    const next = [...page.sections]
    ;[next[i], next[j]] = [next[j], next[i]]
    setPage({ ...page, sections: next })
  }
  const addSection = (spans: number[]) => {
    setPage({ ...page, sections: [...page.sections, newSection(spans)] })
  }

  return (
    <div className="cv">
      {!signedIn && <GuestBanner />}
      <div className="cv-bar">
        <div className="cv-bar-left">
          <div className="seg sm">
            <button className={`seg-btn ${mode === 'build' ? 'active' : ''}`} onClick={() => setMode('build')}>Build</button>
            <button className={`seg-btn ${mode === 'preview' ? 'active' : ''}`} onClick={() => setMode('preview')}>Preview</button>
          </div>
        </div>
        <div className="cv-bar-right">
          <NavEditor
            sections={page.sections}
            onRename={(id, name) => updateSection({ ...page.sections.find((s) => s.id === id)!, name })}
            onToggle={(id, hide) => updateSection({ ...page.sections.find((s) => s.id === id)!, hideInNav: hide })}
            onMove={(id, dir) => moveSection(id, dir)}
          />
          <SiteSettings data={data} setSettings={setSettings} />
          <button className="btn ghost small" onClick={() => setDesignOpen(true)}>
            Designs
          </button>
          <button
            className="btn ghost small"
            onClick={() => {
              if (confirm('Start from a blank page?')) setPage(blankPage())
            }}
          >
            Blank
          </button>
        </div>
      </div>

      {mode === 'preview' ? (
        <PagePreview data={data} page={page} />
      ) : (
        <div className="cv-canvas" data-theme={data.settings.theme} data-design={data.settings.design ?? 'designer'}>
          <style>{siteCss(data, '.cv-canvas')}</style>
          <CanvasNav
            data={data}
            page={page}
            onToggleTheme={() =>
              setSettings({ theme: data.settings.theme === 'dark' ? 'light' : 'dark' })
            }
            onBrand={(siteTitle) => setSettings({ siteTitle })}
          />
          {page.sections.map((sec, i) => (
            <SectionView
              key={sec.id}
              section={sec}
              first={i === 0}
              last={i === page.sections.length - 1}
              onChange={updateSection}
              onRemove={() => removeSection(sec.id)}
              onMove={(d) => moveSection(sec.id, d)}
            />
          ))}
          <AddSectionBar onAdd={addSection} />
          <CanvasFooter data={data} onEdit={() => setFooterOpen(true)} />
        </div>
      )}

      {footerOpen && (
        <FooterEditor data={data} setSettings={setSettings} onClose={() => setFooterOpen(false)} />
      )}

      {designOpen && (
        <DesignGallery
          current={data.settings.design ?? 'designer'}
          onApply={applyDesign}
          onClose={() => setDesignOpen(false)}
        />
      )}

      <Footer />
    </div>
  )
}

// ---------------------------------------------------------------------------

// Shown when building without signing in: the work stays in this browser only
// (localStorage) and isn't synced to an account. Offers a one-click sign-in.
function GuestBanner() {
  const { signInWithGoogle, enabled } = useAuth()
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null
  return (
    <div className="cv-guest-banner" role="status">
      <span className="cv-guest-text">
        You’re building as a guest — this portfolio is saved only in this browser. Sign in to keep it
        on your account and across devices.
      </span>
      {enabled && (
        <button type="button" className="btn small cv-guest-signin" onClick={signInWithGoogle}>
          <GoogleIcon /> Sign in to save
        </button>
      )}
      <button
        type="button"
        className="cv-guest-x"
        aria-label="Dismiss"
        onClick={() => setDismissed(true)}
      >
        ×
      </button>
    </div>
  )
}

// CSS-variable overrides for a section with a custom background, mirroring
// renderPage's sectionBgStyle so the canvas matches the preview/export.
function sectionBgVars(color: string): Record<string, string> {
  const c = color.trim()
  const text = readableOn(c)
  const vars: Record<string, string> = {
    background: c,
    '--bg': c,
    '--soft': c,
    '--card': c,
  }
  if (text) {
    vars.color = text
    vars['--text'] = text
    vars['--muted'] = `color-mix(in srgb, ${text} 60%, ${c})`
    vars['--border'] = `color-mix(in srgb, ${text} 18%, ${c})`
  }
  return vars
}

function SectionView({
  section,
  first,
  last,
  onChange,
  onRemove,
  onMove,
}: {
  section: Section
  first: boolean
  last: boolean
  onChange: (s: Section) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
}) {
  const [openSettings, setOpenSettings] = useState(false)
  const rows = sectionRows(section)

  const setRow = (r: Row) =>
    onChange({ ...section, columns: undefined, rows: rows.map((x) => (x.id === r.id ? r : x)) })
  const addRow = (spans: number[], auto: boolean) =>
    onChange({ ...section, columns: undefined, rows: [...rows, newRow(spans, auto)] })
  const removeRow = (id: string) =>
    onChange({ ...section, columns: undefined, rows: rows.filter((r) => r.id !== id) })
  const moveRow = (id: string, dir: -1 | 1) => {
    const i = rows.findIndex((r) => r.id === id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= rows.length) return
    const next = [...rows]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange({ ...section, columns: undefined, rows: next })
  }

  const customBg = (section.bgColor ?? '').trim()
  return (
    <section
      className={`cv-section ${customBg ? 'bg-custom' : `bg-${section.bg ?? 'none'}`} pad-${section.pad ?? 'normal'} ${section.full ? 'is-full' : ''}`}
      style={customBg ? (sectionBgVars(customBg) as React.CSSProperties) : undefined}
    >
      <div className="cv-sec-toolbar">
        <span className="cv-sec-handle"><GripIcon /></span>
        <input
          className="cv-sec-name"
          value={section.name}
          onChange={(e) => onChange({ ...section, name: e.target.value })}
        />
        <div className="cv-sec-tools">
          <button title="Section settings" onClick={() => setOpenSettings((o) => !o)}><ChevronIcon /></button>
          <button title="Move up" disabled={first} onClick={() => onMove(-1)}>↑</button>
          <button title="Move down" disabled={last} onClick={() => onMove(1)}>↓</button>
          <button title="Delete section" className="danger" onClick={onRemove}><TrashIcon /></button>
        </div>
      </div>

      {openSettings && (
        <div className="cv-sec-settings">
          <label className={customBg ? 'is-disabled' : ''}>Background
            <select
              value={section.bg ?? 'none'}
              disabled={!!customBg}
              onChange={(e) => onChange({ ...section, bg: e.target.value as Section['bg'] })}
            >
              <option value="none">None</option>
              <option value="soft">Soft</option>
              <option value="accent">Accent</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <label>Custom colour
            <span className="cv-sec-color">
              <input
                type="color"
                className="color-input"
                value={customBg || '#ffffff'}
                onChange={(e) => onChange({ ...section, bgColor: e.target.value })}
                title="Custom section background"
              />
              {customBg ? (
                <button type="button" className="cv-sec-clear" onClick={() => onChange({ ...section, bgColor: undefined })}>
                  Clear
                </button>
              ) : (
                <span className="cv-sec-color-hint">overrides preset</span>
              )}
            </span>
          </label>
          <label>Spacing
            <select value={section.pad ?? 'normal'} onChange={(e) => onChange({ ...section, pad: e.target.value as Section['pad'] })}>
              <option value="compact">Compact</option>
              <option value="normal">Normal</option>
              <option value="roomy">Roomy</option>
            </select>
          </label>
          <label className="cv-check">
            <input type="checkbox" checked={!!section.full} onChange={(e) => onChange({ ...section, full: e.target.checked })} />
            Full width
          </label>
        </div>
      )}

      <div className="cv-container">
        {rows.map((row, i) => (
          <RowView
            key={row.id}
            row={row}
            first={i === 0}
            last={i === rows.length - 1}
            canRemove={rows.length > 1}
            onChange={setRow}
            onRemove={() => removeRow(row.id)}
            onMove={(d) => moveRow(row.id, d)}
          />
        ))}
        <AddRowBar onAdd={addRow} />
      </div>
    </section>
  )
}

// A single horizontal band of columns inside a section.
function RowView({
  row,
  first,
  last,
  canRemove,
  onChange,
  onRemove,
  onMove,
}: {
  row: Row
  first: boolean
  last: boolean
  canRemove: boolean
  onChange: (r: Row) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
}) {
  const cols = row.columns
  const setCol = (c: Column) => onChange({ ...row, columns: cols.map((x) => (x.id === c.id ? c : x)) })

  const nudge = (idx: number, delta: number) => {
    if (idx >= cols.length - 1) return
    const a = cols[idx].span + delta
    const b = cols[idx + 1].span - delta
    if (a < 1 || b < 1) return
    onChange({
      ...row,
      columns: cols.map((c, i) => (i === idx ? { ...c, span: a } : i === idx + 1 ? { ...c, span: b } : c)),
    })
  }

  const setLayout = (spans: number[], auto: boolean) => {
    const next: Column[] = spans.map((span, i) => {
      const existing = cols[i]
      return existing ? { ...existing, span } : newColumn(span)
    })
    if (cols.length > spans.length) {
      const overflow = cols.slice(spans.length).flatMap((c) => c.widgets)
      next[next.length - 1] = { ...next[next.length - 1], widgets: [...next[next.length - 1].widgets, ...overflow] }
    }
    onChange({ ...row, columns: next, auto: auto || undefined })
  }

  return (
    <div className="cv-rowwrap">
      <div className="cv-row-toolbar">
        <LayoutPicker current={cols.map((c) => c.span)} onPick={setLayout} />
        <button title="Move row up" disabled={first} onClick={() => onMove(-1)}>↑</button>
        <button title="Move row down" disabled={last} onClick={() => onMove(1)}>↓</button>
        <button title="Delete row" className="danger" disabled={!canRemove} onClick={onRemove}><TrashIcon /></button>
      </div>
      <div
        className={`cv-row ${row.auto ? 'is-auto' : ''}`}
        style={row.auto ? undefined : { gridTemplateColumns: `repeat(${GRID}, 1fr)` }}
      >
        {cols.map((col, i) => (
          <ColumnView
            key={col.id}
            column={col}
            auto={!!row.auto}
            onChange={setCol}
            showResize={!row.auto && i < cols.length - 1}
            onResize={(d) => nudge(i, d)}
          />
        ))}
      </div>
    </div>
  )
}

function AddRowBar({ onAdd }: { onAdd: (spans: number[], auto: boolean) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="cv-add-row">
      <button type="button" className="cv-add-row-btn" onClick={() => setOpen((o) => !o)}>
        <PlusIcon /> Add row
      </button>
      {open && (
        <>
          <div className="cv-pop-backdrop" onClick={() => setOpen(false)} />
          <div className="cv-layout-pop cv-add-row-pop">
            {COLUMN_LAYOUTS.map((l) => (
              <button
                key={l.label}
                className="cv-layout-opt"
                title={l.label}
                onClick={() => {
                  onAdd(l.spans, !!l.auto)
                  setOpen(false)
                }}
              >
                <span className="cv-layout-vis">
                  {l.spans.map((sp, i) => (<i key={i} style={{ flex: sp }} />))}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

function ColumnView({
  column,
  auto,
  onChange,
  showResize,
  onResize,
}: {
  column: Column
  auto?: boolean
  onChange: (c: Column) => void
  showResize: boolean
  onResize: (delta: number) => void
}) {
  const [picking, setPicking] = useState(false)
  const dragIdx = useRef<number | null>(null)

  const setWidget = (w: Widget) =>
    onChange({ ...column, widgets: column.widgets.map((x) => (x.id === w.id ? w : x)) })
  const removeWidget = (id: string) =>
    onChange({ ...column, widgets: column.widgets.filter((x) => x.id !== id) })
  const addWidget = (type: WidgetType) => {
    onChange({ ...column, widgets: [...column.widgets, newWidget(type)] })
    setPicking(false)
  }
  const reorder = (from: number, to: number) => {
    if (from === to) return
    const next = [...column.widgets]
    const [m] = next.splice(from, 1)
    next.splice(to, 0, m)
    onChange({ ...column, widgets: next })
  }

  return (
    <div className="cv-col" style={auto ? undefined : { gridColumn: `span ${column.span}` }}>
      {column.widgets.map((w, i) => (
        <div
          key={w.id}
          className="cv-widget"
          draggable
          onDragStart={() => (dragIdx.current = i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (dragIdx.current !== null) reorder(dragIdx.current, i)
            dragIdx.current = null
          }}
        >
          <div className="cv-w-toolbar">
            <span className="cv-w-type">{WIDGET_LABELS[w.type]}</span>
            <div className="cv-w-tools">
              <AlignButtons widget={w} onChange={setWidget} />
              <span className="cv-w-grip"><GripIcon /></span>
              <button className="danger" title="Delete" onClick={() => removeWidget(w.id)}><TrashIcon /></button>
            </div>
          </div>
          <WidgetEditor widget={w} onChange={setWidget} />
        </div>
      ))}

      <div className="cv-col-add">
        <button type="button" className="cv-add-widget" onClick={() => setPicking((p) => !p)} aria-expanded={picking}>
          <PlusIcon /> Add widget
        </button>
        {picking && <WidgetPicker onPick={addWidget} onClose={() => setPicking(false)} />}
      </div>

      {showResize && (
        <div className="cv-col-resize" title="Resize columns">
          <button onClick={() => onResize(-1)}>‹</button>
          <button onClick={() => onResize(1)}>›</button>
        </div>
      )}
    </div>
  )
}

function AlignButtons({ widget: w, onChange }: { widget: Widget; onChange: (w: Widget) => void }) {
  const can = ['heading', 'text', 'button', 'image', 'icon'].includes(w.type)
  if (!can) return null
  const a = w.align ?? 'left'
  return (
    <span className="cv-align">
      {(['left', 'center', 'right'] as const).map((al) => (
        <button key={al} className={a === al ? 'on' : ''} onClick={() => onChange({ ...w, align: al })} title={al}>
          {al === 'left' ? '⇤' : al === 'center' ? '⇆' : '⇥'}
        </button>
      ))}
    </span>
  )
}

// ---------------------------------------------------------------------------

function WidgetPicker({ onPick, onClose }: { onPick: (t: WidgetType) => void; onClose: () => void }) {
  return (
    <>
      <div className="cv-pop-backdrop" onClick={onClose} />
      <div className="cv-widget-pop">
        {WIDGET_GROUPS.map((g) => (
          <div key={g.group} className="cv-wp-group">
            <span className="cv-wp-label">{g.group}</span>
            <div className="cv-wp-items">
              {g.items.map((it) => (
                <button key={it.type} type="button" className="cv-wp-item" onClick={() => onPick(it.type)}>
                  {it.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function LayoutPicker({
  current,
  onPick,
}: {
  current: number[]
  onPick: (spans: number[], auto: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const curKey = current.join('-')
  return (
    <div className="cv-layout-pick">
      <button title="Column layout" onClick={() => setOpen((o) => !o)}><LayoutIcon /></button>
      {open && (
        <>
          <div className="cv-pop-backdrop" onClick={() => setOpen(false)} />
          <div className="cv-layout-pop">
            {COLUMN_LAYOUTS.map((l) => (
              <button
                key={l.label}
                className={`cv-layout-opt ${l.spans.join('-') === curKey ? 'on' : ''}`}
                title={l.label}
                onClick={() => {
                  onPick(l.spans, !!l.auto)
                  setOpen(false)
                }}
              >
                <span className="cv-layout-vis">
                  {l.spans.map((sp, i) => (
                    <i key={i} style={{ flex: sp }} />
                  ))}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function AddSectionBar({ onAdd }: { onAdd: (spans: number[]) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="cv-add-section">
      <button type="button" className="cv-add-section-btn" onClick={() => setOpen((o) => !o)}>
        <PlusIcon /> Add section
      </button>
      {open && (
        <div className="cv-add-section-pop">
          <span className="cv-wp-label">Choose a column layout</span>
          <div className="cv-layout-row">
            {COLUMN_LAYOUTS.map((l) => (
              <button
                key={l.label}
                className="cv-layout-opt"
                onClick={() => {
                  onAdd(l.spans)
                  setOpen(false)
                }}
              >
                <span className="cv-layout-vis">
                  {l.spans.map((sp, i) => (
                    <i key={i} style={{ flex: sp }} />
                  ))}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

// Designs gallery — a modal of full visual treatments. Each card shows a small
// live thumbnail (real siteCss scoped to the card) and two actions: swap just
// the look, or load the matching starter layout + colours too.
function DesignGallery({
  current,
  onApply,
  onClose,
}: {
  current: DesignId
  onApply: (d: DesignMeta, withContent: boolean) => void
  onClose: () => void
}) {
  return (
    <>
      <div className="cv-modal-backdrop" onClick={onClose} />
      <div className="cv-modal cv-design-modal" role="dialog" aria-label="Choose a design">
        <div className="cv-modal-head">
          <h3>Designs</h3>
          <button className="cv-modal-x" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="cv-modal-body">
          <p className="cv-nav-hint">
            Pick a look. <strong>Use this design</strong> also loads a matching starter layout and colours;
            <strong> Apply style</strong> restyles your current page only. Everything stays fully editable.
          </p>
          <div className="cv-design-grid">
            {DESIGNS.map((d) => (
              <DesignCard key={d.id} design={d} active={d.id === current} onApply={onApply} />
            ))}
          </div>
        </div>
        <div className="cv-modal-foot">
          <button className="btn" onClick={onClose}>Done</button>
        </div>
      </div>
    </>
  )
}

function DesignCard({
  design,
  active,
  onApply,
}: {
  design: DesignMeta
  active: boolean
  onApply: (d: DesignMeta, withContent: boolean) => void
}) {
  // A scoped, self-contained stylesheet for this card's thumbnail so each
  // preview shows its own accent/theme/design without touching the page.
  const scope = `.dt-${design.id}`
  const thumbData: PortfolioData = {
    settings: {
      ...defaultThumbSettings,
      accent: design.accent,
      theme: design.theme,
      fontFamily: design.fontFamily,
      design: design.id,
    },
    blocks: [],
  }
  return (
    <div className={`cv-design-card ${active ? 'is-active' : ''}`}>
      <div className={`cv-design-thumb dt-${design.id}`} data-theme={design.theme} data-design={design.id}>
        <style>{siteCss(thumbData, scope)}</style>
        <div className="pf-hero" style={{ padding: 0 }}>
          <span className="pf-hero-mark" aria-hidden="true">{design.label.charAt(0)}</span>
          <div className="dt-body">
            <span className="dt-eyebrow">Portfolio</span>
            <span className="pf-hero-name dt-name">{design.label}<span className="pf-dot">.</span></span>
            <span className="pf-btn dt-btn">Contact</span>
            <span className="pf-section-title dt-sec">Selected work</span>
            <span className="dt-cards"><i /><i /></span>
          </div>
        </div>
      </div>
      <div className="cv-design-meta">
        <span className="cv-design-name">{design.label}{active && <em> · current</em>}</span>
        <p className="cv-design-blurb">{design.blurb}</p>
        <div className="cv-design-actions">
          <button
            className="btn small"
            onClick={() => {
              if (confirm(`Load the "${design.label}" starter layout and colours? This replaces your current sections.`)) {
                onApply(design, true)
              }
            }}
          >
            Use this design
          </button>
          <button className="btn ghost small" onClick={() => onApply(design, false)}>
            Apply style only
          </button>
        </div>
      </div>
    </div>
  )
}

// Minimal settings for a thumbnail's scoped CSS (footer/links unused there).
const defaultThumbSettings = {
  siteTitle: '',
  contactEmail: '',
} as unknown as PortfolioData['settings']

// ---------------------------------------------------------------------------

// Footer builder — edit the footer text, toggle the email link, and add custom
// links (social, etc.). Opens as a centered modal from the canvas footer.
function FooterEditor({
  data,
  setSettings,
  onClose,
}: {
  data: PortfolioData
  setSettings: (patch: Partial<PortfolioData['settings']>) => void
  onClose: () => void
}) {
  const links = data.settings.footerLinks ?? []
  const setLink = (id: string, patch: Partial<FooterLink>) =>
    setSettings({ footerLinks: links.map((l) => (l.id === id ? { ...l, ...patch } : l)) })
  const addLink = () =>
    setSettings({ footerLinks: [...links, { id: newId(), label: '', url: '' }] })
  const removeLink = (id: string) =>
    setSettings({ footerLinks: links.filter((l) => l.id !== id) })

  return (
    <>
      <div className="cv-modal-backdrop" onClick={onClose} />
      <div className="cv-modal" role="dialog" aria-label="Edit footer">
        <div className="cv-modal-head">
          <h3>Footer</h3>
          <button className="cv-modal-x" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="cv-modal-body">
          <label className="cz-group">
            <span className="cz-label">Footer text</span>
            <input
              className="input"
              value={data.settings.footerText ?? '© {year} {title}'}
              onChange={(e) => setSettings({ footerText: e.target.value })}
            />
            <span className="cv-nav-hint">Use <code>{'{year}'}</code> and <code>{'{title}'}</code> as placeholders.</span>
          </label>

          <label className="cv-check cz-group">
            <input
              type="checkbox"
              checked={data.settings.footerShowEmail !== false}
              onChange={(e) => setSettings({ footerShowEmail: e.target.checked })}
            />
            Show contact email link {data.settings.contactEmail ? `(${data.settings.contactEmail})` : '(set email in Site settings)'}
          </label>

          <div className="cz-group">
            <span className="cz-label">Footer links</span>
            <div className="cv-foot-links">
              {links.map((l) => (
                <div key={l.id} className="cv-foot-link-row">
                  <input className="input" value={l.label} placeholder="Label (e.g. Instagram)" onChange={(e) => setLink(l.id, { label: e.target.value })} />
                  <input className="input" value={l.url} placeholder="URL or email" onChange={(e) => setLink(l.id, { url: e.target.value })} />
                  <button type="button" className="cw-x" onClick={() => removeLink(l.id)}><TrashIcon /></button>
                </div>
              ))}
              <button type="button" className="cw-add" onClick={addLink}><PlusIcon /> Add link</button>
            </div>
          </div>
        </div>
        <div className="cv-modal-foot">
          <button className="btn" onClick={onClose}>Done</button>
        </div>
      </div>
    </>
  )
}

// One simple place to manage the single-page nav menu: rename links, show/hide
// them, reorder. Each link scroll-jumps to its section automatically.
function NavEditor({
  sections,
  onRename,
  onToggle,
  onMove,
}: {
  sections: Section[]
  onRename: (id: string, name: string) => void
  onToggle: (id: string, hide: boolean) => void
  onMove: (id: string, dir: -1 | 1) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="cv-site-settings">
      <button className="btn ghost small" onClick={() => setOpen((o) => !o)}>Menu</button>
      {open && (
        <>
          <div className="cv-pop-backdrop" onClick={() => setOpen(false)} />
          <div className="cv-settings-pop cv-nav-pop">
            <span className="cv-wp-label">Navigation menu</span>
            <p className="cv-nav-hint">Each link jumps to its section. Rename, hide, or reorder them here.</p>
            <div className="cv-nav-list">
              {sections.map((s, i) => (
                <div key={s.id} className={`cv-nav-item ${s.hideInNav ? 'is-hidden' : ''}`}>
                  <input
                    className="input"
                    value={s.name}
                    onChange={(e) => onRename(s.id, e.target.value)}
                  />
                  <button
                    type="button"
                    className="cv-nav-eye"
                    title={s.hideInNav ? 'Show in menu' : 'Hide from menu'}
                    onClick={() => onToggle(s.id, !s.hideInNav)}
                  >
                    {s.hideInNav ? 'Show' : 'Hide'}
                  </button>
                  <button type="button" title="Up" disabled={i === 0} onClick={() => onMove(s.id, -1)}>↑</button>
                  <button type="button" title="Down" disabled={i === sections.length - 1} onClick={() => onMove(s.id, 1)}>↓</button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function SiteSettings({
  data,
  setSettings,
}: {
  data: PortfolioData
  setSettings: (patch: Partial<PortfolioData['settings']>) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="cv-site-settings">
      <button className="btn ghost small" onClick={() => setOpen((o) => !o)}>Site settings</button>
      {open && (
        <>
          <div className="cv-pop-backdrop" onClick={() => setOpen(false)} />
          <div className="cv-settings-pop">
            <label className="cz-group">
              <span className="cz-label">Site title</span>
              <input className="input" value={data.settings.siteTitle} onChange={(e) => setSettings({ siteTitle: e.target.value })} />
            </label>
            <label className="cz-group">
              <span className="cz-label">Contact email</span>
              <input className="input" value={data.settings.contactEmail} placeholder="you@example.com" onChange={(e) => setSettings({ contactEmail: e.target.value })} />
            </label>
            <div className="cz-group">
              <span className="cz-label">Accent</span>
              <div className="swatches">
                {ACCENT_PRESETS.map((c) => (
                  <button key={c} type="button" className={`swatch ${data.settings.accent === c ? 'active' : ''}`} style={{ background: c }} onClick={() => setSettings({ accent: c })} />
                ))}
                <input type="color" className="color-input" value={data.settings.accent} onChange={(e) => setSettings({ accent: e.target.value })} />
              </div>
            </div>
            <label className="cz-group">
              <span className="cz-label">Font</span>
              <select className="select" value={data.settings.fontFamily} onChange={(e) => setSettings({ fontFamily: e.target.value })}>
                {PORTFOLIO_FONTS.map((f) => (<option key={f.value} value={f.value}>{f.label}</option>))}
              </select>
            </label>
            <div className="cz-group">
              <span className="cz-label">Theme</span>
              <div className="seg sm">
                <button type="button" className={`seg-btn ${data.settings.theme === 'light' ? 'active' : ''}`} onClick={() => setSettings({ theme: 'light' })}>Light</button>
                <button type="button" className={`seg-btn ${data.settings.theme === 'dark' ? 'active' : ''}`} onClick={() => setSettings({ theme: 'dark' })}>Dark</button>
              </div>
            </div>
            <div className="cz-group">
              <span className="cz-label">Page background</span>
              <div className="cv-sec-color">
                <input
                  type="color"
                  className="color-input"
                  value={(data.settings.pageBg ?? '').trim() || (data.settings.theme === 'dark' ? '#0e0f13' : '#ffffff')}
                  onChange={(e) => setSettings({ pageBg: e.target.value })}
                  title="Custom page background"
                />
                {(data.settings.pageBg ?? '').trim() ? (
                  <button type="button" className="cv-sec-clear" onClick={() => setSettings({ pageBg: undefined })}>
                    Reset
                  </button>
                ) : (
                  <span className="cv-sec-color-hint">uses theme default</span>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'section'

// Live nav rendered on the build canvas — looks like the exported header, with
// an editable brand, anchor links to each section, and a working theme toggle.
function CanvasNav({
  data,
  page,
  onToggleTheme,
  onBrand,
}: {
  data: PortfolioData
  page: PageData
  onToggleTheme: () => void
  onBrand: (title: string) => void
}) {
  const scrollTo = (id: string) => {
    document
      .querySelector(`.cv-canvas #${id}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  return (
    <header className="pf-nav cv-nav">
      <div className="pf-container pf-nav-inner">
        <input
          className="pf-brand cv-brand-input"
          value={data.settings.siteTitle}
          onChange={(e) => onBrand(e.target.value)}
          aria-label="Site title"
        />
        <div className="pf-nav-right">
          <nav className="pf-links">
            {page.sections
              .filter((s) => !s.hideInNav)
              .map((s) => (
                <a key={s.id} href={`#${slug(s.name)}`} onClick={(e) => { e.preventDefault(); scrollTo(slug(s.name)) }}>
                  {s.name}
                </a>
              ))}
          </nav>
          <button
            className="pf-theme-toggle"
            title={`Switch to ${data.settings.theme === 'dark' ? 'light' : 'dark'} theme`}
            onClick={onToggleTheme}
          >
            ◐
          </button>
        </div>
      </div>
    </header>
  )
}

function CanvasFooter({ data, onEdit }: { data: PortfolioData; onEdit: () => void }) {
  // Render the real footer markup so it matches the export; show {year} as the
  // current year on the canvas (the export fills it via script.js).
  const html = footerInner(data).replace(
    '<span id="pf-year"></span>',
    String(new Date().getFullYear()),
  )
  return (
    <footer className="pf-footer cv-footer">
      <button type="button" className="cv-footer-edit" onClick={onEdit} title="Edit footer">
        Edit footer
      </button>
      <div className="pf-container pf-footer-inner" dangerouslySetInnerHTML={{ __html: html }} />
    </footer>
  )
}

function PagePreview({ data, page }: { data: PortfolioData; page: PageData }) {
  return (
    <div className="pf-preview-wrap">
      <style>{siteCss(data, '.pf-preview')}</style>
      <div className="pf-preview" data-theme={data.settings.theme} data-design={data.settings.design ?? 'designer'} dangerouslySetInnerHTML={{ __html: renderPageMain(page) }} />
    </div>
  )
}
