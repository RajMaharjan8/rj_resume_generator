import { useState } from 'react'
import { ACCENT_PRESETS, type Block } from '../types'
import { useDragList } from '../useDragList'
import { PORTFOLIO_FONTS, type BlockStyle, type PortfolioData } from './types'
import PortfolioBlockEditor from './PortfolioBlockEditor'
import PortfolioPreview from './PortfolioPreview'
import { PlusIcon } from '../components/atoms/icons'

interface Props {
  data: PortfolioData
  onChange: (data: PortfolioData) => void
  // Insert a saved web block from "My web blocks".
  onInsertFromLibrary?: (templateId: string) => void
  // Replace the whole portfolio with the reference "Designer" template.
  onLoadDesigner?: () => void
}

export default function PortfolioBuilder({ data, onChange, onInsertFromLibrary, onLoadDesigner }: Props) {
  const [tab, setTab] = useState<'edit' | 'preview'>('edit')
  const [adding, setAdding] = useState(false)
  const blockDrag = useDragList(data.blocks, (blocks) => onChange({ ...data, blocks }))
  const styles = data.styles ?? {}
  const lib = data.blockLibrary ?? []

  const setSettings = (patch: Partial<PortfolioData['settings']>) =>
    onChange({ ...data, settings: { ...data.settings, ...patch } })
  const updateBlock = (b: Block) =>
    onChange({ ...data, blocks: data.blocks.map((x) => (x.id === b.id ? b : x)) })
  const removeBlock = (id: string) => {
    const { [id]: _drop, ...restStyles } = styles
    void _drop
    onChange({ ...data, blocks: data.blocks.filter((x) => x.id !== id), styles: restStyles })
  }
  const setStyle = (id: string, style: BlockStyle) =>
    onChange({ ...data, styles: { ...styles, [id]: style } })

  return (
    <>
      <div className="mobile-tabs">
        <button className={tab === 'edit' ? 'active' : ''} onClick={() => setTab('edit')}>Edit</button>
        <button className={tab === 'preview' ? 'active' : ''} onClick={() => setTab('preview')}>Preview</button>
      </div>

      <main className="layout">
        <div className={`pane left ${tab === 'edit' ? '' : 'hide-mobile'}`}>
          <div className="customizer">
            <div className="cz-group">
              <span className="cz-label">Site title</span>
              <input className="input" value={data.settings.siteTitle} onChange={(e) => setSettings({ siteTitle: e.target.value })} />
            </div>
            <div className="cz-group">
              <span className="cz-label">Contact email</span>
              <input className="input" value={data.settings.contactEmail} placeholder="you@example.com" onChange={(e) => setSettings({ contactEmail: e.target.value })} />
            </div>
            <div className="cz-group">
              <span className="cz-label">Accent</span>
              <div className="swatches">
                {ACCENT_PRESETS.map((c) => (
                  <button key={c} type="button" className={`swatch ${data.settings.accent === c ? 'active' : ''}`} style={{ background: c }} onClick={() => setSettings({ accent: c })} />
                ))}
                <input type="color" className="color-input" value={data.settings.accent} onChange={(e) => setSettings({ accent: e.target.value })} />
              </div>
            </div>
            <div className="cz-group">
              <span className="cz-label">Font</span>
              <select className="select" value={data.settings.fontFamily} onChange={(e) => setSettings({ fontFamily: e.target.value })}>
                {PORTFOLIO_FONTS.map((f) => (<option key={f.value} value={f.value}>{f.label}</option>))}
              </select>
            </div>
            <div className="cz-group">
              <span className="cz-label">Theme</span>
              <div className="seg sm">
                <button type="button" className={`seg-btn ${data.settings.theme === 'light' ? 'active' : ''}`} onClick={() => setSettings({ theme: 'light' })}>Light</button>
                <button type="button" className={`seg-btn ${data.settings.theme === 'dark' ? 'active' : ''}`} onClick={() => setSettings({ theme: 'dark' })}>Dark</button>
              </div>
            </div>
            {onLoadDesigner && (
              <div className="cz-group">
                <span className="cz-label">Template</span>
                <button
                  type="button"
                  className="btn ghost small"
                  onClick={() => {
                    if (confirm('Replace your current portfolio with the Designer template?')) onLoadDesigner()
                  }}
                >
                  Load Designer template
                </button>
              </div>
            )}
          </div>

          <div className="editor">
            {data.blocks.map((block, i) => (
              <div key={block.id} className="block-drag-wrap" {...blockDrag.rowProps(i)}>
                <PortfolioBlockEditor
                  block={block}
                  style={styles[block.id]}
                  onChange={updateBlock}
                  onStyleChange={(st) => setStyle(block.id, st)}
                  onRemove={() => removeBlock(block.id)}
                  dragHandleProps={blockDrag.handleProps(i)}
                />
              </div>
            ))}

            <div className="add-section">
              <button type="button" className="add-section-btn" onClick={() => setAdding((a) => !a)} aria-expanded={adding}>
                <PlusIcon /> Add section
              </button>
              {adding && (
                <div className="add-section-menu">
                  {lib.length === 0 ? (
                    <p className="add-section-empty">
                      No web blocks yet — open <strong>My web blocks</strong> at the top to create one.
                    </p>
                  ) : (
                    <>
                      <span className="add-section-label">Insert a web block</span>
                      {lib.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          className="add-section-pick"
                          onClick={() => {
                            onInsertFromLibrary?.(b.id)
                            setAdding(false)
                          }}
                        >
                          <PlusIcon /> {b.title}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={`pane right ${tab === 'preview' ? '' : 'hide-mobile'}`}>
          <PortfolioPreview data={data} />
        </div>
      </main>
    </>
  )
}
