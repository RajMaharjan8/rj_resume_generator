import { useMemo, useState } from 'react'
import {
  f as makeField,
  type Block,
  type FieldDef,
  type FieldType,
  type GridItem,
} from '../types'
import Modal from '../components/atoms/Modal'
import AddFieldBar from '../components/molecules/AddFieldBar'
import LayoutCanvasModal from '../components/organisms/LayoutCanvasModal'
import { GripIcon, LayoutIcon, TrashIcon } from '../components/atoms/icons'
import { useDragList } from '../useDragList'
import { webBlockFromFields, type BlockAlign, type BlockBg, type BlockPad, type BlockStyle } from './types'

interface Props {
  onClose: () => void
  onSave: (block: Block, style: BlockStyle) => void
  initial?: Block
  initialStyle?: BlockStyle
  existing?: Block[]
}

const TYPE_LABEL: Partial<Record<FieldType, string>> = {
  text: 'Text',
  textarea: 'Rich text',
  list: 'List',
  tags: 'Tags',
  skillbar: 'Skill bars',
  button: 'Button',
  image: 'Image',
  repeater: 'Repeater',
}
const ALLOWED: FieldType[] = ['text', 'textarea', 'image', 'button', 'skillbar', 'tags', 'list', 'repeater']

const BGS: { v: BlockBg; label: string }[] = [
  { v: 'none', label: 'None' },
  { v: 'soft', label: 'Soft' },
  { v: 'accent', label: 'Accent' },
  { v: 'dark', label: 'Dark' },
]
const PADS: { v: BlockPad; label: string }[] = [
  { v: 'compact', label: 'Compact' },
  { v: 'normal', label: 'Normal' },
  { v: 'roomy', label: 'Roomy' },
]
const ALIGNS: { v: BlockAlign; label: string }[] = [
  { v: 'left', label: 'Left' },
  { v: 'center', label: 'Center' },
]

function makeOf(type: FieldType, label: string): FieldDef {
  if (type === 'repeater')
    return makeField.repeater(label, [makeField.text('Title'), makeField.textarea('Description'), makeField.image('Image')])
  return makeField[type](label)
}

export default function PortfolioCreateBlockModal({ onClose, onSave, initial, initialStyle, existing = [] }: Props) {
  const editing = Boolean(initial)
  const [title, setTitle] = useState(initial?.title ?? '')
  const [fields, setFields] = useState<FieldDef[]>(
    initial ? initial.fields.map((f) => ({ ...f })) : [makeField.text('Heading')],
  )
  const [grid, setGrid] = useState<GridItem[] | undefined>(initial?.grid)
  const [style, setStyle] = useState<BlockStyle>(initialStyle ?? {})
  const [layoutOpen, setLayoutOpen] = useState(false)

  const drag = useDragList(fields, setFields)

  const addField = (type: FieldType) =>
    setFields((prev) => [...prev, makeOf(type, TYPE_LABEL[type] ?? 'Field')])
  const rename = (id: string, label: string) =>
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, label } : f)))
  const remove = (id: string) => setFields((prev) => prev.filter((f) => f.id !== id))

  const trimmed = title.trim()
  const duplicate = existing.some(
    (b) => b.id !== initial?.id && b.title.trim().toLowerCase() === trimmed.toLowerCase(),
  )
  const canSave = trimmed.length > 0 && fields.length > 0 && !duplicate

  const ids = new Set(fields.map((f) => f.id))
  const cleanGrid = grid?.filter((g) => ids.has(g.fieldId))

  const save = () => {
    if (!canSave) return
    const base = webBlockFromFields(title, fields)
    const block: Block = editing && initial ? { ...base, id: initial.id, grid: cleanGrid } : { ...base, grid: cleanGrid }
    onSave(block, style)
    onClose()
  }

  const draft: Block = useMemo(
    () => ({ ...webBlockFromFields(title || 'Section', fields), grid: cleanGrid }),
    [title, fields, cleanGrid],
  )

  return (
    <Modal
      title={editing ? 'Edit web block' : 'Create a web block'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn ghost mr-auto" disabled={fields.length === 0} onClick={() => setLayoutOpen(true)}>
            <LayoutIcon /> Layout
          </button>
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn primary" disabled={!canSave} onClick={save}>
            {editing ? 'Save changes' : 'Create block'}
          </button>
        </>
      }
    >
      <label className="field">
        <span className="field-label">Section title (required)</span>
        <input className="input" autoFocus placeholder="e.g. Hero, About, Projects" value={title} onChange={(e) => setTitle(e.target.value)} />
        {trimmed.length === 0 && <span className="fl-hint cb-required">Give your section a title.</span>}
        {trimmed.length > 0 && duplicate && <span className="fl-hint cb-required">A block named “{trimmed}” already exists.</span>}
      </label>

      <div className="cb-fields-head"><span className="field-label">Section style</span></div>
      <div className="pf-style-row">
        <label className="pf-style-ctrl">
          <span className="fl-layout-label">Background</span>
          <select className="select" value={style.bg ?? 'none'} onChange={(e) => setStyle({ ...style, bg: e.target.value as BlockBg })}>
            {BGS.map((o) => (<option key={o.v} value={o.v}>{o.label}</option>))}
          </select>
        </label>
        <label className="pf-style-ctrl">
          <span className="fl-layout-label">Spacing</span>
          <select className="select" value={style.pad ?? 'normal'} onChange={(e) => setStyle({ ...style, pad: e.target.value as BlockPad })}>
            {PADS.map((o) => (<option key={o.v} value={o.v}>{o.label}</option>))}
          </select>
        </label>
        <label className="pf-style-ctrl">
          <span className="fl-layout-label">Align</span>
          <select className="select" value={style.align ?? 'left'} onChange={(e) => setStyle({ ...style, align: e.target.value as BlockAlign })}>
            {ALIGNS.map((o) => (<option key={o.v} value={o.v}>{o.label}</option>))}
          </select>
        </label>
      </div>

      <div className="cb-fields-head">
        <span className="field-label">Fields</span>
        <span className="fl-hint">drag to reorder · click a name to rename</span>
      </div>
      <div className="cb-fields">
        {fields.map((field, i) => (
          <div key={field.id} className="cb-field-block">
            <div className="cb-field-row" {...drag.rowProps(i)}>
              <span className="drag-handle small" {...drag.handleProps(i)}><GripIcon /></span>
              <input className="cb-name" value={field.label} onChange={(e) => rename(field.id, e.target.value)} placeholder="Field name" />
              <span className="cb-type">{TYPE_LABEL[field.type] ?? field.type}</span>
              <button type="button" className="icon-btn danger tiny" title="Remove field" onClick={() => remove(field.id)}>
                <TrashIcon />
              </button>
            </div>
          </div>
        ))}
        {fields.length === 0 && <p className="cb-empty">Add at least one field below.</p>}
      </div>

      <AddFieldBar onAdd={addField} only={ALLOWED} />

      {layoutOpen && (
        <LayoutCanvasModal block={draft} onClose={() => setLayoutOpen(false)} onSave={setGrid} />
      )}
    </Modal>
  )
}
